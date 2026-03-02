"use client";

import { useState, Fragment } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ReportToolbar, getDensityClasses, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { TrendingUp, TrendingDown, CalendarDays } from "lucide-react";

// ======================== TYPES ========================

type RowTipo = "header" | "item" | "deducao" | "subtotal" | "destaque" | "margem" | "spacer";

type DRERow = {
    key: string;
    label: string;
    tipo: RowTipo;
    months: number[];       // 12 values [Jan..Dec]
    forecast?: number[];    // 12 forecast values [Jan..Dec]
    isMargem?: boolean;
};

const VIEW_OPTIONS = ["Mensal", "Trimestral", "Semestral", "Anual"] as const;
type ViewOption = (typeof VIEW_OPTIONS)[number];

// ======================== CONSTANTS ========================

const REALIZED_THROUGH = 1; // Feb 2026 (index 1) is last realized month

const MONTH_LABELS = [
    "Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26",
    "Jul/26", "Ago/26", "Set/26", "Out/26", "Nov/26", "Dez/26",
];

const PERIOD_LABELS: Record<ViewOption, string> = {
    Mensal: "Fev/2026",
    Trimestral: "T1 2026 (Jan–Mar)",
    Semestral: "S1 2026 (Jan–Jun)",
    Anual: "Ano 2026",
};

// ======================== MOCK DATA ========================

const MOCK_DRE: DRERow[] = [
    {
        key: "receita-bruta",
        label: "1. Receita Bruta (Faturamento Real + Projetado)",
        tipo: "header",
        months:   [132000, 138045, 145200, 152000, 155000, 158000, 162000, 165000, 168000, 172000, 175000, 180000],
        forecast: [130000, 135000, 143000, 150000, 153000, 156000, 160000, 163000, 166000, 170000, 173000, 178000],
    },
    {
        key: "planos-fixos",
        label: "1.1. Planos Fixos Ativos",
        tipo: "item",
        months:   [78000, 80000, 80000, 85000, 85000, 87000, 88000, 88000, 90000, 90000, 92000, 95000],
        forecast: [76000, 78000, 80000, 83000, 83000, 85000, 86000, 86000, 88000, 88000, 90000, 93000],
    },
    {
        key: "faturamento-variavel",
        label: "1.2. Faturamento Variavel (Horas/Exito)",
        tipo: "item",
        months:   [54000, 58045, 65200, 67000, 70000, 71000, 74000, 77000, 78000, 82000, 83000, 85000],
        forecast: [54000, 57000, 63000, 67000, 70000, 71000, 74000, 77000, 78000, 82000, 83000, 85000],
    },
    {
        key: "deducoes",
        label: "Deducoes (Impostos SN – 14,53%)",
        tipo: "deducao",
        months:   [-19180, -20057, -21097, -22085, -22522, -22948, -23543, -23973, -24410, -24991, -25428, -26154],
        forecast: [-18890, -19610, -20778, -21795, -22221, -22667, -23248, -23684, -24096, -24701, -25138, -25859],
    },
    {
        key: "receita-liquida",
        label: "2. Receita Liquida",
        tipo: "subtotal",
        months:   [112820, 117988, 124103, 129915, 132478, 135052, 138457, 141027, 143590, 147009, 149572, 153846],
        forecast: [111110, 115390, 122222, 128205, 130779, 133333, 136752, 139316, 141904, 145299, 147862, 152141],
    },
    { key: "spacer-1", label: "", tipo: "spacer", months: Array(12).fill(0) },
    {
        key: "despesas-operacionais",
        label: "3. Despesas Operacionais (AP)",
        tipo: "header",
        months:   [-71000, -72500, -75000, -76200, -77000, -77500, -78000, -78500, -79000, -79500, -80000, -81000],
        forecast: [-70000, -71500, -74000, -75000, -76000, -76500, -77000, -77500, -78000, -78500, -79000, -80000],
    },
    {
        key: "folha",
        label: "3.1. Folha de Pagamento & Encargos",
        tipo: "item",
        months:   [-45000, -45000, -45000, -45000, -45000, -45000, -46000, -46000, -46000, -46000, -47000, -47000],
        forecast: [-44000, -44000, -44000, -44000, -45000, -45000, -45000, -45000, -46000, -46000, -46000, -46000],
    },
    {
        key: "infra",
        label: "3.2. Infraestrutura (Aluguel, Software, TI)",
        tipo: "item",
        months:   [-15000, -15500, -16000, -16200, -16500, -16500, -16500, -17000, -17000, -17000, -17000, -18000],
        forecast: [-15000, -15000, -15500, -15500, -15500, -15500, -16000, -16000, -16000, -16000, -17000, -17000],
    },
    {
        key: "marketing",
        label: "3.3. Marketing & Comercial",
        tipo: "item",
        months:   [-11000, -12000, -14000, -15000, -15500, -16000, -15500, -15500, -16000, -16500, -16000, -16000],
        forecast: [-11000, -12500, -14500, -15500, -15500, -15500, -16000, -16500, -16000, -16500, -16000, -17000],
    },
    {
        key: "ebitda",
        label: "4. EBITDA (Resultado Operacional)",
        tipo: "subtotal",
        months:   [41820, 45488, 49103, 53715, 55478, 57552, 60457, 62527, 64590, 67509, 69572, 72846],
        forecast: [41110, 43890, 48222, 53205, 54779, 56833, 59752, 61816, 63904, 66799, 68862, 72141],
    },
    { key: "spacer-2", label: "", tipo: "spacer", months: Array(12).fill(0) },
    {
        key: "fcf",
        label: "5. Caixa Livre Gerado (FCF)",
        tipo: "destaque",
        months:   [41820, 45488, 49103, 53715, 55478, 57552, 60457, 62527, 64590, 67509, 69572, 72846],
        forecast: [41110, 43890, 48222, 53205, 54779, 56833, 59752, 61816, 63904, 66799, 68862, 72141],
    },
    {
        key: "margem-fcf",
        label: "Margem FCF (%)",
        tipo: "margem",
        isMargem: true,
        months:   [31.68, 32.95, 33.81, 35.34, 35.79, 36.43, 37.32, 37.89, 38.45, 39.25, 39.76, 40.47],
        forecast: [31.62, 32.51, 33.72, 35.47, 35.80, 36.43, 37.35, 37.92, 38.49, 39.29, 39.82, 40.52],
    },
];

