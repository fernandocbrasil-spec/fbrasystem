"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    FileText,
    Receipt,
    Library,
    Settings2,
    CreditCard,
    LineChart,
    Star,
    FilePlus2,
    Scale,
    FolderClock,
    GitBranch,
    UserCheck,
    Target,
    Vault,
    ChevronRight,
    Search,
    type LucideIcon,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: LucideIcon; role?: string };
type NavGroup = { category: string; items: NavItem[] };

const quickAccess: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Casos Ativos", href: "/casos", icon: Scale },
    { label: "Pipeline CRM", href: "/leads", icon: Target },
];

const navGroups: NavGroup[] = [
    {
        category: "Comercial & CRM",
        items: [
            { label: "Leads", href: "/leads", icon: Users },
            { label: "Propostas", href: "/propostas", icon: FileText },
            { label: "Aprovação", href: "/propostas/aprovacao", icon: UserCheck },
        ],
    },
    {
        category: "Operacional",
        items: [
            { label: "Meus Casos", href: "/casos", icon: Scale },
            { label: "Time Tracking", href: "/time-tracking", icon: FolderClock },
            { label: "Workflows", href: "/workflows", icon: GitBranch },
        ],
    },
    {
        category: "Financeiro",
        items: [
            { label: "Contas a Receber", href: "/financeiro", icon: Library },
            { label: "Contas a Pagar", href: "/contas-a-pagar", icon: CreditCard },
            { label: "DRE & Fluxo de Caixa", href: "/fluxo-de-caixa", icon: LineChart },
            { label: "Emissão de NFSe", href: "/faturamento", icon: Receipt },
        ],
    },
    {
        category: "Administrativo",
        items: [
            { label: "Cofre dos Sócios", href: "/cofre", icon: Vault, role: "socio" },
            { label: "Configurações", href: "/configuracoes", icon: Settings2, role: "admin" },
        ],
    },
];

function SidebarTooltip({ label }: { label: string }) {
    return (
        <span className="absolute left-[4.5rem] bg-pf-black border border-white/10 text-white text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {label}
        </span>
    );
}

const navLinkClass = (isActive: boolean, dimmed = false) =>
    cn(
        "flex items-center gap-3 px-4 py-2 text-xs transition-colors border-l-2",
        isActive
            ? "border-pf-blue bg-pf-blue/5 text-pf-blue font-semibold"
            : cn(
                  "border-transparent hover:bg-pf-grey/10 hover:text-pf-black",
                  dimmed ? "text-pf-black/70" : "text-pf-black"
              )
    );

