"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { arTitles, accountsPayable } from "@/lib/db/schema";
import { sql, and, eq } from "drizzle-orm";

// ============================================================================
// Types (mirroring the page's DRERow shape)
// ============================================================================

export type RowTipo = "header" | "item" | "deducao" | "subtotal" | "destaque" | "margem" | "spacer";

export type DRERow = {
    key: string;
    label: string;
    tipo: RowTipo;
    months: number[];       // 12 values [Jan..Dec]
    forecast?: number[];    // 12 forecast values
    isMargem?: boolean;
};

export type DREData = {
    rows: DRERow[];
    realizedThrough: number;  // 0-indexed month (e.g. 1 = Feb)
    year: number;
};

// ============================================================================
// Category mapping for AP expense breakdown
// ============================================================================

const FOLHA_CATEGORIES = ["salarios", "folha", "encargos", "ferias", "13o", "beneficios"];
const INFRA_CATEGORIES = ["aluguel", "condominio", "software", "ti", "assinaturas", "infraestrutura", "livros", "telefone", "internet"];
const MARKETING_CATEGORIES = ["marketing", "comercial", "publicidade", "eventos"];

function categorizeAP(category: string | null): "folha" | "infra" | "marketing" | "outros" {
    const lower = (category ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (FOLHA_CATEGORIES.some((c) => lower.includes(c))) return "folha";
    if (INFRA_CATEGORIES.some((c) => lower.includes(c))) return "infra";
    if (MARKETING_CATEGORIES.some((c) => lower.includes(c))) return "marketing";
    return "outros";
}

// ============================================================================
// Query
// ============================================================================

export async function getDREData(): Promise<DREData> {
    const session = await auth();
    if (!session?.user) return fallbackDRE();

    const now = new Date();
    const year = now.getFullYear();
    const realizedThrough = Math.max(now.getMonth() - 1, 0); // prev month

    try {
        // ── Revenue: AR titles paid this year, grouped by month ──
        const arRows = await db
            .select({
                month: sql<string>`EXTRACT(MONTH FROM ${arTitles.paidDate})::int`,
                total: sql<string>`COALESCE(SUM(${arTitles.paidValue}), 0)`,
            })
            .from(arTitles)
            .where(
                and(
                    eq(arTitles.status, "paid"),
                    sql`EXTRACT(YEAR FROM ${arTitles.paidDate}) = ${year}`,
                ),
            )
            .groupBy(sql`EXTRACT(MONTH FROM ${arTitles.paidDate})::int`);

        const revenueByMonth = new Array(12).fill(0);
        for (const r of arRows) {
            const m = parseInt(String(r.month)) - 1; // 0-indexed
            if (m >= 0 && m < 12) revenueByMonth[m] = parseFloat(r.total) || 0;
        }

        // ── Expenses: AP paid this year, grouped by month + category ──
        const apRows = await db
            .select({
                month: sql<string>`EXTRACT(MONTH FROM ${accountsPayable.paidDate})::int`,
                category: accountsPayable.category,
                total: sql<string>`COALESCE(SUM(${accountsPayable.value}), 0)`,
            })
            .from(accountsPayable)
            .where(
                and(
                    eq(accountsPayable.status, "paid"),
                    sql`EXTRACT(YEAR FROM ${accountsPayable.paidDate}) = ${year}`,
                ),
            )
            .groupBy(sql`EXTRACT(MONTH FROM ${accountsPayable.paidDate})::int`, accountsPayable.category);

        const folhaByMonth = new Array(12).fill(0);
        const infraByMonth = new Array(12).fill(0);
        const marketingByMonth = new Array(12).fill(0);
        const outrosByMonth = new Array(12).fill(0);

        for (const r of apRows) {
            const m = parseInt(String(r.month)) - 1;
            if (m < 0 || m >= 12) continue;
            const val = parseFloat(r.total) || 0;
            const cat = categorizeAP(r.category);
            if (cat === "folha") folhaByMonth[m] += val;
            else if (cat === "infra") infraByMonth[m] += val;
            else if (cat === "marketing") marketingByMonth[m] += val;
            else outrosByMonth[m] += val;
        }

        const totalExpenseByMonth = revenueByMonth.map((_, i) =>
            folhaByMonth[i] + infraByMonth[i] + marketingByMonth[i] + outrosByMonth[i],
        );

        // ── Tax deductions (estimate 14.53% of revenue — Simples Nacional) ──
        const TAX_RATE = 14.53 / 100;
        const deductionByMonth = revenueByMonth.map((r) => -Math.round(r * TAX_RATE));
        const netRevenueByMonth = revenueByMonth.map((r, i) => r + deductionByMonth[i]);

        // ── EBITDA = net revenue - expenses ──
        const ebitdaByMonth = netRevenueByMonth.map((r, i) => r - totalExpenseByMonth[i]);

        // ── FCF margin ──
        const margemByMonth = revenueByMonth.map((r, i) =>
            r > 0 ? Math.round(((ebitdaByMonth[i]) / r) * 1000) / 10 : 0,
        );

        // ── Forecast: simple projection based on average of realized months ──
        const realizedCount = realizedThrough + 1;
        const avgRevenue = realizedCount > 0 ? revenueByMonth.slice(0, realizedCount).reduce((a, b) => a + b, 0) / realizedCount : 0;
        const avgFolha = realizedCount > 0 ? folhaByMonth.slice(0, realizedCount).reduce((a, b) => a + b, 0) / realizedCount : 0;
        const avgInfra = realizedCount > 0 ? infraByMonth.slice(0, realizedCount).reduce((a, b) => a + b, 0) / realizedCount : 0;
        const avgMarketing = realizedCount > 0 ? marketingByMonth.slice(0, realizedCount).reduce((a, b) => a + b, 0) / realizedCount : 0;

        const forecastRevenue = new Array(12).fill(0).map((_, i) => i <= realizedThrough ? revenueByMonth[i] : Math.round(avgRevenue * (1 + 0.02 * (i - realizedThrough))));
        const forecastFolha = new Array(12).fill(0).map((_, i) => i <= realizedThrough ? folhaByMonth[i] : Math.round(avgFolha));
        const forecastInfra = new Array(12).fill(0).map((_, i) => i <= realizedThrough ? infraByMonth[i] : Math.round(avgInfra));
        const forecastMarketing = new Array(12).fill(0).map((_, i) => i <= realizedThrough ? marketingByMonth[i] : Math.round(avgMarketing));
        const forecastExpense = forecastRevenue.map((_, i) => forecastFolha[i] + forecastInfra[i] + forecastMarketing[i]);
        const forecastDeduction = forecastRevenue.map((r) => -Math.round(r * TAX_RATE));
        const forecastNet = forecastRevenue.map((r, i) => r + forecastDeduction[i]);
        const forecastEbitda = forecastNet.map((r, i) => r - forecastExpense[i]);
        const forecastMargem = forecastRevenue.map((r, i) => r > 0 ? Math.round((forecastEbitda[i] / r) * 1000) / 10 : 0);

        const rows: DRERow[] = [
            { key: "receita-bruta", label: "1. Receita Bruta (Faturamento Real + Projetado)", tipo: "header", months: revenueByMonth, forecast: forecastRevenue },
            { key: "deducoes", label: "Deducoes (Impostos SN — 14,53%)", tipo: "deducao", months: deductionByMonth, forecast: forecastDeduction },
            { key: "receita-liquida", label: "2. Receita Liquida", tipo: "subtotal", months: netRevenueByMonth, forecast: forecastNet },
            { key: "spacer-1", label: "", tipo: "spacer", months: new Array(12).fill(0) },
            { key: "despesas-operacionais", label: "3. Despesas Operacionais (AP)", tipo: "header", months: totalExpenseByMonth.map((v) => -v), forecast: forecastExpense.map((v) => -v) },
            { key: "folha", label: "3.1. Folha de Pagamento & Encargos", tipo: "item", months: folhaByMonth.map((v) => -v), forecast: forecastFolha.map((v) => -v) },
            { key: "infra", label: "3.2. Infraestrutura (Aluguel, Software, TI)", tipo: "item", months: infraByMonth.map((v) => -v), forecast: forecastInfra.map((v) => -v) },
            { key: "marketing", label: "3.3. Marketing & Comercial", tipo: "item", months: marketingByMonth.map((v) => -v), forecast: forecastMarketing.map((v) => -v) },
            { key: "ebitda", label: "4. EBITDA (Resultado Operacional)", tipo: "subtotal", months: ebitdaByMonth, forecast: forecastEbitda },
            { key: "spacer-2", label: "", tipo: "spacer", months: new Array(12).fill(0) },
            { key: "fcf", label: "5. Caixa Livre Gerado (FCF)", tipo: "destaque", months: ebitdaByMonth, forecast: forecastEbitda },
            { key: "margem-fcf", label: "Margem FCF (%)", tipo: "margem", isMargem: true, months: margemByMonth, forecast: forecastMargem },
        ];

        return { rows, realizedThrough, year };
    } catch (err) {
        console.error("[getDREData]", err);
        return fallbackDRE();
    }
}

// ============================================================================
// Fallback — matches original mock structure
// ============================================================================

function fallbackDRE(): DREData {
    return {
        rows: [
            { key: "receita-bruta", label: "1. Receita Bruta (Faturamento Real + Projetado)", tipo: "header", months: [132000, 138045, 145200, 152000, 155000, 158000, 162000, 165000, 168000, 172000, 175000, 180000], forecast: [130000, 135000, 143000, 150000, 153000, 156000, 160000, 163000, 166000, 170000, 173000, 178000] },
            { key: "deducoes", label: "Deducoes (Impostos SN — 14,53%)", tipo: "deducao", months: [-19180, -20057, -21097, -22085, -22522, -22948, -23543, -23973, -24410, -24991, -25428, -26154], forecast: [-18890, -19610, -20778, -21795, -22221, -22667, -23248, -23684, -24096, -24701, -25138, -25859] },
            { key: "receita-liquida", label: "2. Receita Liquida", tipo: "subtotal", months: [112820, 117988, 124103, 129915, 132478, 135052, 138457, 141027, 143590, 147009, 149572, 153846], forecast: [111110, 115390, 122222, 128205, 130779, 133333, 136752, 139316, 141904, 145299, 147862, 152141] },
            { key: "spacer-1", label: "", tipo: "spacer", months: Array(12).fill(0) },
            { key: "despesas-operacionais", label: "3. Despesas Operacionais (AP)", tipo: "header", months: [-71000, -72500, -75000, -76200, -77000, -77500, -78000, -78500, -79000, -79500, -80000, -81000], forecast: [-70000, -71500, -74000, -75000, -76000, -76500, -77000, -77500, -78000, -78500, -79000, -80000] },
            { key: "folha", label: "3.1. Folha de Pagamento & Encargos", tipo: "item", months: [-45000, -45000, -45000, -45000, -45000, -45000, -46000, -46000, -46000, -46000, -47000, -47000], forecast: [-44000, -44000, -44000, -44000, -45000, -45000, -45000, -45000, -46000, -46000, -46000, -46000] },
            { key: "infra", label: "3.2. Infraestrutura (Aluguel, Software, TI)", tipo: "item", months: [-15000, -15500, -16000, -16200, -16500, -16500, -16500, -17000, -17000, -17000, -17000, -18000], forecast: [-15000, -15000, -15500, -15500, -15500, -15500, -16000, -16000, -16000, -16000, -17000, -17000] },
            { key: "marketing", label: "3.3. Marketing & Comercial", tipo: "item", months: [-11000, -12000, -14000, -15000, -15500, -16000, -15500, -15500, -16000, -16500, -16000, -16000], forecast: [-11000, -12500, -14500, -15500, -15500, -15500, -16000, -16500, -16000, -16500, -16000, -17000] },
            { key: "ebitda", label: "4. EBITDA (Resultado Operacional)", tipo: "subtotal", months: [41820, 45488, 49103, 53715, 55478, 57552, 60457, 62527, 64590, 67509, 69572, 72846], forecast: [41110, 43890, 48222, 53205, 54779, 56833, 59752, 61816, 63904, 66799, 68862, 72141] },
            { key: "spacer-2", label: "", tipo: "spacer", months: Array(12).fill(0) },
            { key: "fcf", label: "5. Caixa Livre Gerado (FCF)", tipo: "destaque", months: [41820, 45488, 49103, 53715, 55478, 57552, 60457, 62527, 64590, 67509, 69572, 72846], forecast: [41110, 43890, 48222, 53205, 54779, 56833, 59752, 61816, 63904, 66799, 68862, 72141] },
            { key: "margem-fcf", label: "Margem FCF (%)", tipo: "margem", isMargem: true, months: [31.68, 32.95, 33.81, 35.34, 35.79, 36.43, 37.32, 37.89, 38.45, 39.25, 39.76, 40.47], forecast: [31.62, 32.51, 33.72, 35.47, 35.80, 36.43, 37.35, 37.92, 38.49, 39.29, 39.82, 40.52] },
        ],
        realizedThrough: 1,
        year: 2026,
    };
}
