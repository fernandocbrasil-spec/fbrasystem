// =============================================================================
// PF Advogados ERP — Financial Forecast Engine
// Calculates rolling 3-month projections, dashboard KPIs, cashflow chart data,
// and risk items. All queries use existing tables (no new schema).
// =============================================================================

import { derivePeriod, derivePreviousPeriod } from "./cap";
import { db } from "@/lib/db";
import {
    arTitles,
    accountsPayable,
    billingPlans,
    preInvoices,
    invoices,
    timeEntries,
    clients,
} from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MonthForecast = {
    period: string;
    label: string;
    revenueFixed: number;
    revenueVariable: number;
    revenuePendingPI: number;
    revenueTotal: number;
    receipts0to7: number;
    receipts8to30: number;
    receipts31to60: number;
    receipts60plus: number;
    receiptsTotal: number;
    expensesPending: number;
    expensesApproved: number;
    expensesTotal: number;
    netCash: number;
    netCashBest: number;
    netCashWorst: number;
};

export type RollingForecast = {
    months: MonthForecast[];
    generatedAt: string;
};

export type AgingBucket = {
    label: string;
    count: number;
    value: number;
};

export type DashboardKPIs = {
    faturado: number;
    recebido: number;
    emAberto: number;
    vencido: number;
    faturadoTrend: number;
    recebidoTrend: number;
    emAbertoTrend: number;
    vencidoTrend: number;
    revenue30d: number;
    revenue60d: number;
    revenue90d: number;
    preInvoicesPendingCount: number;
    preInvoicesPendingValue: number;
    agingBuckets: AgingBucket[];
};

export type CashflowChartData = {
    months: string[];
    receita: number[];
    despesa: number[];
    projecao: number[];
};

export type RiskItem = {
    id: string;
    tipo: "ar_vencido" | "ap_grande" | "caso_cap";
    descricao: string;
    cliente: string;
    valor: number;
    diasVencido?: number;
    percentualCap?: number;
    severity: "alto" | "medio" | "baixo";
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function periodBounds(period: string): { start: string; end: string } {
    const [y, m] = period.split("-").map(Number);
    const nextMonth = m === 12 ? 1 : m + 1;
    const nextYear = m === 12 ? y + 1 : y;
    return {
        start: `${period}-01`,
        end: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
    };
}

function getRollingPeriods(basePeriod: string): string[] {
    const periods = [basePeriod];
    let current = basePeriod;
    for (let i = 0; i < 2; i++) {
        const [y, m] = current.split("-").map(Number);
        const nextM = m === 12 ? 1 : m + 1;
        const nextY = m === 12 ? y + 1 : y;
        current = `${nextY}-${String(nextM).padStart(2, "0")}`;
        periods.push(current);
    }
    return periods;
}

function periodLabel(period: string): string {
    const [y, m] = period.split("-").map(Number);
    return `${MONTH_NAMES[m - 1]}/${String(y).slice(2)}`;
}

function trend(curr: number, prev: number): number {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / Math.abs(prev)) * 100;
}

function daysBetween(dateA: string, dateB: string): number {
    return Math.ceil(
        (new Date(dateA).getTime() - new Date(dateB).getTime()) / 86_400_000,
    );
}

// ─── Revenue Projection ─────────────────────────────────────────────────────

export async function getRevenueProjection(period: string) {
    const { start, end } = periodBounds(period);

    // 1. Fixed: active billing plans with monthly value
    const fixedResult = await db
        .select({
            total: sql<string>`COALESCE(SUM(${billingPlans.monthlyValue}), '0')`,
        })
        .from(billingPlans)
        .where(
            and(
                eq(billingPlans.isActive, true),
                sql`${billingPlans.type} IN ('mensal_fixo', 'hibrido', 'fixed')`,
                sql`${billingPlans.monthlyValue} IS NOT NULL`,
            ),
        );
    const fixed = parseFloat(fixedResult[0]?.total ?? "0");

    // 2. Variable: approved billable time entries without preInvoiceId in period
    const variableResult = await db
        .select({
            total: sql<string>`COALESCE(SUM(
                CAST(${timeEntries.durationMinutes} AS DECIMAL) / 60.0
                * COALESCE(${timeEntries.hourlyRate}, 0)
            ), '0')`,
        })
        .from(timeEntries)
        .where(
            and(
                eq(timeEntries.isBillable, true),
                eq(timeEntries.approvalStatus, "aprovado"),
                sql`${timeEntries.preInvoiceId} IS NULL`,
                sql`${timeEntries.date} >= ${start}`,
                sql`${timeEntries.date} < ${end}`,
            ),
        );
    const variable = parseFloat(variableResult[0]?.total ?? "0");

    // 3. Approved/pending pre-invoices not yet invoiced for this period
    const piResult = await db
        .select({
            total: sql<string>`COALESCE(SUM(${preInvoices.totalValue}), '0')`,
        })
        .from(preInvoices)
        .where(
            and(
                eq(preInvoices.referencePeriod, period),
                inArray(preInvoices.status, ["approved", "pending"]),
            ),
        );
    const pendingPI = parseFloat(piResult[0]?.total ?? "0");

    return { fixed, variable, pendingPI };
}

