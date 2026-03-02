"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/use-click-outside";
import {
    LayoutDashboard,
    Home,
    Users,
    FileText,
    Receipt,
    Library,
    Settings2,
    CreditCard,
    LineChart,
    Star,
    Scale,
    FolderClock,
    GitBranch,
    UserCheck,
    Vault,
    ChevronRight,
    ChevronLeft,
    Search,
    ClipboardCheck,
    Plus,
    Download,
    Play,
    Landmark,
    BookOpen,
    Calculator,
    ShieldAlert,
    Database,
    Building2,
    UserCircle,
    Briefcase,
    LayoutGrid,
    Pin,
    Truck,
    X,
    LogOut,
    Crown,
    type LucideIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";

// --- Types ---

type NavAction = {
    label: string;
    href: string;
    icon: LucideIcon;
    variant?: "primary" | "secondary";
};

type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    role?: string;
    sub?: NavItem[];
    actions?: NavAction[];
};

type NavGroup = {
    category: string;
    icon: LucideIcon;
    items: NavItem[];
};

// --- Navigation Groups ---

const navGroups: NavGroup[] = [
    {
        category: "Comercial & CRM",
        icon: Users,
        items: [
            { label: "Leads", href: "/leads", icon: Users,
                actions: [{ label: "Novo Lead", href: "/leads", icon: Plus, variant: "primary" }],
            },
            { label: "Propostas", href: "/propostas", icon: FileText,
                sub: [{ label: "Aprovacoes", href: "/propostas/aprovacao", icon: UserCheck }],
                actions: [{ label: "Nova Proposta", href: "/propostas/nova", icon: Plus, variant: "primary" }],
            },
        ],
    },
    {
        category: "Operacional",
        icon: Scale,
        items: [
            { label: "Meus Casos", href: "/casos", icon: Scale },
            { label: "Time Tracking", href: "/time-tracking", icon: FolderClock,
                sub: [{ label: "Aprovacoes", href: "/time-tracking/aprovacoes", icon: UserCheck }],
                actions: [{ label: "Lancar Manual", href: "/time-tracking", icon: Plus, variant: "secondary" }],
            },
            { label: "Workflows", href: "/workflows", icon: GitBranch,
                actions: [{ label: "Iniciar Workflow", href: "/workflows", icon: Play, variant: "primary" }],
            },
        ],
    },
    {
        category: "Financeiro",
        icon: Library,
        items: [
            { label: "Contas a Receber", href: "/financeiro", icon: Library,
                sub: [{ label: "Aprovacoes", href: "/financeiro/aprovacoes", icon: UserCheck }],
            },
            { label: "Contas a Pagar", href: "/contas-a-pagar", icon: CreditCard,
                sub: [{ label: "Aprovacoes", href: "/contas-a-pagar/aprovacoes", icon: UserCheck }],
                actions: [{ label: "Nova Despesa", href: "/contas-a-pagar", icon: Plus, variant: "secondary" }],
            },
            { label: "Tesouraria", href: "/conciliacao-bancaria", icon: Landmark,
                sub: [
                    { label: "Conciliacoes Bancarias", href: "/conciliacao-bancaria", icon: Landmark },
                    { label: "Fluxo de Caixa", href: "/fluxo-de-caixa", icon: LineChart },
                ],
            },
        ],
    },
    {
        category: "Fiscal e Contabilidade",
        icon: Calculator,
        items: [
            { label: "Fiscal", href: "/faturamento", icon: Calculator,
                sub: [
                    { label: "Emissao de NFSe", href: "/faturamento", icon: Receipt },
                    { label: "Parametros Fiscais", href: "/faturamento/parametros", icon: Settings2 },
                ],
                actions: [{ label: "Rodar Engine", href: "/faturamento", icon: Play, variant: "secondary" }],
            },
            { label: "Contabilidade", href: "/contabilidade", icon: BookOpen,
                sub: [{ label: "Balancete", href: "/contabilidade", icon: FileText }],
            },
        ],
    },
    {
        category: "Cadastros",
        icon: Database,
        items: [
            { label: "Cadastros Gerais", href: "/cadastros", icon: Database,
                sub: [
                    { label: "Empresas", href: "/cadastros", icon: Building2 },
                    { label: "Socios", href: "/cadastros", icon: UserCircle },
                    { label: "Colaboradores", href: "/cadastros", icon: Users },
                    { label: "Centro de Custo / Caso", href: "/cadastros", icon: Briefcase },
                    { label: "Contas Bancarias", href: "/cadastros", icon: Landmark },
                    { label: "Fornecedores", href: "/cadastros", icon: Truck },
                ],
            },
        ],
    },
    {
        category: "Administracao Socios",
        icon: Crown,
        items: [
            { label: "Aprovacoes", href: "/aprovacoes", icon: ClipboardCheck, role: "socio" },
            { label: "Cofre dos Socios", href: "/cofre", icon: Vault, role: "socio" },
            { label: "Seguranca & Logs", href: "/seguranca-logs", icon: ShieldAlert },
            { label: "Configuracoes", href: "/configuracoes", icon: Settings2, role: "admin",
                sub: [
                    { label: "Visao Geral", href: "/configuracoes", icon: LayoutDashboard },
                    { label: "Usuarios & Equipe", href: "/configuracoes", icon: Users },
                    { label: "Cadastros Base", href: "/configuracoes", icon: Library },
                ],
            },
        ],
    },
];

