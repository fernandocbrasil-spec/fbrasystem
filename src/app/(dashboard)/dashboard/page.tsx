"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Receipt,
    Clock,
    ArrowUpRight,
    FileText,
    Vault,
    TrendingUp,
    TrendingDown,
    CreditCard,
    CalendarDays,
    Bell,
    AlertTriangle,
    CheckCircle2,
    Info,
    Library,
    type LucideIcon,
} from "lucide-react";
import {
    MOCK_PENDING_APPROVALS,
    MOCK_NOTIFICATIONS,
    MOCK_EVENTS,
    type MockPendingApproval,
    type MockNotification,
    type MockEvent,
} from "@/lib/mock-data";

// ==================== FINANCIAL SUMMARY (single card) ====================

const KPIS = [
    { label: "Faturado", value: "R$ 287k", trend: "+12,4%", up: true, icon: Receipt, color: "text-pf-blue" },
    { label: "Recebido", value: "R$ 218k", trend: "+8,2%", up: true, icon: Library, color: "text-emerald-600" },
    { label: "Em Aberto", value: "R$ 105k", trend: "-3,1%", up: false, icon: Clock, color: "text-amber-600" },
    { label: "Vencido", value: "R$ 55k", trend: "+18%", up: false, icon: AlertTriangle, color: "text-red-500" },
];