// ─── Receipts Projection ────────────────────────────────────────────────────

export async function getReceiptsProjection(period: string) {
    const { start, end } = periodBounds(period);
    const today = new Date().toISOString().slice(0, 10);

    // AR open/overdue/partial with dueDate in this period
    const rows = await db
        .select({
            value: arTitles.value,
            dueDate: arTitles.dueDate,
        })
        .from(arTitles)
        .where(
            and(
                inArray(arTitles.status, ["open", "overdue", "partial"]),
                sql`${arTitles.dueDate} >= ${start}`,
                sql`${arTitles.dueDate} < ${end}`,
            ),
        );

    let receipts0to7 = 0;
    let receipts8to30 = 0;
    let receipts31to60 = 0;
    let receipts60plus = 0;

    for (const row of rows) {
        const val = parseFloat(row.value);
        const daysUntilDue = daysBetween(row.dueDate, today);
        if (daysUntilDue <= 7) receipts0to7 += val;
        else if (daysUntilDue <= 30) receipts8to30 += val;
        else if (daysUntilDue <= 60) receipts31to60 += val;
        else receipts60plus += val;
    }

    // Overdue AR from before this period — expected to be collected soon
    const overdueRows = await db
        .select({
            value: arTitles.value,
            paidValue: arTitles.paidValue,
        })
        .from(arTitles)
        .where(
            and(
                eq(arTitles.status, "overdue"),
                sql`${arTitles.dueDate} < ${start}`,
            ),
        );

    for (const row of overdueRows) {
        const remaining = parseFloat(row.value) - parseFloat(row.paidValue ?? "0");
        if (remaining > 0) receipts0to7 += remaining;
    }

    const total = receipts0to7 + receipts8to30 + receipts31to60 + receipts60plus;
    return { receipts0to7, receipts8to30, receipts31to60, receipts60plus, total };
}

// ─── Expenses Projection ────────────────────────────────────────────────────

export async function getExpensesProjection(period: string) {
    const { start, end } = periodBounds(period);

    const rows = await db
        .select({
            approvalStatus: accountsPayable.approvalStatus,
            value: accountsPayable.value,
        })
        .from(accountsPayable)
        .where(
            and(
                inArray(accountsPayable.status, ["pending", "scheduled", "overdue"]),
                sql`${accountsPayable.dueDate} >= ${start}`,
                sql`${accountsPayable.dueDate} < ${end}`,
            ),
        );

    let pending = 0;
    let approved = 0;
    for (const row of rows) {
        const val = parseFloat(row.value);
        if (row.approvalStatus === "aprovado") approved += val;
        else pending += val;
    }

    return { pending, approved, total: pending + approved };
}

// ─── Monthly Forecast (rolling 3 months) ────────────────────────────────────

export async function getMonthlyForecast(basePeriod?: string): Promise<RollingForecast> {
    const base = basePeriod ?? derivePeriod(new Date().toISOString().slice(0, 10));
    const periods = getRollingPeriods(base);

    const months: MonthForecast[] = await Promise.all(
        periods.map(async (period) => {
            const [revenue, receipts, expenses] = await Promise.all([
                getRevenueProjection(period),
                getReceiptsProjection(period),
                getExpensesProjection(period),
            ]);

            const revenueTotal = revenue.fixed + revenue.variable + revenue.pendingPI;
            const netCash = receipts.total - expenses.total;

            return {
                period,
                label: periodLabel(period),
                revenueFixed: revenue.fixed,
                revenueVariable: revenue.variable,
                revenuePendingPI: revenue.pendingPI,
                revenueTotal,
                receipts0to7: receipts.receipts0to7,
                receipts8to30: receipts.receipts8to30,
                receipts31to60: receipts.receipts31to60,
                receipts60plus: receipts.receipts60plus,
                receiptsTotal: receipts.total,
                expensesPending: expenses.pending,
                expensesApproved: expenses.approved,
                expensesTotal: expenses.total,
                netCash,
                netCashBest: receipts.total * 1.05 - expenses.total * 0.95,
                netCashWorst: receipts.total * 0.85 - expenses.total * 1.10,
            };
        }),
    );

    return { months, generatedAt: new Date().toISOString() };
}

// ─── Dashboard KPIs ─────────────────────────────────────────────────────────