// --- Favorites persistence ---

type FavoriteItem = { label: string; href: string; iconName: string };

const FAV_STORAGE_KEY = "pf-sidebar-favorites";

// Map icon component name to component for rendering
const ICON_MAP: Record<string, LucideIcon> = {
    Users, FileText, Receipt, Library, Settings2, CreditCard, LineChart, Star,
    Scale, FolderClock, GitBranch, UserCheck, Vault, ChevronRight, ClipboardCheck,
    Plus, Download, Play, Landmark, BookOpen, Calculator, ShieldAlert, LayoutDashboard, Home,
    Database, Building2, UserCircle, Briefcase, LayoutGrid, Pin, Truck, X, Crown,
};

function getIconName(icon: LucideIcon): string {
    return icon.displayName || icon.name || "ChevronRight";
}

function useFavorites() {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(FAV_STORAGE_KEY);
            setFavorites(stored ? JSON.parse(stored) : []);
        } catch {
            setFavorites([]);
        }
        setLoaded(true);
    }, []);

    const save = useCallback((next: FavoriteItem[]) => {
        setFavorites(next);
        try { localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
    }, []);

    const toggle = useCallback((item: { label: string; href: string; icon: LucideIcon }) => {
        setFavorites((prev) => {
            const exists = prev.some((f) => f.href === item.href && f.label === item.label);
            const next = exists
                ? prev.filter((f) => !(f.href === item.href && f.label === item.label))
                : [...prev, { label: item.label, href: item.href, iconName: getIconName(item.icon) }];
            try { localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
            return next;
        });
    }, []);

    const isFav = useCallback((href: string, label: string) => {
        return favorites.some((f) => f.href === href && f.label === label);
    }, [favorites]);

    return { favorites, toggle, isFav, loaded, save };
}

// --- Pin persistence ---

type PinnedItem = { category: string; iconName: string };

const PIN_STORAGE_KEY = "pf-sidebar-pinned";

function usePinned() {
    const [pinned, setPinned] = useState<PinnedItem[]>([]);
    const [pinnedLoaded, setPinnedLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(PIN_STORAGE_KEY);
            setPinned(stored ? JSON.parse(stored) : []);
        } catch {
            setPinned([]);
        }
        setPinnedLoaded(true);
    }, []);

    const togglePin = useCallback((item: { category: string; icon: LucideIcon }) => {
        setPinned((prev) => {
            const exists = prev.some((p) => p.category === item.category);
            const next = exists
                ? prev.filter((p) => p.category !== item.category)
                : [...prev, { category: item.category, iconName: getIconName(item.icon) }];
            try { localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
            return next;
        });
    }, []);

    const isPinned = useCallback((category: string) => {
        return pinned.some((p) => p.category === category);
    }, [pinned]);

    return { pinned, togglePin, isPinned, pinnedLoaded };
}

// --- Tooltip ---

