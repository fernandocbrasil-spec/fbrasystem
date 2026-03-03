"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Receipt,
    DollarSign,
    type LucideIcon,
} from "lucide-react";
import { fetchRollingForecast, fetchRiskItems } from "@/lib/actions";
import type { RollingForecast, MonthForecast, RiskItem } from "@/lib/billing/forecast";
import { fmtKpi } from "@/lib/db/format";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(value: number): string {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SEVERITY_COLORS: Record<RiskItem["severity"], { bg: string; text: string; dot: string }> = {
    alto: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    medio: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    baixo: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
};

const RISK_LABELS: Record<RiskItem["tipo"], string> = {
    ar_vencido: "AR Vencido",
    ap_grande: "AP Relevante",
    caso_cap: "Caso no Cap",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: LucideIcon; color: string }) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5 mb-2">
                <Icon size={12} className={`${color} opacity-60`} />
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-pf-grey/50">{label}</span>
            </div>
            <p className="font-sans text-xl font-bold text-pf-black leading-none tracking-tight">{value}</p>
        </div>
    );
}

function ForecastRow({
    label,
    field,
    months,
    bold,
    negative,
    muted,
    highlight,
}: {
    label: string;
    field: keyof MonthForecast;
    months: MonthForecast[];
    bold?: boolean;
    negative?: boolean;
    muted?: boolean;
    highlight?: "blue" | "green" | "red";
}) {
    const total = months.reduce((s, m) => s + (m[field] as number), 0);
    const highlightBorder =
        highlight === "blue" ? "border-l-pf-blue" :
        highlight === "green" ? "border-l-emerald-500" :
        highlight === "red" ? "border-l-red-500" : "";
    const textClass = muted ? "text-pf-grey/60" : negative ? "text-red-600" : "text-pf-black";

    return (
        <tr className={`border-b border-pf-grey/5 ${highlight ? `border-l-[3px] ${highlightBorder}` : ""} hover:bg-background transition-colors`}>
            <td className={`px-5 py-2.5 text-[11px] ${bold ? "font-bold" : "font-medium"} ${textClass}`}>{label}</td>
            {months.map((m) => {
                const val = m[field] as number;
                return (
                    <td key={m.period} className={`px-4 py-2.5 text-right font-mono text-[11px] ${bold ? "font-bold" : ""} ${textClass}`}>
                        {negative && val > 0 ? `-${fmtKpi(val)}` : fmtKpi(val)}
                    </td>
                );
            })}
            <td className={`px-4 py-2.5 text-right font-mono text-[11px] font-bold ${textClass} bg-pf-grey/5`}>
                {negative && total > 0 ? `-${fmtKpi(total)}` : fmtKpi(total)}
            </td>
        </tr>
    );
}