export async function getDashboardKPIs(currentPeriod?: string): Promise<DashboardKPIs> {
    const period = currentPeriod ?? derivePeriod(new Date().toISOString().slice(0, 10));
    const prevPeriod = derivePreviousPeriod(period);
    const { start, end } = periodBounds(period);
    const prev = periodBounds(prevPeriod);
    const today = new Date().toISOString().slice(0, 10);

    // ── Faturado: invoices issued in current period ──
    const faturadoResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${invoices.value}), '0')` })
        .from(invoices)
        .where(and(
            sql`${invoices.issueDate} >= ${start}`,
            sql`${invoices.issueDate} < ${end}`,
        ));
    const faturado = parseFloat(faturadoResult[0]?.total ?? "0");

    const faturadoPrevResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${invoices.value}), '0')` })
        .from(invoices)
        .where(and(
            sql`${invoices.issueDate} >= ${prev.start}`,
            sql`${invoices.issueDate} < ${prev.end}`,
        ));
    const faturadoPrev = parseFloat(faturadoPrevResult[0]?.total ?? "0");

    // ── Recebido: AR titles paid in current period ──
    const recebidoResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${arTitles.paidValue}), '0')` })
        .from(arTitles)
        .where(and(
            eq(arTitles.status, "paid"),
            sql`${arTitles.paidDate} >= ${start}`,
            sql`${arTitles.paidDate} < ${end}`,
        ));
    const recebido = parseFloat(recebidoResult[0]?.total ?? "0");

    const recebidoPrevResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${arTitles.paidValue}), '0')` })
        .from(arTitles)
        .where(and(
            eq(arTitles.status, "paid"),
            sql`${arTitles.paidDate} >= ${prev.start}`,
            sql`${arTitles.paidDate} < ${prev.end}`,
        ));
    const recebidoPrev = parseFloat(recebidoPrevResult[0]?.total ?? "0");

    // ── Em Aberto: all open/partial AR ──
    const abertoResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${arTitles.value}), '0')` })
        .from(arTitles)
        .where(inArray(arTitles.status, ["open", "partial"]));
    const emAberto = parseFloat(abertoResult[0]?.total ?? "0");

    // Approximation for previous: count titles created before previous period end
    const abertoPrevResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${arTitles.value}), '0')` })
        .from(arTitles)
        .where(and(
            inArray(arTitles.status, ["open", "partial"]),
            sql`${arTitles.createdAt} < ${prev.end}::timestamp`,
        ));
    const emAbertoPrev = parseFloat(abertoPrevResult[0]?.total ?? "0");

    // ── Vencido: overdue AR ──
    const vencidoResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${arTitles.value}), '0')` })
        .from(arTitles)
        .where(eq(arTitles.status, "overdue"));
    const vencido = parseFloat(vencidoResult[0]?.total ?? "0");

    const vencidoPrevResult = await db
        .select({ total: sql<string>`COALESCE(SUM(${arTitles.value}), '0')` })
        .from(arTitles)
        .where(and(
            eq(arTitles.status, "overdue"),
            sql`${arTitles.dueDate} < ${prev.end}`,
        ));
    const vencidoPrev = parseFloat(vencidoPrevResult[0]?.total ?? "0");

    // ── Revenue projections 30/60/90 ──
    const periods = getRollingPeriods(period);
    const [rev30, rev60, rev90] = await Promise.all(
        periods.map((p) => getRevenueProjection(p)),
    );

    // ── Pre-invoices pending ──
    const piPending = await db
        .select({
            count: sql<number>`COUNT(*)`,
            total: sql<string>`COALESCE(SUM(${preInvoices.totalValue}), '0')`,
        })
        .from(preInvoices)
        .where(eq(preInvoices.status, "pending"));

    // ── Aging buckets ──
    const agingRows = await db
        .select({ value: arTitles.value, dueDate: arTitles.dueDate })
        .from(arTitles)
        .where(inArray(arTitles.status, ["open", "overdue", "partial"]));

    const buckets: Record<string, { count: number; value: number }> = {
        "0-7 dias": { count: 0, value: 0 },
        "8-30 dias": { count: 0, value: 0 },
        "31-60 dias": { count: 0, value: 0 },
        "60+ dias": { count: 0, value: 0 },
    };

    for (const row of agingRows) {
        const val = parseFloat(row.value);
        const daysUntilDue = daysBetween(row.dueDate, today);
        if (daysUntilDue <= 7) { buckets["0-7 dias"].count++; buckets["0-7 dias"].value += val; }
        else if (daysUntilDue <= 30) { buckets["8-30 dias"].count++; buckets["8-30 dias"].value += val; }
        else if (daysUntilDue <= 60) { buckets["31-60 dias"].count++; buckets["31-60 dias"].value += val; }
        else { buckets["60+ dias"].count++; buckets["60+ dias"].value += val; }
    }

    return {
        faturado,
        recebido,
        emAberto,
        vencido,
        faturadoTrend: trend(faturado, faturadoPrev),
        recebidoTrend: trend(recebido, recebidoPrev),
        emAbertoTrend: trend(emAberto, emAbertoPrev),
        vencidoTrend: trend(vencido, vencidoPrev),
        revenue30d: rev30.fixed + rev30.variable + rev30.pendingPI,
        revenue60d: rev60.fixed + rev60.variable + rev60.pendingPI,
        revenue90d: rev90.fixed + rev90.variable + rev90.pendingPI,
        preInvoicesPendingCount: Number(piPending[0]?.count ?? 0),
        preInvoicesPendingValue: parseFloat(piPending[0]?.total ?? "0"),
        agingBuckets: Object.entries(buckets).map(([label, data]) => ({ label, ...data })),
    };
}

// ─── Cashflow Chart Data ────────────────────────────────────────────────────

export async function getCashflowChartData(): Promise<CashflowChartData> {
    const today = new Date();
    const monthPeriods: string[] = [];
    const labels: string[] = [];

    // 3 past months + current + 2 future = 6 total
    for (let offset = -3; offset <= 2; offset++) {
        const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthPeriods.push(period);
        labels.push(periodLabel(period));
    }

    const receita: number[] = [];
    const despesa: number[] = [];
    const projecao: number[] = [];

    for (const period of monthPeriods) {
        const { start, end } = periodBounds(period);

        // Actual receipts (AR paid in period)
        const recResult = await db
            .select({ total: sql<string>`COALESCE(SUM(${arTitles.paidValue}), '0')` })
            .from(arTitles)
            .where(and(
                eq(arTitles.status, "paid"),
                sql`${arTitles.paidDate} >= ${start}`,
                sql`${arTitles.paidDate} < ${end}`,
            ));
        receita.push(parseFloat(recResult[0]?.total ?? "0") / 1000);

        // Actual payments (AP paid in period)
        const payResult = await db
            .select({ total: sql<string>`COALESCE(SUM(${accountsPayable.value}), '0')` })
            .from(accountsPayable)
            .where(and(
                eq(accountsPayable.status, "paid"),
                sql`${accountsPayable.paidDate} >= ${start}`,
                sql`${accountsPayable.paidDate} < ${end}`,
            ));
        despesa.push(parseFloat(payResult[0]?.total ?? "0") / 1000);

        // Revenue projection for this period
        const rev = await getRevenueProjection(period);
        projecao.push((rev.fixed + rev.variable + rev.pendingPI) / 1000);
    }

    return { months: labels, receita, despesa, projecao };
}

// ─── Risk Items ─────────────────────────────────────────────────────────────

export async function getRiskItems(): Promise<RiskItem[]> {
    const items: RiskItem[] = [];
    const today = new Date().toISOString().slice(0, 10);

    // 1. Overdue AR titles (top 5 by value)
    const overdueAR = await db
        .select({
            id: arTitles.id,
            value: arTitles.value,
            dueDate: arTitles.dueDate,
            clientName: clients.companyName,
        })
        .from(arTitles)
        .leftJoin(clients, eq(arTitles.clientId, clients.id))
        .where(eq(arTitles.status, "overdue"))
        .orderBy(sql`${arTitles.value}::decimal DESC`)
        .limit(5);

    for (const row of overdueAR) {
        const dias = daysBetween(today, row.dueDate);
        items.push({
            id: `ar-${row.id}`,
            tipo: "ar_vencido",
            descricao: `Titulo vencido ha ${dias} dias`,
            cliente: row.clientName ?? "",
            valor: parseFloat(row.value),
            diasVencido: dias,
            severity: dias > 60 ? "alto" : dias > 30 ? "medio" : "baixo",
        });
    }

    // 2. Large pending AP (top 5 by value)
    const largeAP = await db
        .select({
            id: accountsPayable.id,
            supplierName: accountsPayable.supplierName,
            value: accountsPayable.value,
            dueDate: accountsPayable.dueDate,
        })
        .from(accountsPayable)
        .where(inArray(accountsPayable.status, ["pending", "scheduled"]))
        .orderBy(sql`${accountsPayable.value}::decimal DESC`)
        .limit(5);

    for (const row of largeAP) {
        items.push({
            id: `ap-${row.id}`,
            tipo: "ap_grande",
            descricao: `${row.supplierName} — vence ${row.dueDate}`,
            cliente: row.supplierName,
            valor: parseFloat(row.value),
            severity: parseFloat(row.value) > 10000 ? "alto" : "medio",
        });
    }

    // Sort by severity then value desc
    const severityOrder = { alto: 0, medio: 1, baixo: 2 };
    items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.valor - a.valor);

    return items.slice(0, 10);
}

// Re-export for convenience
export { derivePeriod, derivePreviousPeriod };