// ======================== HELPERS ========================

function getVisibleMonthIndices(view: ViewOption): number[] {
    switch (view) {
        case "Mensal": return [REALIZED_THROUGH];
        case "Trimestral": return [0, 1, 2];
        case "Semestral": return [0, 1, 2, 3, 4, 5];
        case "Anual": return Array.from({ length: 12 }, (_, i) => i);
    }
}

function getMonthTag(idx: number): "Realizado" | "Previsao" {
    return idx <= REALIZED_THROUGH ? "Realizado" : "Previsao";
}

function fmtCurrency(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    return `${sign}R$ ${abs.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtValue(value: number, isMargem?: boolean): string {
    if (isMargem) return `${value.toFixed(1)}%`;
    return fmtCurrency(value);
}

function fmtAV(value: number, isMargem?: boolean): string {
    const sign = value >= 0 ? "+" : "";
    if (isMargem) return `${sign}${value.toFixed(1)}pp`;
    return `${sign}${fmtCurrency(value)}`;
}

function fmtAH(value: number): string {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function calcAV(real: number, forecast: number): number {
    return real - forecast;
}

function calcAH(real: number, forecast: number): number {
    if (forecast === 0) return 0;
    return ((real - forecast) / Math.abs(forecast)) * 100;
}

function getVarianceColor(av: number, isExpenseLine: boolean): string {
    if (av === 0) return "text-pf-grey";
    // For expenses: spending less (av > 0 because less negative) = favorable = green
    // For revenue: earning more (av > 0) = favorable = green
    const favorable = isExpenseLine ? av > 0 : av > 0;
    return favorable ? "text-green-600" : "text-red-500";
}

function fmtKpi(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${sign}R$ ${Math.round(abs / 1_000)}k`;
    return fmtCurrency(value);
}