function SidebarTooltip({ label }: { label: string }) {
    return (
        <span className="absolute left-[4.5rem] bg-pf-black border border-white/10 text-white text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {label}
        </span>
    );
}

// --- Main component ---

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function Sidebar({ userRole, userName = "Usuário" }: { userRole?: string; userName?: string }) {
    const pathname = usePathname();
    const router = useRouter();

    // Which Tier 1 group is active (category name or "favoritos")
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    // Which Tier 2 module is expanded into Tier 3
    const [activeTier3, setActiveTier3] = useState<string | null>(null);
    // Profile popover
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const initials = getInitials(userName);

    // Hover state for "All Modules" panel (debounced)
    const [hoveredAllGroup, setHoveredAllGroup] = useState<string | null>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleGroupHoverEnter = useCallback((category: string) => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => setHoveredAllGroup(category), 350);
    }, []);

    const handleGroupHoverLeave = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => setHoveredAllGroup(null), 500);
    }, []);

    const sidebarRef = useRef<HTMLDivElement>(null);
    const { favorites, toggle, isFav, loaded } = useFavorites();
    const { pinned, togglePin, isPinned } = usePinned();

    useClickOutside(sidebarRef, useCallback(() => {
        setActiveGroup(null);
        setActiveTier3(null);
        setProfileOpen(false);
    }, []));

    const isTier2Open = activeGroup !== null;

    // Get items for the active group
    const tier2Items = useMemo(() => {
        if (!activeGroup) return [];
        if (activeGroup === "favoritos") return []; // handled separately
        if (activeGroup === "all") return []; // handled separately (grouped view)
        const group = navGroups.find((g) => g.category === activeGroup);
        if (!group) return [];
        return group.items.filter(
            (item) => !item.role || item.role === userRole || userRole === "admin"
        );
    }, [activeGroup, userRole]);

    // Find the active Tier 3 item
    const tier3Item = useMemo(() => {
        if (!activeTier3) return null;
        for (const group of navGroups) {
            const found = group.items.find((item) => item.href === activeTier3);
            if (found) return found;
        }
        return null;
    }, [activeTier3]);

    const handleGroupClick = (category: string) => {
        if (activeGroup === category) {
            setActiveGroup(null);
            setActiveTier3(null);
        } else {
            setActiveGroup(category);
            setActiveTier3(null);
        }
    };

    const handleTier2Click = (item: NavItem) => {
        const hasTier3 = (item.sub && item.sub.length > 0) || (item.actions && item.actions.length > 0);
        if (hasTier3) {
            setActiveTier3(activeTier3 === item.href ? null : item.href);
        } else {
            router.push(item.href);
            setActiveGroup(null);
            setActiveTier3(null);
        }
    };

    const closeSidebar = () => {
        setActiveGroup(null);
        setActiveTier3(null);
    };

    // Resolve favorite icons for rendering
    const resolvedFavorites = useMemo(() => {
        return favorites.map((f) => ({
            ...f,
            Icon: ICON_MAP[f.iconName] || ChevronRight,
        }));
    }, [favorites]);

    // Resolve pinned icons for rendering
    const resolvedPinned = useMemo(() => {
        return pinned.map((p) => ({
            ...p,
            Icon: ICON_MAP[p.iconName] || ChevronRight,
        }));
    }, [pinned]);

    return (
        <div ref={sidebarRef} className="fixed left-0 top-0 z-50 h-screen flex">

            {/* TIER 1 — BARRA DE GRUPOS */}
            <aside className="w-20 bg-pf-black flex flex-col items-center py-5 z-50 relative border-r border-white/5">

                {/* Logo — PF Monogram */}
                <Link href="/dashboard" onClick={closeSidebar} className="mb-4 flex items-center justify-center" aria-label="Ir para o Dashboard">
                    <div className="h-9 w-9 flex items-center justify-center bg-pf-blue p-1.5">
                        <svg viewBox="0 0 40 40" fill="none" className="h-full w-full" aria-hidden="true">
                            <g fill="white">
                                <rect x="8" y="4" width="3.5" height="32" />
                                <rect x="11.5" y="4" width="16" height="3.5" />
                                <rect x="24" y="4" width="3.5" height="15" />
                                <rect x="11.5" y="15.5" width="16" height="3.5" />
                                <rect x="11.5" y="27" width="12" height="3.5" />
                            </g>
                        </svg>
                    </div>
                </Link>

                <nav className="flex-1 w-full flex flex-col items-center gap-0.5 px-2" aria-label="Navegacao principal">
                    {/* Home */}
                    <Link
                        href="/dashboard"
                        onClick={closeSidebar}
                        aria-label="Dashboard"
                        className={cn(
                            "w-full aspect-square flex items-center justify-center transition-colors relative group focus:outline-none",
                            pathname === "/dashboard" && !activeGroup
                                ? "text-white bg-white/10"
                                : "text-pf-grey hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Home className="h-5 w-5 stroke-[1.5]" />
                        <SidebarTooltip label="Home" />
                    </Link>

                    {/* All Modules */}
                    <button
                        onClick={() => handleGroupClick("all")}
                        aria-label="Todos os Modulos"
                        className={cn(
                            "w-full aspect-square flex items-center justify-center transition-colors relative group focus:outline-none",
                            activeGroup === "all"
                                ? "text-white bg-white/10"
                                : "text-pf-grey hover:text-white hover:bg-white/5"
                        )}
                    >
                        <LayoutGrid className="h-5 w-5 stroke-[1.5]" />
                        <SidebarTooltip label="Todos os Modulos" />
                    </button>

                    {/* Favoritos */}
                    <button
                        onClick={() => handleGroupClick("favoritos")}
                        aria-label="Favoritos"
                        className={cn(
                            "w-full aspect-square flex items-center justify-center transition-colors relative group focus:outline-none",
                            activeGroup === "favoritos"
                                ? "text-yellow-400 bg-white/10"
                                : "text-pf-grey hover:text-yellow-400 hover:bg-white/5"
                        )}
                    >
                        <Star className="h-5 w-5 stroke-[1.5]" />
                        <SidebarTooltip label="Favoritos" />
                    </button>

                    {/* Separator */}
                    <div className="w-8 my-1.5 border-t border-white/10" />

                    {/* Pinned groups (user-selected shortcuts) */}
                    {resolvedPinned.map((pin) => (
                        <div key={pin.category} className="relative w-full">
                            <button
                                onClick={() => handleGroupClick(pin.category)}
                                aria-label={pin.category}
                                className={cn(
                                    "w-full aspect-square flex items-center justify-center transition-colors relative group focus:outline-none",
                                    activeGroup === pin.category
                                        ? "text-white bg-white/10"
                                        : "text-pf-grey hover:text-white hover:bg-white/5"
                                )}
                            >
                                <pin.Icon className="h-5 w-5 stroke-[1.5]" />
                                <SidebarTooltip label={pin.category} />
                            </button>
                            <button
                                onClick={() => togglePin({ category: pin.category, icon: pin.Icon })}
                                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-pf-blue/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10"
                                aria-label={`Desafixar ${pin.category}`}
                            >
                                <Pin className="h-2.5 w-2.5 text-white fill-white rotate-45" />
                            </button>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="w-full flex flex-col items-center gap-1 px-2 pb-3">
                    {/* Adm. Socios */}
                    <button
                        onClick={() => handleGroupClick("Administracao Socios")}
                        aria-label="Administracao Socios"
                        className={cn(
                            "w-full aspect-square flex items-center justify-center transition-colors relative group focus:outline-none",
                            activeGroup === "Administracao Socios"
                                ? "text-white bg-white/10"
                                : "text-pf-grey hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Crown className="h-5 w-5 stroke-[1.5]" />
                        <SidebarTooltip label="Adm. Socios" />
                    </button>
                    {/* Avatar — profile popover */}
                    <div ref={profileRef} className="relative mt-1">
                        <button
                            onClick={() => setProfileOpen((v) => !v)}
                            aria-label="Perfil do usuario"
                            className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center text-[11px] font-bold text-white cursor-pointer ring-2 ring-white/20 hover:ring-pf-blue hover:bg-pf-blue/60 transition-all focus:outline-none"
                        >
                            {initials}
                        </button>
                        {profileOpen && (
                            <div className="absolute bottom-0 left-full ml-2 w-48 bg-white rounded-lg shadow-lg border border-pf-grey/15 py-2 z-50">
                                <div className="px-4 py-2 border-b border-pf-grey/10">
                                    <p className="text-xs font-bold text-pf-black truncate">{userName}</p>
                                    <p className="text-[10px] text-pf-grey mt-0.5">Socio</p>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors focus:outline-none"
                                >
                                    <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* OVERLAY */}
            {isTier2Open && (
                <div
                    className="fixed inset-0 bg-pf-black/30 z-30"
                    style={{ left: "80px" }}
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            {/* TIER 2 — PAINEL DO GRUPO / FAVORITOS */}
            <div
                className={cn(
                    "h-screen bg-white border-r border-pf-grey/15 z-40 relative flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out",
                    isTier2Open ? "w-64" : "w-0"
                )}
                aria-hidden={!isTier2Open}
            >
                {activeGroup === "favoritos" ? (
                    /* Favoritos panel */
                    <div className="flex flex-col h-full">
                        <div className="shrink-0 border-b border-pf-grey/10 px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <Star className="h-4 w-4 text-yellow-500 stroke-[1.5]" aria-hidden="true" />
                                <span className="text-xs font-bold text-pf-black">Favoritos</span>
                            </div>
                            <p className="text-[10px] text-pf-grey mt-0.5">Itens marcados com estrela</p>
                        </div>
                        <div className="flex-1 overflow-y-auto py-2">
                            {loaded && resolvedFavorites.length === 0 && (
                                <p className="px-4 py-6 text-[10px] text-pf-grey/60 italic text-center">
                                    Nenhum favorito ainda. Abra um modulo e marque itens com a estrela.
                                </p>
                            )}
                            {resolvedFavorites.map((fav) => {
                                const isActive = pathname === fav.href;
                                return (
                                    <div key={`${fav.href}-${fav.label}`} className="flex items-center">
                                        <Link
                                            href={fav.href}
                                            onClick={closeSidebar}
                                            className={cn(
                                                "flex-1 flex items-center gap-3 px-4 py-2.5 text-xs transition-colors border-l-2",
                                                isActive
                                                    ? "border-pf-blue bg-pf-blue/5 text-pf-blue font-semibold"
                                                    : "border-transparent text-pf-black/80 hover:bg-pf-grey/10 hover:text-pf-black"
                                            )}
                                        >
                                            <fav.Icon className={cn("h-3.5 w-3.5 shrink-0 stroke-[1.5]", isActive ? "text-pf-blue" : "text-pf-grey")} aria-hidden="true" />
                                            <span className="truncate">{fav.label}</span>
                                        </Link>
                                        <button
                                            onClick={() => toggle({ label: fav.label, href: fav.href, icon: fav.Icon })}
                                            className="px-3 py-2 shrink-0"
                                            aria-label={`Remover ${fav.label} dos favoritos`}
                                        >
                                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 hover:text-yellow-300 transition-colors" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : activeGroup === "all" ? (
                    /* All modules — collapsed groups, expand on hover */
                    <div className="flex flex-col h-full">
                        <div className="shrink-0 border-b border-pf-grey/10 px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <LayoutGrid className="h-4 w-4 text-pf-blue stroke-[1.5]" aria-hidden="true" />
                                <span className="text-xs font-bold text-pf-black">Todos os Modulos</span>
                            </div>
                            <p className="text-[10px] text-pf-grey mt-0.5">Passe o mouse para expandir</p>
                        </div>
                        <nav className="flex-1 overflow-y-auto py-1" aria-label="Todos os modulos">
                            {navGroups.map((group, idx) => {
                                const filteredItems = group.items.filter(
                                    (item) => !item.role || item.role === userRole || userRole === "admin"
                                );
                                if (filteredItems.length === 0) return null;
                                const isExpanded = hoveredAllGroup === group.category;
                                return (
                                    <div
                                        key={group.category}
                                        onMouseEnter={() => handleGroupHoverEnter(group.category)}
                                        onMouseLeave={handleGroupHoverLeave}
                                    >
                                        {/* Separator between groups */}
                                        {idx > 0 && <div className="mx-4 my-1 border-t border-pf-grey/10" />}
                                        {/* Group header — always visible */}
                                        {(() => {
                                            const groupPinned = isPinned(group.category);
                                            return (
                                                <div className={cn(
                                                    "flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-all duration-200",
                                                    isExpanded
                                                        ? "bg-pf-blue/8 border-l-[3px] border-l-pf-blue"
                                                        : "border-l-[3px] border-l-transparent hover:bg-pf-grey/5"
                                                )}>
                                                    <group.icon className={cn("h-4 w-4 stroke-[1.8] transition-colors", isExpanded ? "text-pf-blue" : "text-pf-grey/60")} aria-hidden="true" />
                                                    <span className={cn("text-[11px] font-bold uppercase tracking-[0.08em] transition-colors flex-1", isExpanded ? "text-pf-blue" : "text-pf-black/50")}>{group.category}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); togglePin({ category: group.category, icon: group.icon }); }}
                                                        className="px-1 py-0.5 shrink-0"
                                                        aria-label={groupPinned ? `Desafixar ${group.category}` : `Fixar ${group.category}`}
                                                    >
                                                        <Pin className={cn("h-3 w-3 transition-colors", groupPinned ? "text-pf-blue fill-pf-blue rotate-45" : "text-pf-grey/20 hover:text-pf-blue")} />
                                                    </button>
                                                    <ChevronRight className={cn("h-3 w-3 text-pf-grey/30 transition-transform duration-300", isExpanded && "rotate-90 text-pf-blue/50")} aria-hidden="true" />
                                                </div>
                                            );
                                        })()}
                                        {/* Items — visible on hover (debounced) */}
                                        <div className={cn(
                                            "overflow-hidden transition-all duration-300 ease-in-out",
                                            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                        )}>
                                            <div className="pb-1 pl-2">
                                                {filteredItems.map((item) => {
                                                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
                                                    const hasTier3 = (item.sub && item.sub.length > 0) || (item.actions && item.actions.length > 0);
                                                    const isTier3Active = activeTier3 === item.href;
                                                    return (
                                                        <div key={item.href + item.label}>
                                                            {hasTier3 ? (
                                                                <button
                                                                    onClick={() => handleTier2Click(item)}
                                                                    className={cn(
                                                                        "w-full flex items-center gap-3 py-1.5 text-xs transition-colors border-l-2 px-3 justify-between",
                                                                        isActive || isTier3Active
                                                                            ? "border-pf-blue bg-pf-blue/5 text-pf-blue font-semibold"
                                                                            : "border-transparent text-pf-black/80 hover:bg-pf-grey/8 hover:text-pf-black"
                                                                    )}
                                                                >
                                                                    <span className="flex items-center gap-2.5">
                                                                        <item.icon className={cn("h-3 w-3 shrink-0 stroke-[1.5]", isActive || isTier3Active ? "text-pf-blue" : "text-pf-grey/50")} aria-hidden="true" />
                                                                        <span className="truncate">{item.label}</span>
                                                                    </span>
                                                                    <ChevronRight className={cn("h-2.5 w-2.5 shrink-0 text-pf-grey/30 transition-transform", isTier3Active && "rotate-90")} aria-hidden="true" />
                                                                </button>
                                                            ) : (
                                                                <Link
                                                                    href={item.href}
                                                                    onClick={closeSidebar}
                                                                    className={cn(
                                                                        "w-full flex items-center gap-2.5 py-1.5 text-xs transition-colors border-l-2 px-3",
                                                                        isActive
                                                                            ? "border-pf-blue bg-pf-blue/5 text-pf-blue font-semibold"
                                                                            : "border-transparent text-pf-black/80 hover:bg-pf-grey/8 hover:text-pf-black"
                                                                    )}
                                                                >
                                                                    <item.icon className={cn("h-3 w-3 shrink-0 stroke-[1.5]", isActive ? "text-pf-blue" : "text-pf-grey/50")} aria-hidden="true" />
                                                                    <span className="truncate">{item.label}</span>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </nav>
                    </div>
                ) : activeGroup ? (
                    /* Group modules panel */
                    <div className="flex flex-col h-full">
                        <div className="shrink-0 border-b border-pf-grey/10 px-4 py-3">
                            {(() => {
                                const group = navGroups.find((g) => g.category === activeGroup);
                                if (!group) return null;
                                const groupPinned = isPinned(group.category);
                                return (
                                    <div className="flex items-center gap-2.5">
                                        <group.icon className="h-4 w-4 text-pf-blue stroke-[1.5]" aria-hidden="true" />
                                        <span className="text-xs font-bold text-pf-black flex-1">{group.category}</span>
                                        <button
                                            onClick={() => togglePin({ category: group.category, icon: group.icon })}
                                            className="px-1 py-0.5 shrink-0"
                                            aria-label={groupPinned ? `Desafixar ${group.category}` : `Fixar ${group.category}`}
                                        >
                                            <Pin className={cn("h-3.5 w-3.5 transition-colors", groupPinned ? "text-pf-blue fill-pf-blue rotate-45" : "text-pf-grey/30 hover:text-pf-blue")} />
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                        <nav className="flex-1 overflow-y-auto py-2" aria-label="Modulos do grupo">
                            {tier2Items.map((item) => {
                                const isActive =
                                    pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" && !item.sub?.some((s) => pathname.startsWith(s.href)));
                                const hasTier3 = (item.sub && item.sub.length > 0) || (item.actions && item.actions.length > 0);
                                const isTier3Active = activeTier3 === item.href;

                                return (
                                    <div key={item.href}>
                                        {hasTier3 ? (
                                            <button
                                                onClick={() => handleTier2Click(item)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 py-2.5 text-xs transition-colors border-l-2 px-4 justify-between",
                                                    isActive || isTier3Active
                                                        ? "border-pf-blue bg-pf-blue/5 text-pf-blue font-semibold"
                                                        : "border-transparent text-pf-black/70 hover:bg-pf-grey/10 hover:text-pf-black"
                                                )}
                                                aria-current={isActive ? "page" : undefined}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <item.icon
                                                        className={cn("h-3.5 w-3.5 shrink-0 stroke-[1.5]", isActive || isTier3Active ? "text-pf-blue" : "text-pf-grey")}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="truncate">{item.label}</span>
                                                </span>
                                                <ChevronRight
                                                    className={cn("h-3 w-3 shrink-0 text-pf-grey/40 transition-transform", isTier3Active && "rotate-90")}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                onClick={closeSidebar}
                                                className={cn(
                                                    "w-full flex items-center gap-3 py-2.5 text-xs transition-colors border-l-2 px-4",
                                                    isActive
                                                        ? "border-pf-blue bg-pf-blue/5 text-pf-blue font-semibold"
                                                        : "border-transparent text-pf-black/70 hover:bg-pf-grey/10 hover:text-pf-black"
                                                )}
                                                aria-current={isActive ? "page" : undefined}
                                            >
                                                <item.icon
                                                    className={cn("h-3.5 w-3.5 shrink-0 stroke-[1.5]", isActive ? "text-pf-blue" : "text-pf-grey")}
                                                    aria-hidden="true"
                                                />
                                                <span className="truncate">{item.label}</span>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    </div>
                ) : null}
            </div>

            {/* TIER 3 — PAINEL DE SUB-ITENS E ACOES */}
            <div
                className={cn(
                    "h-screen bg-[#F4F5F7] border-r border-pf-grey/15 z-40 relative flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out",
                    activeTier3 && isTier2Open ? "w-56" : "w-0"
                )}
                aria-hidden={!activeTier3}
            >
                {tier3Item && (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="shrink-0 border-b border-pf-grey/15 px-4 py-3">
                            <button
                                onClick={() => setActiveTier3(null)}
                                className="flex items-center gap-2 text-pf-grey hover:text-pf-black transition-colors mb-2"
                            >
                                <ChevronLeft className="h-3 w-3" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Voltar</span>
                            </button>
                            <div className="flex items-center gap-2.5">
                                <tier3Item.icon className="h-4 w-4 text-pf-blue stroke-[1.5]" aria-hidden="true" />
                                <span className="text-xs font-bold text-pf-black truncate">{tier3Item.label}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto py-3">
                            {/* Main module link */}
                            {(() => {
                                const isMainFav = isFav(tier3Item.href, "Visao Geral");
                                return (
                                    <div className="flex items-center group/fav">
                                        <Link
                                            href={tier3Item.href}
                                            onClick={closeSidebar}
                                            className={cn(
                                                "flex-1 flex items-center gap-3 px-4 py-2 text-xs transition-colors border-l-2",
                                                pathname === tier3Item.href
                                                    ? "border-pf-blue bg-pf-blue/5 text-pf-blue font-semibold"
                                                    : "border-transparent text-pf-black/70 hover:bg-white hover:text-pf-black"
                                            )}
                                        >
                                            <LayoutDashboard className="h-3 w-3 shrink-0 stroke-[1.5] text-pf-grey" aria-hidden="true" />
                                            <span>Visao Geral</span>
                                        </Link>
                                        <button
                                            onClick={() => toggle({ label: "Visao Geral", href: tier3Item.href, icon: tier3Item.icon })}
                                            className="px-2 py-1 shrink-0"
                                            aria-label={isMainFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                        >
                                            <Star className={cn("h-3 w-3 transition-colors", isMainFav ? "text-yellow-500 fill-yellow-500" : "text-pf-grey/30 hover:text-yellow-400")} />
                                        </button>
                                    </div>
                                );
                            })()}

                            {/* Sub-items */}
                            {tier3Item.sub && tier3Item.sub.length > 0 && (
                                <>
                                    {tier3Item.sub.map((subItem) => {
                                        const isSubActive = pathname.startsWith(subItem.href);
                                        const isSubFav = isFav(subItem.href, subItem.label);
                                        return (
                                            <div key={subItem.href + subItem.label} className="flex items-center group/fav">
                                                <Link
                                                    href={subItem.href}
                                                    onClick={closeSidebar}
                                                    className={cn(
                                                        "flex-1 flex items-center gap-3 px-4 py-2 text-xs transition-colors border-l-2",
                                                        isSubActive
                                                            ? "border-pf-blue bg-pf-blue/5 text-pf-blue font-semibold"
                                                            : "border-transparent text-pf-black/70 hover:bg-white hover:text-pf-black"
                                                    )}
                                                >
                                                    <subItem.icon
                                                        className={cn("h-3 w-3 shrink-0 stroke-[1.5]", isSubActive ? "text-pf-blue" : "text-pf-grey/60")}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="truncate">{subItem.label}</span>
                                                </Link>
                                                <button
                                                    onClick={() => toggle({ label: subItem.label, href: subItem.href, icon: subItem.icon })}
                                                    className="px-2 py-1 shrink-0"
                                                    aria-label={isSubFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                                >
                                                    <Star className={cn("h-3 w-3 transition-colors", isSubFav ? "text-yellow-500 fill-yellow-500" : "text-pf-grey/30 hover:text-yellow-400")} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {/* Actions separator + CTAs */}
                            {tier3Item.actions && tier3Item.actions.length > 0 && (
                                <>
                                    <div className="mx-4 my-3 border-t border-pf-grey/15" role="separator" />
                                    <div className="px-4 space-y-2">
                                        {tier3Item.actions.map((action) => {
                                            const isActionFav = isFav(action.href, action.label);
                                            return (
                                                <div key={action.label} className="flex items-center gap-1.5">
                                                    <Link
                                                        href={action.href}
                                                        onClick={closeSidebar}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-all active:scale-95",
                                                            action.variant === "primary"
                                                                ? "bg-pf-blue text-white hover:bg-blue-700 shadow-sm"
                                                                : "bg-pf-black text-white hover:bg-gray-800 shadow-sm"
                                                        )}
                                                    >
                                                        <action.icon className="h-3.5 w-3.5" aria-hidden="true" />
                                                        {action.label}
                                                    </Link>
                                                    <button
                                                        onClick={() => toggle({ label: action.label, href: action.href, icon: action.icon })}
                                                        className="p-1.5 shrink-0"
                                                        aria-label={isActionFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                                    >
                                                        <Star className={cn("h-3 w-3 transition-colors", isActionFav ? "text-yellow-500 fill-yellow-500" : "text-pf-grey/30 hover:text-yellow-400")} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