export function Sidebar({ userRole }: { userRole?: string }) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [openGroups, setOpenGroups] = useState<string[]>(
        navGroups.map((g) => g.category)
    );
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleGroup = (category: string) => {
        setOpenGroups((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const filteredGroups = useMemo(
        () =>
            navGroups
                .map((group) => ({
                    ...group,
                    items: group.items.filter(
                        (item) =>
                            (!item.role || item.role === userRole || userRole === "admin") &&
                            (search === "" || item.label.toLowerCase().includes(search.toLowerCase()))
                    ),
                }))
                .filter((group) => group.items.length > 0),
        [search, userRole]
    );

    return (
        <div ref={sidebarRef} className="fixed left-0 top-0 z-50 h-screen flex">

            {/* BARRA ESTREITA ESQUERDA */}
            <aside className="w-20 bg-pf-black flex flex-col items-center py-5 z-50 relative border-r border-white/5">

                {/* Logo */}
                <Link href="/dashboard" className="mb-6 flex items-center justify-center" aria-label="Ir para o Dashboard">
                    <div className="h-9 w-9 flex items-center justify-center bg-pf-blue">
                        <span className="font-display text-sm text-white">PF</span>
                    </div>
                </Link>

                {/* Ícones principais */}
                <nav className="flex-1 w-full flex flex-col items-center gap-0.5 px-2" aria-label="Navegação principal">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Abrir módulos"
                        aria-expanded={isMenuOpen}
                        className={cn(
                            "w-full aspect-square flex items-center justify-center transition-colors relative group",
                            isMenuOpen
                                ? "text-white bg-white/10"
                                : "text-pf-grey hover:text-white hover:bg-white/5"
                        )}
                    >
                        <LayoutDashboard className="h-5 w-5 stroke-[1.5]" />
                        <SidebarTooltip label="Módulos" />
                    </button>

                    <button
                        aria-label="Favoritos"
                        className="w-full aspect-square flex items-center justify-center text-pf-grey hover:text-white hover:bg-white/5 transition-colors group relative"
                    >
                        <Star className="h-5 w-5 stroke-[1.5]" />
                        <SidebarTooltip label="Favoritos" />
                    </button>

                    <button
                        aria-label="Ação rápida"
                        className="w-full aspect-square flex items-center justify-center text-pf-grey hover:text-white hover:bg-white/5 transition-colors group relative"
                    >
                        <FilePlus2 className="h-5 w-5 stroke-[1.5]" />
                        <SidebarTooltip label="Novo" />
                    </button>
                </nav>

                {/* Footer */}
                <div className="w-full flex flex-col items-center gap-3 px-2">
                    <Link
                        href="/configuracoes"
                        aria-label="Configurações"
                        className="w-full aspect-square flex items-center justify-center text-pf-grey hover:text-white hover:bg-white/5 transition-colors group relative"
                    >
                        <Settings2 className="h-5 w-5 stroke-[1.5]" />
                        <SidebarTooltip label="Admin" />
                    </Link>
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Perfil do usuário"
                        className="h-8 w-8 bg-pf-blue flex items-center justify-center text-[11px] font-bold text-white cursor-pointer"
                    >
                        RC
                    </div>
                </div>
            </aside>

            {/* OVERLAY */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-pf-black/30 z-30"
                    style={{ left: "80px" }}
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* PAINEL EXPANSÍVEL */}
            <div
                className={cn(
                    "h-screen bg-white border-r border-pf-grey/15 z-40 relative flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out",
                    isMenuOpen ? "w-64" : "w-0"
                )}
                aria-hidden={!isMenuOpen}
            >
                {/* Busca */}
                <div className="shrink-0 border-b border-pf-grey/10 px-3 py-2.5">
                    <div className="relative flex items-center">
                        <Search className="absolute left-2.5 h-3.5 w-3.5 text-pf-grey pointer-events-none" aria-hidden="true" />
                        <input
                            type="search"
                            placeholder="Buscar módulo..."
                            aria-label="Buscar módulo"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-pf-grey/10 pl-8 pr-3 py-1.5 text-xs text-pf-black placeholder:text-pf-grey/60 outline-none border-0"
                        />
                    </div>
                </div>

                {/* Navegação */}
                <nav className="flex-1 overflow-y-auto" aria-label="Módulos do sistema">

                    {/* Acesso Rápido */}
                    <div className="pt-4 pb-1">
                        <p className="px-4 mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Acesso Rápido
                        </p>
                        {quickAccess.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={navLinkClass(isActive)}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <item.icon
                                        className={cn("h-3.5 w-3.5 shrink-0 stroke-[1.5]", isActive ? "text-pf-blue" : "text-pf-grey")}
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Separador */}
                    <div className="mx-4 my-3 border-t border-pf-grey/10" role="separator" />

                    {/* Grupos em Accordion */}
                    {filteredGroups.map((group) => {
                        const isOpen = search !== "" || openGroups.includes(group.category);
                        return (
                            <div key={group.category} className="mb-1">
                                <button
                                    onClick={() => toggleGroup(group.category)}
                                    aria-expanded={isOpen}
                                    className="w-full flex items-center justify-between px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-pf-grey hover:text-pf-black transition-colors"
                                >
                                    <span>{group.category}</span>
                                    <ChevronRight
                                        className={cn("h-3 w-3 transition-transform duration-200", isOpen ? "rotate-90" : "")}
                                        aria-hidden="true"
                                    />
                                </button>

                                {isOpen &&
                                    group.items.map((item) => {
                                        const isActive =
                                            pathname.startsWith(item.href) && item.href !== "/dashboard";
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={navLinkClass(isActive, true)}
                                                aria-current={isActive ? "page" : undefined}
                                            >
                                                <item.icon
                                                    className={cn("h-3.5 w-3.5 shrink-0 stroke-[1.5]", isActive ? "text-pf-blue" : "text-pf-grey")}
                                                    aria-hidden="true"
                                                />
                                                <span className="truncate">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                            </div>
                        );
                    })}

                    <div className="h-4" />
                </nav>
            </div>
        </div>
    );
}