// ======================== ROW STYLES ========================

function getRowStyles(tipo: RowTipo, density: Density) {
    const py = density === "compact" ? "py-1.5" : density === "comfortable" ? "py-4" : "py-2.5";
    const ptExtra = density === "compact" ? "pt-3" : "pt-4";

    switch (tipo) {
        case "header":
            return {
                row: "hover:bg-pf-blue/5 transition-colors",
                cell1: `${py} text-xs font-bold text-pf-black uppercase tracking-widest ${ptExtra}`,
                val: `text-right font-mono text-sm ${py} font-bold text-pf-black ${ptExtra}`,
                total: `text-right font-mono text-sm font-bold bg-pf-grey/5 pl-4 ${py} ${ptExtra}`,
            };
        case "item":
            return {
                row: "hover:bg-pf-blue/5 transition-colors",
                cell1: `${py} text-xs pl-5 text-pf-grey`,
                val: `text-right font-mono text-sm ${py} text-pf-grey`,
                total: `text-right font-mono text-sm font-bold bg-pf-grey/5 pl-4 ${py}`,
            };
        case "deducao":
            return {
                row: "hover:bg-pf-blue/5 transition-colors",
                cell1: `${py} text-xs pl-5 text-red-500`,
                val: `text-right font-mono text-sm ${py} text-red-500`,
                total: `text-right font-mono text-sm font-bold bg-pf-grey/5 pl-4 ${py} text-red-600`,
            };
        case "subtotal":
            return {
                row: "bg-pf-grey/5 border-t border-pf-grey/20",
                cell1: `${py} text-xs font-bold text-pf-black uppercase tracking-widest`,
                val: `text-right font-mono text-sm ${py} font-bold text-pf-black`,
                total: `text-right font-mono text-sm font-bold bg-pf-grey/10 pl-4 ${py}`,
            };
        case "destaque":
            return {
                row: "bg-pf-blue/5 border-y border-pf-blue/15",
                cell1: `py-3 text-xs font-bold text-pf-blue uppercase tracking-widest`,
                val: `text-right font-mono font-bold text-pf-blue py-3 text-sm`,
                total: `text-right font-mono font-bold bg-pf-blue/10 text-pf-blue pl-4 py-3 text-sm`,
            };
        case "margem":
            return {
                row: "hover:bg-pf-blue/5 transition-colors",
                cell1: `py-2 text-[10px] font-bold text-pf-grey uppercase tracking-widest text-right`,
                val: `text-right font-mono font-bold text-green-600 py-2 text-[10px]`,
                total: `text-right font-mono font-bold bg-pf-grey/5 text-green-700 pl-4 py-2 text-[10px]`,
            };
        default:
            return { row: "", cell1: "", val: "", total: "" };
    }
}

// ======================== FILTER DEFS ========================

const FILTER_DEFS: FilterDef[] = [
    {
        key: "regime",
        label: "Regime Contabil",
        options: [
            { value: "caixa", label: "Regime de Caixa" },
            { value: "competencia", label: "Regime de Competencia" },
        ],
    },
    {
        key: "centro",
        label: "Centro de Custo",
        options: [
            { value: "operacional", label: "Operacional" },
            { value: "comercial", label: "Comercial" },
            { value: "administrativo", label: "Administrativo" },
        ],
    },
];

const DUMMY_COLUMNS = [{ key: "dre", label: "Estrutura DRE", defaultVisible: true }];

// ======================== COMPONENT ========================

