"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, ChevronRight, Search } from "lucide-react";
import { FilterDropdown } from "@/components/ui/filter-dropdown";

type LeadTemperature = "frio" | "morno" | "quente";
type LeadStatus = "novo" | "contato_feito" | "proposta_enviada" | "negociacao" | "ganho";

type Lead = {
    id: string;
    companyName?: string;
    contactName: string;
    temperature: LeadTemperature;
    value?: string;
    status: LeadStatus;
    date: string;
};

const INITIAL_LEADS: Lead[] = [
    { id: "1", companyName: "TechCorp BR", contactName: "Carlos Silva", temperature: "morno", status: "novo", date: "01/03/2026" },
    { id: "2", contactName: "Ana Paula Consultoria", temperature: "frio", status: "novo", date: "28/02/2026" },
    { id: "3", companyName: "Logística ABC", contactName: "Marcos Torres", temperature: "quente", status: "contato_feito", date: "27/02/2026" },
    { id: "4", companyName: "Grupo Sequoia", contactName: "Marcelo Furtado", temperature: "quente", value: "R$ 11.150,00/mês", status: "proposta_enviada", date: "20/02/2026" },
];

const STAGE_ORDER: LeadStatus[] = ["novo", "contato_feito", "proposta_enviada", "negociacao", "ganho"];

const stageLabel: Record<LeadStatus, string> = {
    novo: "Novos",
    contato_feito: "Em Contato",
    proposta_enviada: "Proposta Enviada",
    negociacao: "Negociação",
    ganho: "Ganho",
};

const tempDot: Record<LeadTemperature, string> = {
    quente: "bg-red-500",
    morno: "bg-orange-400",
    frio: "bg-blue-300",
};

const tempLabel: Record<LeadTemperature, string> = {
    quente: "Quente",
    morno: "Morno",
    frio: "Frio",
};

export function KanbanBoard() {
    const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
    const [openGroups, setOpenGroups] = useState<Set<LeadStatus>>(new Set(STAGE_ORDER));
    const [search, setSearch] = useState("");
    const [tempFilter, setTempFilter] = useState<string[]>([]);

    const advanceStage = (id: string) => {
        setLeads((prev) =>
            prev.map((l) => {
                if (l.id !== id) return l;
                const idx = STAGE_ORDER.indexOf(l.status);
                if (idx < STAGE_ORDER.length - 1) {
                    return { ...l, status: STAGE_ORDER[idx + 1] };
                }
                return l;
            })
        );
    };

    const toggleGroup = (status: LeadStatus) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(status)) next.delete(status);
            else next.add(status);
            return next;
        });
    };

    const grouped = useMemo(() =>
        STAGE_ORDER.map((status) => ({
            status,
            items: leads.filter((l) =>
                l.status === status &&
                (search === "" ||
                    l.contactName.toLowerCase().includes(search.toLowerCase()) ||
                    (l.companyName ?? "").toLowerCase().includes(search.toLowerCase())) &&
                (tempFilter.length === 0 || tempFilter.includes(l.temperature))
            ),
        })),
        [leads, search, tempFilter]
    );

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-pf-black">Pipeline de Leads</span>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar lead ou empresa..."
                            aria-label="Buscar lead ou empresa"
                            className="h-9 w-56 rounded-md border border-pf-grey/20 pl-10 pr-4 text-sm font-sans outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                        />
                    </div>
                    <FilterDropdown
                        label="Temperatura"
                        options={[
                            { value: "quente", label: "Quente" },
                            { value: "morno", label: "Morno" },
                            { value: "frio", label: "Frio" },
                        ]}
                        selected={tempFilter}
                        onChange={setTempFilter}
                    />
                </div>
            </div>

            {/* Lista colapsável */}
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            <th className="pb-2 font-semibold uppercase tracking-wider text-[10px]">Empresa / Contato</th>
                            <th className="pb-2 font-semibold uppercase tracking-wider text-[10px]">Temperatura</th>
                            <th className="pb-2 font-semibold uppercase tracking-wider text-[10px] text-right">Valor Estimado</th>
                            <th className="pb-2 font-semibold uppercase tracking-wider text-[10px]">Data</th>
                            <th className="pb-2 font-semibold uppercase tracking-wider text-[10px] text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grouped.map(({ status, items }) => {
                            const isOpen = openGroups.has(status);
                            return (
                                <>
                                    <tr
                                        key={`header-${status}`}
                                        onClick={() => toggleGroup(status)}
                                        className="cursor-pointer select-none"
                                    >
                                        <td colSpan={5} className="pt-5 pb-1.5">
                                            <div className="flex items-center gap-2">
                                                <ChevronRight
                                                    className={`h-3 w-3 text-pf-grey/50 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
                                                    aria-hidden="true"
                                                />
                                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-pf-grey/70 whitespace-nowrap">
                                                    {stageLabel[status]}
                                                </span>
                                                <div className="flex-1 border-t border-pf-grey/20" />
                                                <span className="text-[9px] font-mono text-pf-grey/50">{items.length}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {isOpen && items.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer"
                                        >
                                            <td className="py-3.5">
                                                <Link href={`/leads`} className="block">
                                                    <p className="font-bold text-pf-black text-sm hover:text-pf-blue transition-colors">{lead.companyName || "Pessoa Física"}</p>
                                                    <p className="text-xs text-pf-grey mt-0.5">{lead.contactName}</p>
                                                </Link>
                                            </td>
                                            <td className="py-3.5">
                                                <span className="flex items-center gap-2 text-xs text-pf-grey">
                                                    <span className={`h-2 w-2 rounded-full shrink-0 ${tempDot[lead.temperature]}`} aria-hidden="true" />
                                                    {tempLabel[lead.temperature]}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-right font-mono font-bold text-pf-black text-base">
                                                {lead.value ?? <span className="text-pf-grey/40 font-sans text-xs font-normal">—</span>}
                                            </td>
                                            <td className="py-3.5 font-mono text-xs text-pf-grey">{lead.date}</td>
                                            <td className="py-3.5 text-right">
                                                {STAGE_ORDER.indexOf(lead.status) < STAGE_ORDER.length - 1 ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); advanceStage(lead.id); }}
                                                        className="text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors"
                                                    >
                                                        Avancar
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">Ganho</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {isOpen && items.length === 0 && (
                                        <tr key={`empty-${status}`}>
                                            <td colSpan={5} className="py-3 pl-5 text-xs text-pf-grey/40 italic">
                                                Nenhum lead neste estágio.
                                            </td>
                                        </tr>
                                    )}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add lead inline */}
            <Link
                href="/leads"
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors mt-2"
            >
                <Plus className="h-3 w-3" aria-hidden="true" /> Adicionar Lead
            </Link>
        </div>
    );
}