function FinancialSummary() {
    return (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey/70">
                    Resumo Financeiro — Marco 2026
                </h3>
                <Link href="/financeiro" className="text-[10px] text-pf-blue font-bold hover:text-pf-black flex items-center gap-1 transition-colors">
                    Detalhar <ArrowUpRight size={10} />
                </Link>
            </div>
            <div className="grid grid-cols-4 divide-x divide-pf-grey/10">
                {KPIS.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="px-4 first:pl-0 last:pr-0">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Icon size={12} className={`${kpi.color} opacity-60`} />
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-pf-grey/50">{kpi.label}</span>
                            </div>
                            <p className="font-sans text-xl font-bold text-pf-black leading-none tracking-tight">{kpi.value}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                                <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded ${kpi.up ? "bg-emerald-50" : "bg-red-50"}`}>
                                    {kpi.up ? <TrendingUp size={9} className="text-emerald-600" /> : <TrendingDown size={9} className="text-red-500" />}
                                    <span className={`text-[9px] font-bold ${kpi.up ? "text-emerald-600" : "text-red-500"}`}>{kpi.trend}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==================== PIPELINE FUNNEL ====================

function PipelineFunnel() {
    const stages = [
        { name: "Novo", count: 3, color: "#212EC6", bg: "bg-pf-blue/8" },
        { name: "Avaliacao", count: 5, color: "#7C3AED", bg: "bg-violet-50" },
        { name: "Proposta", count: 4, color: "#0EA5E9", bg: "bg-sky-50" },
        { name: "Negociacao", count: 2, color: "#F59E0B", bg: "bg-amber-50" },
        { name: "Ganho", count: 8, color: "#10B981", bg: "bg-emerald-50" },
    ];
    const total = stages.reduce((s, st) => s + st.count, 0);
    const maxCount = Math.max(...stages.map((s) => s.count));

    return (
        <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey/70">
                    Pipeline CRM
                </h3>
                <Link href="/leads" className="text-[10px] text-pf-blue font-bold hover:text-pf-black flex items-center gap-1 transition-colors">
                    Ver todos <ArrowUpRight size={10} />
                </Link>
            </div>
            <p className="text-2xl font-bold text-pf-black mb-5">
                {total} <span className="text-xs font-semibold text-pf-grey/60">leads ativos</span>
            </p>

            {/* Funnel bars */}
            <div className="space-y-2">
                {stages.map((stage) => {
                    const pct = (stage.count / maxCount) * 100;
                    return (
                        <div key={stage.name} className="flex items-center gap-3 group">
                            <span className="text-[10px] font-semibold text-pf-grey/60 w-20 text-right shrink-0">{stage.name}</span>
                            <div className="flex-1 h-7 bg-background rounded-md overflow-hidden relative">
                                <div
                                    className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2.5"
                                    style={{ width: `${Math.max(pct, 15)}%`, backgroundColor: stage.color + "18" }}
                                >
                                    <div
                                        className="absolute left-0 top-0 h-full rounded-md"
                                        style={{ width: `${Math.max(pct, 15)}%`, backgroundColor: stage.color, opacity: 0.7 }}
                                    />
                                </div>
                                <span
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold"
                                    style={{ color: stage.color }}
                                >
                                    {stage.count}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==================== CASHFLOW MULTI-LINE CHART ====================

type CashflowLine = "receita" | "despesa" | "projecao";

const CASHFLOW_DATA = {
    months: ["Set", "Out", "Nov", "Dez", "Jan", "Fev"],
    receita:  [180, 220, 195, 280, 245, 310],
    despesa:  [120, 155, 140, 190, 175, 205],
    projecao: [200, 230, 220, 300, 270, 340],
};

const LINE_CONFIGS: Record<CashflowLine, { label: string; color: string; dash?: string }> = {
    receita:  { label: "Receita",  color: "#212EC6" },
    despesa:  { label: "Despesa",  color: "#EF4444" },
    projecao: { label: "Projecao", color: "#BDBDBD", dash: "4 3" },
};

function buildSmoothPath(values: number[], maxVal: number, chartW: number, chartH: number) {
    const points = values.map((v, i) => ({
        x: (i / (values.length - 1)) * chartW,
        y: chartH - (v / maxVal) * chartH,
    }));
    const path = points.map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
    }).join(" ");
    return { path, points };
}

function CashflowChart() {
    const [activeLines, setActiveLines] = useState<Set<CashflowLine>>(new Set(["receita", "despesa", "projecao"]));

    const toggleLine = (line: CashflowLine) => {
        setActiveLines((prev) => {
            const next = new Set(prev);
            if (next.has(line)) {
                if (next.size > 1) next.delete(line);
            } else {
                next.add(line);
            }
            return next;
        });
    };

    const allValues = (Object.keys(LINE_CONFIGS) as CashflowLine[])
        .filter((k) => activeLines.has(k))
        .flatMap((k) => CASHFLOW_DATA[k]);
    const maxVal = Math.max(...allValues) * 1.15;
    const chartH = 140;
    const chartW = 100;

    const lines = (Object.keys(LINE_CONFIGS) as CashflowLine[]).map((key) => ({
        key,
        config: LINE_CONFIGS[key],
        active: activeLines.has(key),
        ...buildSmoothPath(CASHFLOW_DATA[key], maxVal, chartW, chartH),
    }));

    return (
        <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey/70">
                    Fluxo de Caixa
                </h3>
                <Link href="/fluxo-de-caixa" className="text-[10px] text-pf-blue font-bold hover:text-pf-black flex items-center gap-1 transition-colors">
                    Detalhar <ArrowUpRight size={10} />
                </Link>
            </div>

            {/* Interactive legend / filter */}
            <div className="flex items-center gap-1 mb-5">
                {(Object.keys(LINE_CONFIGS) as CashflowLine[]).map((key) => {
                    const cfg = LINE_CONFIGS[key];
                    const isActive = activeLines.has(key);
                    return (
                        <button
                            key={key}
                            onClick={() => toggleLine(key)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                isActive
                                    ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-pf-black"
                                    : "text-pf-grey/40 hover:text-pf-grey/70"
                            }`}
                        >
                            <span
                                className="w-2 h-2 rounded-full shrink-0 transition-opacity"
                                style={{ backgroundColor: cfg.color, opacity: isActive ? 1 : 0.3 }}
                            />
                            {cfg.label}
                        </button>
                    );
                })}
            </div>

            {/* Chart */}
            <div className="relative h-[140px] w-full">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                        <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#212EC6" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#212EC6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map((pct) => (
                        <line
                            key={pct}
                            x1="0" y1={chartH * pct} x2={chartW} y2={chartH * pct}
                            stroke="#BDBDBD" strokeOpacity="0.12" strokeDasharray="2 2"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    {/* Area fill for receita */}
                    {activeLines.has("receita") && (() => {
                        const { path } = buildSmoothPath(CASHFLOW_DATA.receita, maxVal, chartW, chartH);
                        return <path d={`${path} L ${chartW} ${chartH} L 0 ${chartH} Z`} fill="url(#receitaGrad)" />;
                    })()}
                    {/* Lines */}
                    {lines.map((line) => (
                        <path
                            key={line.key}
                            d={line.path}
                            fill="none"
                            stroke={line.config.color}
                            strokeWidth={line.active ? "2" : "0"}
                            strokeDasharray={line.config.dash}
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-all duration-300"
                            style={{ opacity: line.active ? 1 : 0 }}
                        />
                    ))}
                    {/* Dots */}
                    {lines.filter((l) => l.active).map((line) =>
                        line.points.map((p, i) => (
                            <circle
                                key={`${line.key}-${i}`}
                                cx={p.x} cy={p.y} r="2.5"
                                fill="white"
                                stroke={line.config.color}
                                strokeWidth="1.5"
                                vectorEffect="non-scaling-stroke"
                            />
                        ))
                    )}
                </svg>
                {/* Month labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between translate-y-5">
                    {CASHFLOW_DATA.months.map((m) => (
                        <span key={m} className="text-[9px] font-bold text-pf-grey/40 uppercase">{m}</span>
                    ))}
                </div>
            </div>
            <div className="h-4" />
        </div>
    );
}

// ==================== ENTITY MAPS ====================

const ENTITY_ICON_MAP: Record<MockPendingApproval["entityType"], { icon: typeof FileText; bg: string; text: string }> = {
    proposal: { icon: FileText, bg: "bg-pf-blue/8", text: "text-pf-blue" },
    pre_invoice: { icon: Receipt, bg: "bg-orange-50", text: "text-orange-600" },
    distribution: { icon: Vault, bg: "bg-violet-50", text: "text-violet-600" },
    payable: { icon: CreditCard, bg: "bg-red-50", text: "text-red-500" },
    receivable: { icon: Receipt, bg: "bg-amber-50", text: "text-amber-600" },
    time_entry: { icon: Clock, bg: "bg-sky-50", text: "text-sky-600" },
};

const ENTITY_LABEL_MAP: Record<MockPendingApproval["entityType"], string> = {
    proposal: "Proposta",
    pre_invoice: "Pre-Fatura",
    distribution: "Distribuicao",
    payable: "Conta a Pagar",
    receivable: "Financeiro",
    time_entry: "Horas",
};

// ==================== EVENT HELPERS ====================

const EVENT_DOT: Record<MockEvent["tipo"], string> = {
    audiencia: "bg-red-500",
    reuniao: "bg-pf-blue",
    prazo: "bg-amber-500",
    vencimento: "bg-orange-500",
};

function formatEventDate(iso: string) {
    const [, m, d] = iso.split("-");
    const MONTHS = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return { day: d, month: MONTHS[parseInt(m)] };
}

// ==================== NOTIFICATION HELPERS ====================

const NOTIF_STYLE: Record<MockNotification["tipo"], { dot: string }> = {
    warning: { dot: "bg-amber-400" },
    info: { dot: "bg-sky-400" },
    success: { dot: "bg-emerald-400" },
};

// ==================== MAIN PAGE ====================

export default function DashboardPage() {
    const today = new Date();
    const DIAS = ["Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"];
    const MESES = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const dateStr = `${DIAS[today.getDay()]}, ${String(today.getDate()).padStart(2, "0")} de ${MESES[today.getMonth()]} de ${today.getFullYear()}`;

    const pendingItems = MOCK_PENDING_APPROVALS;
    const events = MOCK_EVENTS;
    const notifications = MOCK_NOTIFICATIONS;

    return (
        <div className="max-w-[1400px] mx-auto space-y-5">

            {/* ── GREETING ── */}
            <div>
                <h1 className="text-xl font-bold text-pf-black font-sans tracking-tight">
                    Ola, Fernando Brasil
                </h1>
                <p className="text-xs text-pf-grey/60 font-sans mt-0.5">
                    {dateStr}
                </p>
            </div>

            {/* ── ROW 1: Agenda + Pendencias + Avisos ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Agenda */}
                <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-pf-blue/8 flex items-center justify-center">
                            <CalendarDays className="h-3.5 w-3.5 text-pf-blue" />
                        </div>
                        <h3 className="text-xs font-bold text-pf-black">Agenda</h3>
                    </div>
                    <div className="space-y-0.5">
                        {events.map((event) => {
                            const { day, month } = formatEventDate(event.data);
                            return (
                                <div
                                    key={event.id}
                                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-background transition-colors cursor-pointer group"
                                >
                                    <div className="w-9 text-center shrink-0">
                                        <p className="text-sm font-bold text-pf-black leading-none">{day}</p>
                                        <p className="text-[9px] font-bold uppercase text-pf-grey/50 mt-0.5">{month}</p>
                                    </div>
                                    <div className="w-px h-6 bg-pf-grey/10 shrink-0" />
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${EVENT_DOT[event.tipo]}`} />
                                        <p className="text-[11px] text-pf-black/80 truncate">{event.titulo}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pendencias */}
                <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                            <Clock className="h-3.5 w-3.5 text-red-500" />
                        </div>
                        <h3 className="text-xs font-bold text-pf-black">Pendencias</h3>
                        <span className="ml-auto w-5 h-5 rounded-full bg-pf-blue text-white text-[10px] font-bold flex items-center justify-center">
                            {pendingItems.length}
                        </span>
                    </div>
                    <div className="space-y-0.5">
                        {pendingItems.slice(0, 5).map((item) => {
                            const config = ENTITY_ICON_MAP[item.entityType];
                            const Icon = config.icon;
                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-background transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${config.bg}`}>
                                            <Icon size={12} className={config.text} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-semibold text-pf-black truncate">{item.client}</p>
                                            <p className="text-[9px] text-pf-grey/50 uppercase tracking-wide">{ENTITY_LABEL_MAP[item.entityType]}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-pf-black font-mono whitespace-nowrap ml-3">{item.value}</span>
                                </div>
                            );
                        })}
                    </div>
                    {pendingItems.length > 5 && (
                        <Link href="/aprovacoes" className="mt-3 inline-flex items-center gap-1 text-[10px] text-pf-blue font-bold hover:text-pf-black transition-colors">
                            Ver todas ({pendingItems.length}) <ArrowUpRight size={10} />
                        </Link>
                    )}
                </div>

                {/* Avisos */}
                <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Bell className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <h3 className="text-xs font-bold text-pf-black">Avisos</h3>
                        {notifications.filter((n) => n.tipo === "warning").length > 0 && (
                            <span className="ml-auto w-5 h-5 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center">
                                {notifications.filter((n) => n.tipo === "warning").length}
                            </span>
                        )}
                    </div>
                    <div className="space-y-0.5">
                        {notifications.map((notif) => {
                            const style = NOTIF_STYLE[notif.tipo];
                            return (
                                <div key={notif.id} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-background transition-colors">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${style.dot}`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] text-pf-black/80 leading-relaxed">{notif.mensagem}</p>
                                        <p className="text-[9px] text-pf-grey/40 mt-0.5 font-mono">{notif.hora}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── ROW 2: Financial Summary (single card) ── */}
            <FinancialSummary />

            {/* ── ROW 3: Pipeline Funnel + Cashflow Chart ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PipelineFunnel />
                <CashflowChart />
            </div>
        </div>
    );
}