export default function FluxoDeCaixaPage() {
    const [view, setView] = useState<ViewOption>("Trimestral");
    const [showViewMenu, setShowViewMenu] = useState(false);
    const [considerarPrevisao, setConsiderarPrevisao] = useState(false);
    const [density, setDensity] = useState<Density>("compact");
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["dre"]);
    const [currentFilters, setCurrentFilters] = useState<Record<string, string[]>>({});

    // Derived
    const visibleMonths = getVisibleMonthIndices(view);
    const colsPerMonth = considerarPrevisao ? 4 : 1;
    const totalDataCols = 1 + visibleMonths.length * colsPerMonth + 1;

    // KPI values
    const receitaRow = MOCK_DRE.find((r) => r.key === "receita-bruta")!;
    const despesasRow = MOCK_DRE.find((r) => r.key === "despesas-operacionais")!;
    const fcfRow = MOCK_DRE.find((r) => r.key === "fcf")!;

    const kpiReceita = visibleMonths.reduce((s, i) => s + receitaRow.months[i], 0);
    const kpiReceitaForecast = visibleMonths.reduce((s, i) => s + (receitaRow.forecast?.[i] ?? 0), 0);
    const kpiDespesas = visibleMonths.reduce((s, i) => s + Math.abs(despesasRow.months[i]), 0);
    const kpiDespesasForecast = visibleMonths.reduce((s, i) => s + Math.abs(despesasRow.forecast?.[i] ?? 0), 0);
    const kpiFCF = visibleMonths.reduce((s, i) => s + fcfRow.months[i], 0);
    const kpiFCFForecast = visibleMonths.reduce((s, i) => s + (fcfRow.forecast?.[i] ?? 0), 0);
    const kpiMargem = kpiReceita > 0 ? ((kpiFCF / kpiReceita) * 100).toFixed(1) : "0.0";

    return (
        <div>
            {/* ==================== HEADER ==================== */}
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Fluxo de Caixa — DRE Gerencial"
                    subtitle="Modelagem financeira projetada (Pipeline + Contratos Ativos vs Despesas Operacionais)."
                    actions={
                        <div className="flex items-center gap-2">
                            {/* Forecast Toggle */}
                            <button
                                onClick={() => setConsiderarPrevisao((v) => !v)}
                                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                                    considerarPrevisao
                                        ? "border-amber-400 bg-amber-50 text-amber-700"
                                        : "border-pf-grey/20 bg-white text-pf-grey hover:text-pf-black hover:border-pf-grey/40"
                                }`}
                            >
                                <div className={`h-2 w-2 rounded-full transition-colors ${considerarPrevisao ? "bg-amber-500" : "bg-pf-grey/40"}`} />
                                Considerar Previsao
                            </button>

                            {/* Period Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowViewMenu(!showViewMenu)}
                                    className="flex items-center gap-2 rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-xs font-bold text-pf-black hover:bg-pf-blue/5 hover:border-pf-blue transition-colors"
                                >
                                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                                    {view}
                                </button>
                                {showViewMenu && (
                                    <div className="absolute right-0 top-full mt-1 z-30 w-40 rounded-md border border-pf-grey/20 bg-white shadow-lg py-1">
                                        {VIEW_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => { setView(opt); setShowViewMenu(false); }}
                                                className={`w-full text-left px-3 py-1.5 text-xs font-bold transition-colors ${view === opt ? "bg-pf-blue/5 text-pf-blue" : "text-pf-black hover:bg-pf-grey/5"}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                />

                {/* KPI Strip */}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {/* Receita */}
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Receita Bruta ({PERIOD_LABELS[view]})
                        </p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="font-sans text-2xl font-bold text-pf-black leading-none">{fmtKpi(kpiReceita)}</p>
                            {kpiReceitaForecast > 0 && (
                                <span className={`flex items-center text-[10px] font-bold mb-0.5 ${calcAH(kpiReceita, kpiReceitaForecast) >= 0 ? "text-green-700" : "text-red-600"}`}>
                                    {calcAH(kpiReceita, kpiReceitaForecast) >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" aria-hidden="true" /> : <TrendingDown className="h-3 w-3 mr-0.5" aria-hidden="true" />}
                                    {fmtAH(calcAH(kpiReceita, kpiReceitaForecast))}
                                </span>
                            )}
                        </div>
                        {considerarPrevisao && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-pf-grey/10">
                                <span className="text-[9px] text-pf-grey uppercase tracking-wider">Previsao:</span>
                                <span className="font-mono text-[11px] text-amber-700 font-semibold">{fmtKpi(kpiReceitaForecast)}</span>
                            </div>
                        )}
                    </div>

                    {/* Despesas */}
                    <div className="bg-white border border-pf-grey/20 rounded p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Despesas Totais ({PERIOD_LABELS[view]})
                        </p>
                        <p className="font-sans text-2xl font-bold text-red-600 mt-2 leading-none">{fmtKpi(kpiDespesas)}</p>
                        {considerarPrevisao && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-pf-grey/10">
                                <span className="text-[9px] text-pf-grey uppercase tracking-wider">Previsao:</span>
                                <span className="font-mono text-[11px] text-amber-700 font-semibold">{fmtKpi(kpiDespesasForecast)}</span>
                                <span className={`font-mono text-[10px] font-bold ${kpiDespesas <= kpiDespesasForecast ? "text-green-700" : "text-red-600"}`}>
                                    {kpiDespesas <= kpiDespesasForecast ? "favoravel" : "acima"}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* FCF */}
                    <div className="bg-white border border-pf-grey/20 rounded p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Caixa Livre — FCF ({PERIOD_LABELS[view]})
                        </p>
                        <p className="font-sans text-2xl font-bold text-pf-blue mt-2 leading-none">{fmtKpi(kpiFCF)}</p>
                        <p className="text-[11px] text-pf-grey mt-1">Margem {kpiMargem}%</p>
                        {considerarPrevisao && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-pf-grey/10">
                                <span className="text-[9px] text-pf-grey uppercase tracking-wider">Previsao:</span>
                                <span className="font-mono text-[11px] text-amber-700 font-semibold">{fmtKpi(kpiFCFForecast)}</span>
                                <span className={`font-mono text-[10px] font-bold ${calcAH(kpiFCF, kpiFCFForecast) >= 0 ? "text-green-700" : "text-red-600"}`}>
                                    {fmtAH(calcAH(kpiFCF, kpiFCFForecast))}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ==================== STICKY TOOLBAR ==================== */}
            <div className="sticky top-0 z-20 bg-[#F4F5F7] py-2">
                <ReportToolbar
                    pageId="fluxo-de-caixa"
                    columns={DUMMY_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    filterDefs={FILTER_DEFS}
                    currentFilters={currentFilters}
                    onApplyFilters={setCurrentFilters}
                />
            </div>

            {/* ==================== DRE TABLE ==================== */}
            <div className="overflow-x-auto mt-2">
                <table className="w-full text-left font-sans text-sm whitespace-nowrap">
                    {/* ---- THEAD ---- */}
                    <thead>
                        {/* Row 1: Month group headers */}
                        <tr className="border-b border-pf-grey/10">
                            <th
                                rowSpan={considerarPrevisao ? 2 : 1}
                                className="pb-2 font-semibold uppercase tracking-wider text-[10px] text-pf-grey min-w-[220px] sticky left-0 z-10 bg-[#F4F5F7]"
                            >
                                Estrutura DRE
                            </th>
                            {visibleMonths.map((idx) => {
                                const tag = getMonthTag(idx);
                                return (
                                    <th
                                        key={idx}
                                        colSpan={colsPerMonth}
                                        className={`pb-2 text-center text-[10px] font-bold uppercase tracking-widest border-l border-pf-grey/10 ${tag === "Realizado" ? "text-pf-black" : "text-pf-grey"}`}
                                    >
                                        {MONTH_LABELS[idx]}
                                        <span className={`ml-1 text-[9px] font-normal ${tag === "Realizado" ? "text-green-600" : "text-pf-grey/60"}`}>
                                            ({tag})
                                        </span>
                                    </th>
                                );
                            })}
                            <th
                                rowSpan={considerarPrevisao ? 2 : 1}
                                className="pb-2 font-semibold uppercase tracking-wider text-[10px] text-right pl-4 bg-pf-grey/5 text-pf-grey sticky right-0 z-10"
                            >
                                Acumulado
                            </th>
                        </tr>

                        {/* Row 2: Sub-column labels (only when forecast ON) */}
                        {considerarPrevisao && (
                            <tr className="border-b border-pf-grey/20">
                                {visibleMonths.map((idx) => (
                                    <Fragment key={idx}>
                                        <th className="text-[9px] font-semibold text-pf-grey pb-1.5 text-right pr-3 border-l border-pf-grey/10">Real.</th>
                                        <th className="text-[9px] font-semibold text-amber-600 pb-1.5 text-right pr-3 bg-amber-50/50">Prev.</th>
                                        <th className="text-[9px] font-semibold text-pf-grey pb-1.5 text-right pr-3">AV (R$)</th>
                                        <th className="text-[9px] font-semibold text-pf-grey pb-1.5 text-right pr-3">AH (%)</th>
                                    </Fragment>
                                ))}
                            </tr>
                        )}
                    </thead>

                    {/* ---- TBODY ---- */}
                    <tbody className="divide-y divide-pf-grey/10">
                        {MOCK_DRE.map((row) => {
                            if (row.tipo === "spacer") {
                                return <tr key={row.key} className="h-3"><td colSpan={totalDataCols} /></tr>;
                            }

                            const s = getRowStyles(row.tipo, density);
                            const isExpenseLine = row.months[0] < 0;

                            // Acumulado
                            const acumulado = visibleMonths.reduce((sum, i) => sum + row.months[i], 0);

                            // Margem rows: no forecast expansion
                            const renderForecast = considerarPrevisao && !row.isMargem && row.forecast;

                            return (
                                <tr key={row.key} className={`${s.row} group`}>
                                    {/* Label — sticky left */}
                                    <td className={`${s.cell1} sticky left-0 z-10 bg-[#F4F5F7] group-hover:bg-pf-blue/5`}>
                                        {row.label}
                                    </td>

                                    {/* Month columns */}
                                    {visibleMonths.map((idx) => {
                                        const real = row.months[idx];
                                        const fcast = row.forecast?.[idx] ?? null;

                                        if (renderForecast && fcast !== null) {
                                            const av = calcAV(real, fcast);
                                            const ah = calcAH(real, fcast);
                                            const varColor = getVarianceColor(av, isExpenseLine);

                                            return (
                                                <Fragment key={idx}>
                                                    <td className={`${s.val} border-l border-pf-grey/10 pr-3`}>
                                                        {fmtValue(real, row.isMargem)}
                                                    </td>
                                                    <td className={`${s.val} text-amber-700 bg-amber-50/30 pr-3`}>
                                                        {fmtValue(fcast, row.isMargem)}
                                                    </td>
                                                    <td className={`text-right font-mono text-[11px] ${s.row.includes("py-3") ? "py-3" : s.val.includes("py-2 ") ? "py-2" : "py-1.5"} ${varColor} pr-3`}>
                                                        {fmtAV(av, row.isMargem)}
                                                    </td>
                                                    <td className={`text-right font-mono text-[11px] ${s.row.includes("py-3") ? "py-3" : s.val.includes("py-2 ") ? "py-2" : "py-1.5"} pr-3`}>
                                                        <span className={`inline-flex items-center gap-0.5 ${varColor}`}>
                                                            {ah > 0.05 && <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />}
                                                            {ah < -0.05 && <TrendingDown className="h-2.5 w-2.5" aria-hidden="true" />}
                                                            {fmtAH(ah)}
                                                        </span>
                                                    </td>
                                                </Fragment>
                                            );
                                        }

                                        // Margem with forecast ON: span all 4 sub-columns
                                        if (considerarPrevisao && row.isMargem) {
                                            return (
                                                <td key={idx} colSpan={4} className={`${s.val} border-l border-pf-grey/10 text-center pr-3`}>
                                                    {fmtValue(real, row.isMargem)}
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={idx} className={`${s.val} pr-3`}>
                                                {fmtValue(real, row.isMargem)}
                                            </td>
                                        );
                                    })}

                                    {/* Acumulado — sticky right */}
                                    <td className={`${s.total} sticky right-0 z-10`}>
                                        {fmtValue(acumulado, row.isMargem)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Period context */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-pf-grey/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-pf-grey">
                    Periodo: {PERIOD_LABELS[view]}
                </p>
                <p className="text-[10px] text-pf-grey">
                    Meses realizados: Jan–Fev/2026 · Previsao: Mar–Dez/2026
                </p>
            </div>
        </div>
    );
}