function SpacerRow() {
    return <tr className="h-2" />;
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function PrevisibilidadePage() {
    const [forecast, setForecast] = useState<RollingForecast | null>(null);
    const [risks, setRisks] = useState<RiskItem[]>([]);

    const loadData = useCallback(async () => {
        const [f, r] = await Promise.all([
            fetchRollingForecast(),
            fetchRiskItems(),
        ]);
        setForecast(f);
        setRisks(r);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (!forecast) {
        return (
            <div className="space-y-5">
                <PageHeader title="Previsibilidade Financeira" subtitle="Projecao rolling 3 meses" />
                <div className="text-sm text-pf-grey">Carregando...</div>
            </div>
        );
    }

    const totalRevenue = forecast.months.reduce((s, m) => s + m.revenueTotal, 0);
    const totalNet = forecast.months.reduce((s, m) => s + m.netCash, 0);
    const totalWorst = forecast.months.reduce((s, m) => s + m.netCashWorst, 0);
    const totalBest = forecast.months.reduce((s, m) => s + m.netCashBest, 0);

    return (
        <div className="max-w-[1400px] mx-auto space-y-5">
            <PageHeader
                title="Previsibilidade Financeira"
                subtitle="Projecao rolling 3 meses — atualizado em tempo real"
            />

            {/* KPI Strip: 4 summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <KpiCard label="Receita Projetada (90d)" value={fmtKpi(totalRevenue)} icon={Receipt} color="text-pf-blue" />
                <KpiCard label="Caixa Liquido (90d)" value={fmtKpi(totalNet)} icon={DollarSign} color="text-emerald-600" />
                <KpiCard label="Cenario Pessimista" value={fmtKpi(totalWorst)} icon={TrendingDown} color="text-red-500" />
                <KpiCard label="Cenario Otimista" value={fmtKpi(totalBest)} icon={TrendingUp} color="text-emerald-600" />
            </div>

            {/* Monthly Forecast Table */}
            <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-5 py-4 border-b border-pf-grey/10">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey/70">
                        Projecao Mensal
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-pf-grey/10">
                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-pf-grey/50 min-w-[200px]">Linha</th>
                                {forecast.months.map((m) => (
                                    <th key={m.period} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-pf-grey/50 text-right">{m.label}</th>
                                ))}
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-pf-blue text-right bg-pf-grey/5">Total 90d</th>
                            </tr>
                        </thead>
                        <tbody>
                            <ForecastRow label="Receita Fixa" field="revenueFixed" months={forecast.months} bold />
                            <ForecastRow label="Receita Variavel" field="revenueVariable" months={forecast.months} />
                            <ForecastRow label="Pre-Faturas Pendentes" field="revenuePendingPI" months={forecast.months} />
                            <ForecastRow label="Receita Total" field="revenueTotal" months={forecast.months} bold highlight="blue" />
                            <SpacerRow />
                            <ForecastRow label="Recebimentos 0-7d" field="receipts0to7" months={forecast.months} />
                            <ForecastRow label="Recebimentos 8-30d" field="receipts8to30" months={forecast.months} />
                            <ForecastRow label="Recebimentos 31-60d" field="receipts31to60" months={forecast.months} muted />
                            <ForecastRow label="Recebimentos 60+d" field="receipts60plus" months={forecast.months} muted />
                            <ForecastRow label="Total Recebimentos" field="receiptsTotal" months={forecast.months} bold highlight="green" />
                            <SpacerRow />
                            <ForecastRow label="Despesas Pendentes" field="expensesPending" months={forecast.months} negative />
                            <ForecastRow label="Despesas Aprovadas" field="expensesApproved" months={forecast.months} negative />
                            <ForecastRow label="Total Despesas" field="expensesTotal" months={forecast.months} bold negative highlight="red" />
                            <SpacerRow />
                            <ForecastRow label="Caixa Liquido" field="netCash" months={forecast.months} bold highlight="blue" />
                            <ForecastRow label="Cenario Otimista" field="netCashBest" months={forecast.months} muted />
                            <ForecastRow label="Cenario Pessimista" field="netCashWorst" months={forecast.months} muted />
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Risk Items */}
            <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-5 py-4 border-b border-pf-grey/10 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey/70">
                        Top 10 Itens de Risco
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-700">{risks.length} itens</span>
                    </div>
                </div>
                <div>
                    {risks.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-pf-grey/50">
                            Nenhum item de risco identificado
                        </div>
                    )}
                    {risks.map((risk) => {
                        const sev = SEVERITY_COLORS[risk.severity];
                        return (
                            <div key={risk.id} className="flex items-center justify-between px-5 py-3 hover:bg-background transition-colors border-b border-pf-grey/5 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                                    <div>
                                        <p className="text-[11px] font-semibold text-pf-black">{risk.descricao}</p>
                                        <p className="text-[9px] text-pf-grey/50 mt-0.5">
                                            {RISK_LABELS[risk.tipo]} — {risk.cliente}
                                            {risk.diasVencido ? ` — ${risk.diasVencido}d vencido` : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${sev.bg} ${sev.text}`}>
                                        {risk.severity}
                                    </span>
                                    <span className="text-xs font-bold text-pf-black font-mono">
                                        {fmtCurrency(risk.valor)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer context */}
            <div className="flex items-center justify-between pt-3 border-t border-pf-grey/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-pf-grey">
                    Modelo: Rolling 3 Meses
                </p>
                <p className="text-[10px] text-pf-grey font-mono">
                    Atualizado: {new Date(forecast.generatedAt).toLocaleString("pt-BR")}
                </p>
            </div>
        </div>
    );
}
