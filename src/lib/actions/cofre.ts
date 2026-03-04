"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
    arTitles,
    accountsPayable,
    partners,
    partnerLedger,
    distributions,
    users,
    timeEntries,
    cases,
    clients,
} from "@/lib/db/schema";
import { sql, and, eq } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type CofreKPIs = {
    faturamentoBruto: number;
    impostos: number;
    custosOperacionais: number;
    resultadoLiquido: number;
    margemLiquida: number;
};

export type PartnerInfo = {
    id: string;
    name: string;
    sharePercentage: number;
    ledgerBalance: number;
};

export type ClientRentabilidade = {
    clientId: string;
    clientName: string;
    receita: number;
    horas: number;
    custos: number;
    margem: number;
};

export type DistributionInfo = {
    id: string;
    period: string;
    totalValue: number;
    status: string;
    breakdown: unknown;
    createdAt: string;
};

export type CofreData = {
    kpis: CofreKPIs;
    partners: PartnerInfo[];
    distributions: DistributionInfo[];
    rentabilidade: ClientRentabilidade[];
    year: number;
};

// ============================================================================
// Query
// ============================================================================

const TAX_RATE = 14.53 / 100;

export async function getCofreData(): Promise<CofreData> {
    const session = await auth();
    if (!session?.user) return fallbackCofre();

    const now = new Date();
    const year = now.getFullYear();

    try {
        // ── 1. Revenue YTD from arTitles (paid) ──
        const [revenueRow] = await db
            .select({
                total: sql<string>`COALESCE(SUM(${arTitles.paidValue}), 0)`,
            })
            .from(arTitles)
            .where(
                and(
                    eq(arTitles.status, "paid"),
                    sql`EXTRACT(YEAR FROM ${arTitles.paidDate}) = ${year}`,
                ),
            );
        const faturamentoBruto = parseFloat(revenueRow?.total ?? "0");

        // ── 2. Expenses YTD from accountsPayable (paid) ──
        const [expenseRow] = await db
            .select({
                total: sql<string>`COALESCE(SUM(${accountsPayable.value}), 0)`,
            })
            .from(accountsPayable)
            .where(
                and(
                    eq(accountsPayable.status, "paid"),
                    sql`EXTRACT(YEAR FROM ${accountsPayable.paidDate}) = ${year}`,
                ),
            );
        const custosOperacionais = parseFloat(expenseRow?.total ?? "0");

        // ── 3. Tax estimate ──
        const impostos = Math.round(faturamentoBruto * TAX_RATE);

        // ── 4. Resultado Líquido ──
        const resultadoLiquido = faturamentoBruto - impostos - custosOperacionais;
        const margemLiquida = faturamentoBruto > 0
            ? Math.round((resultadoLiquido / faturamentoBruto) * 1000) / 10
            : 0;

        // ── 5. Partners with ledger balance ──
        const partnerRows = await db
            .select({
                id: partners.id,
                userName: users.name,
                sharePercentage: partners.sharePercentage,
            })
            .from(partners)
            .leftJoin(users, eq(partners.userId, users.id))
            .where(eq(partners.isActive, true));

        const partnerInfos: PartnerInfo[] = [];
        for (const p of partnerRows) {
            const [ledgerRow] = await db
                .select({
                    balance: sql<string>`COALESCE(
                        (SELECT ${partnerLedger.balanceAfter}
                         FROM ${partnerLedger}
                         WHERE ${partnerLedger.partnerId} = ${p.id}
                         ORDER BY ${partnerLedger.createdAt} DESC
                         LIMIT 1),
                        0
                    )`,
                })
                .from(sql`(SELECT 1) AS _dummy`);

            partnerInfos.push({
                id: p.id,
                name: p.userName ?? "Socio",
                sharePercentage: parseFloat(p.sharePercentage),
                ledgerBalance: parseFloat(ledgerRow?.balance ?? "0"),
            });
        }

        // ── 6. Recent distributions ──
        const distRows = await db
            .select()
            .from(distributions)
            .orderBy(sql`${distributions.createdAt} DESC`)
            .limit(10);

        const distInfos: DistributionInfo[] = distRows.map((d) => ({
            id: d.id,
            period: d.period ?? "",
            totalValue: parseFloat(d.totalValue),
            status: d.status ?? "simulated",
            breakdown: d.breakdown,
            createdAt: d.createdAt?.toISOString() ?? "",
        }));

        // ── 7. Rentabilidade per client (revenue from AR, hours from time entries) ──
        const clientRevenueRows = await db
            .select({
                clientId: arTitles.clientId,
                clientName: clients.companyName,
                totalRevenue: sql<string>`COALESCE(SUM(${arTitles.paidValue}), 0)`,
            })
            .from(arTitles)
            .leftJoin(clients, eq(arTitles.clientId, clients.id))
            .where(
                and(
                    eq(arTitles.status, "paid"),
                    sql`EXTRACT(YEAR FROM ${arTitles.paidDate}) = ${year}`,
                ),
            )
            .groupBy(arTitles.clientId, clients.companyName)
            .orderBy(sql`COALESCE(SUM(${arTitles.paidValue}), 0) DESC`);

        // Hours per client via cases → time entries
        const clientHoursRows = await db
            .select({
                clientId: cases.clientId,
                totalMinutes: sql<string>`COALESCE(SUM(${timeEntries.durationMinutes}), 0)`,
            })
            .from(timeEntries)
            .innerJoin(cases, eq(timeEntries.caseId, cases.id))
            .where(
                sql`EXTRACT(YEAR FROM ${timeEntries.date}) = ${year}`,
            )
            .groupBy(cases.clientId);

        const hoursMap = new Map<string, number>();
        for (const h of clientHoursRows) {
            hoursMap.set(h.clientId, parseInt(h.totalMinutes) || 0);
        }

        // Estimate cost: average hourly cost rate (total expenses / total hours)
        const totalMinutes = Array.from(hoursMap.values()).reduce((s, m) => s + m, 0);
        const avgCostPerMinute = totalMinutes > 0 ? custosOperacionais / totalMinutes : 0;

        const rentabilidade: ClientRentabilidade[] = clientRevenueRows.map((cr) => {
            const receita = parseFloat(cr.totalRevenue);
            const minutes = hoursMap.get(cr.clientId) ?? 0;
            const horas = Math.round(minutes / 6) / 10; // 1 decimal place
            const custos = Math.round(minutes * avgCostPerMinute);
            const margem = receita > 0 ? Math.round(((receita - custos) / receita) * 1000) / 10 : 0;

            return {
                clientId: cr.clientId,
                clientName: cr.clientName ?? "Cliente",
                receita,
                horas,
                custos,
                margem,
            };
        });

        return {
            kpis: { faturamentoBruto, impostos, custosOperacionais, resultadoLiquido, margemLiquida },
            partners: partnerInfos,
            distributions: distInfos,
            rentabilidade,
            year,
        };
    } catch (err) {
        console.error("[getCofreData]", err);
        return fallbackCofre();
    }
}

