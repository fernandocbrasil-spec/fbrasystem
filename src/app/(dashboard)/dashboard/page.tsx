"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    Receipt,
    Clock,
    ArrowUpRight,
    FileText,
    Vault,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    CreditCard,
    Bell,
    CalendarDays,
    Star,
    AlertTriangle,
    CheckCircle2,
    Info,
    Users,
    Library,
    Settings2,
    Scale,
    FolderClock,
    GitBranch,
    UserCheck,
    ClipboardCheck,
    Landmark,
    BookOpen,
    Calculator,
    ShieldAlert,
    LayoutDashboard,
    Home,
    LineChart,
    Download,
    Plus,
    Play,
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

// ==================== ICON MAP (for favorites) ====================

const ICON_MAP: Record<string, LucideIcon> = {
    Users, FileText, Receipt, Library, Settings2, CreditCard, LineChart, Star,
    Scale, FolderClock, GitBranch, UserCheck, Vault, ClipboardCheck,
    Plus, Download, Play, Landmark, BookOpen, Calculator, ShieldAlert, LayoutDashboard, Home,
};

type FavoriteItem = { label: string; href: string; iconName: string };

const FAV_STORAGE_KEY = "pf-sidebar-favorites";

// ==================== KPI CARD ====================

function KpiCard({
    label,
    value,
    trend,
    trendUp,
    accent,
}: {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    accent?: boolean;
}) {
    return (
        <div className={`bg-white border border-pf-grey/20 rounded p-2.5 ${accent ? "border-l-[3px] border-l-pf-blue" : ""}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">{label}</p>
            <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{value}</p>
            {trend && (
                <div className="flex items-center gap-1 mt-1">
                    {trendUp ? (
                        <TrendingUp size={10} className="text-green-500" />
                    ) : (
                        <TrendingDown size={10} className="text-red-500" />
                    )}
                    <span className={`text-[9px] font-bold ${trendUp ? "text-green-600" : "text-red-600"}`}>
                        {trend}
                    </span>
                    <span className="text-[9px] text-pf-grey ml-1">vs anterior</span>
                </div>
            )}
        </div>
    );
}

// ==================== MINI PIPELINE ====================

function MiniPipeline() {
    const stages = [
        { name: "Novo", count: 3, tw: "bg-pf-blue" },
        { name: "Avaliacao", count: 5, tw: "bg-purple-600" },
        { name: "Proposta", count: 4, tw: "bg-blue-500" },
        { name: "Negociacao", count: 2, tw: "bg-amber-500" },
        { name: "Ganho", count: 8, tw: "bg-green-500" },
    ];
    const total = stages.reduce((s, st) => s + st.count, 0);

    return (
        <div className="bg-white border border-pf-grey/20 rounded p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                    Pipeline CRM
                </h3>
                <button className="text-[10px] text-pf-blue font-bold hover:underline flex items-center gap-1 uppercase tracking-widest">
                    Ver todos <ArrowUpRight size={10} />
                </button>
            </div>
            <div className="flex rounded-full overflow-hidden h-2 mb-4">
                {stages.map((s) => (
                    <div
                        key={s.name}
                        style={{ width: `${(s.count / total) * 100}%` }}
                        className={`${s.tw} transition-all duration-300`}
                        title={`${s.name}: ${s.count}`}
                    />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {stages.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.tw}`} />
                        <span className="text-[10px] text-pf-grey font-bold uppercase tracking-tight">{s.name}</span>
                        <span className="text-[10px] font-bold text-pf-black ml-auto">{s.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================== CASHFLOW CHART ====================

function CashflowChart() {
    const months = ["Set", "Out", "Nov", "Dez", "Jan", "Fev"];
    const received = [180, 220, 195, 280, 245, 310];
    const projected = [200, 200, 210, 250, 260, 300];
    const maxVal = Math.max(...received, ...projected);

    return (
        <div className="bg-white border border-pf-grey/20 rounded p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                    Fluxo de Caixa
                </h3>
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-pf-blue" />
                        <span className="text-pf-grey">Real</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-pf-grey/40" />
                        <span className="text-pf-grey">Proj.</span>
                    </div>
                </div>
            </div>
            <div className="flex items-end gap-3 h-28 mt-3">
                {months.map((m, i) => (
                    <div key={m} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex gap-1 items-end h-20">
                            <div
                                className="flex-1 bg-pf-blue rounded-t-sm transition-all duration-500"
                                style={{ height: `${(received[i] / maxVal) * 100}%` }}
                            />
                            <div
                                className="flex-1 bg-pf-grey/30 rounded-t-sm transition-all duration-500"
                                style={{ height: `${(projected[i] / maxVal) * 100}%` }}
                            />
                        </div>
                        <span className="text-[9px] text-pf-grey font-bold uppercase">{m}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================== PENDING APPROVALS ====================

const ENTITY_ICON_MAP: Record<MockPendingApproval["entityType"], { icon: typeof FileText; color: string }> = {
    proposal: { icon: FileText, color: "text-pf-blue bg-pf-blue/10" },
    pre_invoice: { icon: Receipt, color: "text-orange-600 bg-orange-100" },
    distribution: { icon: Vault, color: "text-purple-600 bg-purple-100" },
    payable: { icon: CreditCard, color: "text-red-600 bg-red-100" },
    receivable: { icon: Receipt, color: "text-amber-600 bg-amber-100" },
    time_entry: { icon: Clock, color: "text-pf-blue bg-blue-100" },
};

const ENTITY_LABEL_MAP: Record<MockPendingApproval["entityType"], string> = {
    proposal: "Proposta",
    pre_invoice: "Pre-Fatura",
    distribution: "Distribuicao",
    payable: "Conta a Pagar",
    receivable: "Financeiro",
    time_entry: "Horas",
};

function PendingApprovals() {
    const items = MOCK_PENDING_APPROVALS;

    const counts = items.reduce<Record<string, number>>((acc, item) => {
        const label = ENTITY_LABEL_MAP[item.entityType] ?? item.entityType;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});
    const breakdownStr = Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ");

    return (
        <div className="bg-white border border-pf-grey/20 rounded p-4">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                    Pendencias
                </h3>
                <span className="w-5 h-5 rounded-full bg-pf-blue text-white text-[10px] font-bold flex items-center justify-center">
                    {items.length}
                </span>
            </div>
            <p className="text-[9px] text-pf-grey font-medium mb-3">
                {breakdownStr}
            </p>
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
                {items.map((item) => {
                    const config = ENTITY_ICON_MAP[item.entityType];
                    const Icon = config.icon;
                    return (
                        <div
                            key={item.id}
                            className="flex items-center justify-between py-2 px-2 rounded hover:bg-pf-blue/5 transition-colors group cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded flex items-center justify-center ${config.color}`}>
                                    <Icon size={13} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-pf-black truncate">{item.client}</p>
                                    <p className="text-[9px] text-pf-grey font-medium uppercase">{ENTITY_LABEL_MAP[item.entityType]} · {item.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-pf-black font-mono whitespace-nowrap">{item.value}</span>
                                <ArrowUpRight size={12} className="text-pf-grey opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==================== NOTIFICATION HELPERS ====================

const NOTIF_ICON: Record<MockNotification["tipo"], { Icon: LucideIcon; color: string }> = {
    warning: { Icon: AlertTriangle, color: "text-amber-600 bg-amber-100" },
    info: { Icon: Info, color: "text-blue-600 bg-blue-100" },
    success: { Icon: CheckCircle2, color: "text-green-600 bg-green-100" },
};

// ==================== EVENT HELPERS ====================

const EVENT_DOT: Record<MockEvent["tipo"], string> = {
    audiencia: "bg-red-500",
    reuniao: "bg-blue-500",
    prazo: "bg-amber-500",
    vencimento: "bg-orange-500",
};

function formatEventDate(iso: string) {
    const [, m, d] = iso.split("-");
    const MONTHS = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return { day: d, month: MONTHS[parseInt(m)] };
}

// ==================== MAIN PAGE ====================

export default function DashboardPage() {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [favLoaded, setFavLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(FAV_STORAGE_KEY);
            setFavorites(stored ? JSON.parse(stored) : []);
        } catch {
            setFavorites([]);
        }
        setFavLoaded(true);
    }, []);

    const resolvedFavorites = useMemo(() => {
        return favorites.map((f) => ({
            ...f,
            Icon: ICON_MAP[f.iconName] || ChevronRight,
        }));
    }, [favorites]);

    const today = new Date();
    const DIAS = ["Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"];
    const MESES = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const dateStr = `${DIAS[today.getDay()]}, ${String(today.getDate()).padStart(2, "0")} de ${MESES[today.getMonth()]} de ${today.getFullYear()}`;

    return (
        <div className="max-w-[1600px] mx-auto space-y-4">
            {/* Header — Boas-vindas */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                <div>
                    <h1 className="text-lg font-bold text-pf-black font-sans tracking-tight">
                        Ola, Fernando Brasil!
                    </h1>
                    <p className="text-[11px] text-pf-grey font-sans font-semibold uppercase tracking-[0.12em] mt-0.5">
                        Bem-vindo ao sistema PF Advogados
                    </p>
                </div>
                <p className="text-[11px] text-pf-grey font-mono">
                    {dateStr}
                </p>
            </div>

            {/* Mural — 3 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

                {/* Acessados Recentemente */}
                <div className="bg-white border border-pf-grey/20 rounded p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-pf-blue" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Acessados Recentemente
                        </h3>
                    </div>
                    {favLoaded && resolvedFavorites.length === 0 && (
                        <p className="text-[10px] text-pf-grey/50 italic py-4 text-center">
                            Marque itens com ★ no menu lateral para acesso rapido.
                        </p>
                    )}
                    <div className="space-y-0.5">
                        {resolvedFavorites.map((fav) => (
                            <Link
                                key={`${fav.href}-${fav.label}`}
                                href={fav.href}
                                className="flex items-center gap-3 px-2 py-2 text-xs text-pf-black/80 hover:bg-pf-blue/5 rounded transition-colors group"
                            >
                                <fav.Icon className="h-3.5 w-3.5 text-pf-grey shrink-0 stroke-[1.5]" aria-hidden="true" />
                                <span className="truncate">{fav.label}</span>
                                <ChevronRight className="h-3 w-3 text-pf-grey/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Avisos e Notificacoes */}
                <div className="bg-white border border-pf-grey/20 rounded p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Bell className="h-4 w-4 text-pf-blue" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Avisos e Notificacoes
                        </h3>
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center ml-auto">
                            {MOCK_NOTIFICATIONS.filter((n) => n.tipo === "warning").length}
                        </span>
                    </div>
                    <div className="space-y-1 max-h-[220px] overflow-y-auto">
                        {MOCK_NOTIFICATIONS.map((notif) => {
                            const config = NOTIF_ICON[notif.tipo];
                            return (
                                <div
                                    key={notif.id}
                                    className="flex items-start gap-3 px-2 py-2 rounded hover:bg-pf-grey/5 transition-colors"
                                >
                                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
                                        <config.Icon size={12} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] text-pf-black leading-snug">{notif.mensagem}</p>
                                        <p className="text-[9px] text-pf-grey mt-0.5 font-mono">{notif.hora}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Proximos Eventos & Agenda */}
                <div className="bg-white border border-pf-grey/20 rounded p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CalendarDays className="h-4 w-4 text-pf-blue" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Proximos Eventos
                        </h3>
                    </div>
                    <div className="space-y-1 max-h-[220px] overflow-y-auto">
                        {MOCK_EVENTS.map((event) => {
                            const { day, month } = formatEventDate(event.data);
                            return (
                                <div
                                    key={event.id}
                                    className="flex items-center gap-3 px-2 py-2 rounded hover:bg-pf-grey/5 transition-colors"
                                >
                                    <div className="w-10 text-center shrink-0">
                                        <p className="text-sm font-bold text-pf-black leading-none">{day}</p>
                                        <p className="text-[9px] font-bold uppercase text-pf-grey">{month}</p>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${EVENT_DOT[event.tipo]}`} />
                                    <p className="text-[11px] text-pf-black truncate">{event.titulo}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <KpiCard label="Faturado (Mes)" value="R$ 287k" trend="+12,4%" trendUp accent />
                <KpiCard label="Recebido (Mes)" value="R$ 218k" trend="+8,2%" trendUp />
                <KpiCard label="Em Aberto" value="R$ 105k" trend="-3,1%" trendUp />
                <KpiCard label="Vencido" value="R$ 55k" trend="+18%" trendUp={false} />
            </div>

            {/* Widgets Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <MiniPipeline />
                <CashflowChart />
                <PendingApprovals />
            </div>
        </div>
    );
}
