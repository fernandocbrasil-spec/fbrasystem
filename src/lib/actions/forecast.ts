"use server";

import { auth } from "@/auth";
import {
    getMonthlyForecast,
    getDashboardKPIs,
    getCashflowChartData,
    getRiskItems,
    type RollingForecast,
    type DashboardKPIs,
    type CashflowChartData,
    type RiskItem,
} from "@/lib/billing/forecast";

// ============================================================================
// Mock Fallbacks — match current hardcoded dashboard values
// ============================================================================

const MOCK_DASHBOARD_KPIS: DashboardKPIs = {
    faturado: 287000,
    recebido: 218000,
    emAberto: 105000,
    vencido: 55000,
    faturadoTrend: 12.4,
    recebidoTrend: 8.2,
    emAbertoTrend: -3.1,
    vencidoTrend: 18.0,
    revenue30d: 155000,
    revenue60d: 160000,
    revenue90d: 168000,
    preInvoicesPendingCount: 3,
    preInvoicesPendingValue: 42500,
    agingBuckets: [
        { label: "0-7 dias", count: 5, value: 35000 },
        { label: "8-30 dias", count: 8, value: 42000 },
        { label: "31-60 dias", count: 3, value: 18000 },
        { label: "60+ dias", count: 2, value: 10000 },
    ],
};

const MOCK_CASHFLOW: CashflowChartData = {
    months: ["Set", "Out", "Nov", "Dez", "Jan", "Fev"],
    receita: [180, 220, 195, 280, 245, 310],
    despesa: [120, 155, 140, 190, 175, 205],
    projecao: [200, 230, 220, 300, 270, 340],
};

const MOCK_FORECAST: RollingForecast = {
    months: [
        {
            period: "2026-03", label: "Mar/26",
            revenueFixed: 80000, revenueVariable: 65200, revenuePendingPI: 0, revenueTotal: 145200,
            receipts0to7: 35000, receipts8to30: 42000, receipts31to60: 18000, receipts60plus: 10000, receiptsTotal: 105000,
            expensesPending: 15000, expensesApproved: 60000, expensesTotal: 75000,
            netCash: 30000, netCashBest: 37750, netCashWorst: 6750,
        },
        {
            period: "2026-04", label: "Abr/26",
            revenueFixed: 85000, revenueVariable: 67000, revenuePendingPI: 0, revenueTotal: 152000,
            receipts0to7: 40000, receipts8to30: 45000, receipts31to60: 20000, receipts60plus: 8000, receiptsTotal: 113000,
            expensesPending: 12000, expensesApproved: 64000, expensesTotal: 76200,
            netCash: 36800, netCashBest: 46250, netCashWorst: 12360,
        },
        {
            period: "2026-05", label: "Mai/26",
            revenueFixed: 85000, revenueVariable: 70000, revenuePendingPI: 0, revenueTotal: 155000,
            receipts0to7: 42000, receipts8to30: 48000, receipts31to60: 22000, receipts60plus: 5000, receiptsTotal: 117000,
            expensesPending: 10000, expensesApproved: 67000, expensesTotal: 77000,
            netCash: 40000, netCashBest: 50150, netCashWorst: 14800,
        },
    ],
    generatedAt: new Date().toISOString(),
};

const MOCK_RISK_ITEMS: RiskItem[] = [
    { id: "ar-1", tipo: "ar_vencido", descricao: "Titulo vencido ha 45 dias", cliente: "Industria Metal SP", valor: 8200, diasVencido: 45, severity: "alto" },
    { id: "ap-1", tipo: "ap_grande", descricao: "Folha de Pagamento — vence 2026-03-05", cliente: "RH", valor: 45000, severity: "alto" },
    { id: "ap-2", tipo: "ap_grande", descricao: "WeWork Coworking — vence 2026-03-10", cliente: "Infraestrutura", valor: 8500, severity: "medio" },
    { id: "ar-2", tipo: "ar_vencido", descricao: "Titulo vencido ha 15 dias", cliente: "Construtora Horizonte", valor: 3800, diasVencido: 15, severity: "baixo" },
];

// ============================================================================
// Exported Server Actions
// ============================================================================

export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
    const session = await auth();
    if (!session?.user) return MOCK_DASHBOARD_KPIS;

    try {
        return await getDashboardKPIs();
    } catch {
        return MOCK_DASHBOARD_KPIS;
    }
}

export async function fetchCashflowChart(): Promise<CashflowChartData> {
    const session = await auth();
    if (!session?.user) return MOCK_CASHFLOW;

    try {
        return await getCashflowChartData();
    } catch {
        return MOCK_CASHFLOW;
    }
}

export async function fetchRollingForecast(): Promise<RollingForecast> {
    const session = await auth();
    if (!session?.user) return MOCK_FORECAST;

    try {
        return await getMonthlyForecast();
    } catch {
        return MOCK_FORECAST;
    }
}

export async function fetchRiskItems(): Promise<RiskItem[]> {
    const session = await auth();
    if (!session?.user) return MOCK_RISK_ITEMS;

    try {
        return await getRiskItems();
    } catch {
        return MOCK_RISK_ITEMS;
    }
}