// ============================================================================
// Fallback
// ============================================================================

function fallbackCofre(): CofreData {
    return {
        kpis: {
            faturamentoBruto: 820000,
            impostos: -86100,
            custosOperacionais: -247980,
            resultadoLiquido: 485920,
            margemLiquida: 59.2,
        },
        partners: [
            { id: "p1", name: "Fernando Arruda", sharePercentage: 50, ledgerBalance: 0 },
            { id: "p2", name: "Jose Rafael", sharePercentage: 50, ledgerBalance: 0 },
        ],
        distributions: [],
        rentabilidade: [
            { clientId: "c1", clientName: "Grupo Sequoia", receita: 135000, custos: 24300, margem: 82, horas: 312 },
            { clientId: "c2", clientName: "TechCorp BR", receita: 98000, custos: 24500, margem: 75, horas: 245 },
            { clientId: "c3", clientName: "Industria Metal SP", receita: 42000, custos: 15120, margem: 64, horas: 128 },
            { clientId: "c4", clientName: "Construtora Horizonte", receita: 78000, custos: 28860, margem: 63, horas: 198 },
            { clientId: "c5", clientName: "Logistica Express", receita: 56000, custos: 22400, margem: 60, horas: 156 },
            { clientId: "c6", clientName: "Farmaceutica Vida", receita: 64000, custos: 27520, margem: 57, horas: 172 },
            { clientId: "c7", clientName: "Auto Pecas Nacional", receita: 38000, custos: 17860, margem: 53, horas: 104 },
        ],
        year: new Date().getFullYear(),
    };
}
