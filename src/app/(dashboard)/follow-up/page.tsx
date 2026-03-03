"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    Clock,
    CalendarDays,
    CalendarX2,
    TrendingDown,
    ChevronRight,
    ArrowUpRight,
    User,
} from "lucide-react";
import { getFollowUpInbox } from "@/lib/actions";
import type { FollowUpItem, FollowUpUrgency } from "@/lib/actions/leads";
import { STAGE_SLA_DAYS } from "@/lib/actions/leads";
import { PageHeader } from "@/components/ui/page-header";

// ─── Urgency Config ──────────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<FollowUpUrgency, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
    overdue: { label: "Atrasado", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
    today: { label: "Hoje", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
    stale: { label: "Sem interacao", color: "text-orange-600", bg: "bg-orange-50", icon: TrendingDown },
    no_date: { label: "Sem data de follow-up", color: "text-violet-600", bg: "bg-violet-50", icon: CalendarX2 },
    this_week: { label: "Esta semana", color: "text-sky-600", bg: "bg-sky-50", icon: CalendarDays },
    ok: { label: "OK", color: "text-emerald-600", bg: "bg-emerald-50", icon: Clock },
};

const URGENCY_ORDER: FollowUpUrgency[] = ["overdue", "today", "stale", "no_date", "this_week"];

const STAGE_LABELS: Record<string, string> = {
    prospeccao: "Prospeccao",
    qualificacao: "Qualificacao",
    proposta: "Proposta",
    negociacao: "Negociacao",
    ganho: "Ganho",
    perdido: "Perdido",
};

function formatDate(dateStr: string): string {
    if (!dateStr) return "—";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}

function relativeTime(dateStr: string): string {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays < 1) return "hoje";
    if (diffDays === 1) return "1 dia atras";
    return `${diffDays} dias atras`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FollowUpInboxPage() {
    const [items, setItems] = useState<FollowUpItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState<Set<FollowUpUrgency>>(new Set());

    const loadData = useCallback(async () => {
        try {
            const data = await getFollowUpInbox();
            setItems(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const toggleGroup = (urgency: FollowUpUrgency) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(urgency)) next.delete(urgency);
            else next.add(urgency);
            return next;
        });
    };

    // Group items by urgency
    const groups = URGENCY_ORDER.map((urgency) => ({
        urgency,
        config: URGENCY_CONFIG[urgency],
        items: items.filter((i) => i.urgency === urgency),
    })).filter((g) => g.items.length > 0);

    // KPI strip
    const overdue = items.filter((i) => i.urgency === "overdue").length;
    const today = items.filter((i) => i.urgency === "today").length;
    const noDate = items.filter((i) => i.urgency === "no_date").length;
    const stale = items.filter((i) => i.urgency === "stale").length;

    return (
        <div className="max-w-[1200px] mx-auto">
            <PageHeader
                title="Follow-up Inbox"
                subtitle="Governanca de acompanhamento — leads que precisam de atencao"
            />

            {/* KPI Strip */}
            <div className="grid grid-cols-4 gap-3 mt-5 mb-6">
                {[
                    { label: "Atrasados", count: overdue, color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
                    { label: "Hoje", count: today, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
                    { label: "Sem follow-up", count: noDate, color: "text-violet-600", bg: "bg-violet-50", icon: CalendarX2 },
                    { label: "Stale (SLA)", count: stale, color: "text-orange-600", bg: "bg-orange-50", icon: TrendingDown },
                ].map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${kpi.bg}`}>
                                    <Icon size={12} className={kpi.color} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-pf-grey/50">{kpi.label}</span>
                            </div>
                            <p className={`font-sans text-2xl font-bold ${kpi.count > 0 ? kpi.color : "text-pf-grey/30"}`}>
                                {loading ? "—" : kpi.count}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <div className="w-5 h-5 border-2 border-pf-blue border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Empty state */}
            {!loading && items.length === 0 && (
                <div className="text-center py-16">
                    <CalendarDays size={32} className="mx-auto text-emerald-400 mb-3" />
                    <p className="text-sm font-semibold text-pf-black">Tudo em dia!</p>
                    <p className="text-xs text-pf-grey/50 mt-1">Nenhum lead precisa de atencao no momento.</p>
                </div>
            )}

            {/* Grouped list */}
            {!loading && groups.map((group) => {
                const Icon = group.config.icon;
                const isCollapsed = collapsed.has(group.urgency);

                return (
                    <div key={group.urgency} className="mb-4">
                        {/* Group header */}
                        <button
                            onClick={() => toggleGroup(group.urgency)}
                            className="flex items-center gap-2 w-full py-2.5 px-3 rounded-lg hover:bg-white transition-colors group"
                        >
                            <ChevronRight
                                size={14}
                                className={`text-pf-grey/40 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                            />
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${group.config.bg}`}>
                                <Icon size={11} className={group.config.color} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-pf-black/70">
                                {group.config.label}
                            </span>
                            <span className={`ml-1 text-[10px] font-bold ${group.config.color}`}>
                                {group.items.length}
                            </span>
                        </button>

                        {/* Rows */}
                        {!isCollapsed && (
                            <div className="ml-6">
                                {/* Table header */}
                                <div className="grid grid-cols-[1fr_120px_100px_120px_100px_80px] gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-pf-grey/40">
                                    <span>Lead</span>
                                    <span>Responsavel</span>
                                    <span>Estagio</span>
                                    <span>Follow-up</span>
                                    <span>Ultima acao</span>
                                    <span className="text-right">SLA</span>
                                </div>

                                {group.items.map((item) => (
                                    <Link
                                        key={item.id}
                                        href="/leads"
                                        className="grid grid-cols-[1fr_120px_100px_120px_100px_80px] gap-2 px-3 py-2.5 rounded-lg hover:bg-white transition-colors items-center group"
                                    >
                                        {/* Lead name */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[11px] font-semibold text-pf-black truncate">
                                                {item.name}
                                            </span>
                                            <ArrowUpRight size={10} className="text-pf-grey/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </div>

                                        {/* Responsible */}
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <User size={10} className="text-pf-grey/40 shrink-0" />
                                            <span className="text-[10px] text-pf-grey/70 truncate">{item.responsible || "—"}</span>
                                        </div>

                                        {/* Stage */}
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-pf-grey/50">
                                            {STAGE_LABELS[item.stage] ?? item.stage}
                                        </span>

                                        {/* Follow-up date */}
                                        <span className={`text-[10px] font-semibold ${
                                            item.urgency === "overdue" ? "text-red-600" :
                                            item.urgency === "today" ? "text-amber-600" :
                                            item.urgency === "no_date" ? "text-violet-500 italic" :
                                            "text-pf-grey/60"
                                        }`}>
                                            {item.followUpDate ? formatDate(item.followUpDate) : "Sem data"}
                                            {item.daysOverdue > 0 && (
                                                <span className="ml-1 text-red-400">({item.daysOverdue}d)</span>
                                            )}
                                        </span>

                                        {/* Last update */}
                                        <span className="text-[10px] text-pf-grey/50">
                                            {relativeTime(item.updatedAt)}
                                        </span>

                                        {/* SLA */}
                                        <span className={`text-[10px] font-mono text-right ${
                                            item.daysSinceUpdate > item.slaDays ? "text-red-500 font-bold" : "text-pf-grey/40"
                                        }`}>
                                            {item.daysSinceUpdate}/{item.slaDays}d
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* SLA Reference */}
            {!loading && (
                <div className="mt-8 border-t border-pf-grey/10 pt-5">
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.15em] text-pf-grey/40 mb-3">
                        Regras de SLA por estagio
                    </h4>
                    <div className="grid grid-cols-4 gap-3">
                        {(["prospeccao", "qualificacao", "proposta", "negociacao"] as const).map((stage) => (
                            <div key={stage} className="bg-white rounded-lg px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-pf-grey/50">
                                    {STAGE_LABELS[stage]}
                                </span>
                                <p className="text-sm font-bold text-pf-black mt-0.5">
                                    {STAGE_SLA_DAYS[stage]} dias
                                </p>
                                <p className="text-[9px] text-pf-grey/40 mt-0.5">
                                    max sem interacao
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
