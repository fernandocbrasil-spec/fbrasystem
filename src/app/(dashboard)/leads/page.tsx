"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { Plus, Search } from "lucide-react";

type LeadTemperature = "frio" | "morno" | "quente";
type LeadStage = "novo" | "contato_feito" | "proposta_enviada" | "negociacao" | "ganho";

type Lead = {
    id: string;
    companyName?: string;
    contactName: string;
    temperature: LeadTemperature;
    value?: string;
    stage: LeadStage;
    date: string;
};

const LEADS: Lead[] = [
    { id: "1", companyName: "TechCorp BR", contactName: "Carlos Silva", temperature: "morno", stage: "novo", date: "01/03/2026" },
    { id: "2", contactName: "Ana Paula Consultoria", temperature: "frio", stage: "novo", date: "28/02/2026" },
    { id: "3", companyName: "Logística ABC", contactName: "Marcos Torres", temperature: "quente", stage: "contato_feito", date: "27/02/2026" },
    { id: "4", companyName: "Grupo Sequoia", contactName: "Marcelo Furtado", temperature: "quente", value: "R$ 11.150,00/mês", stage: "proposta_enviada", date: "20/02/2026" },
];

const stageLabel: Record<LeadStage, string> = {
    novo: "Novo",
    contato_feito: "Em Contato",
    proposta_enviada: "Proposta Enviada",
    negociacao: "Negociação",
    ganho: "Ganho",
};

const stageStyle: Record<LeadStage, string> = {
    novo: "bg-blue-100 text-blue-700",
    contato_feito: "bg-orange-100 text-orange-700",
    proposta_enviada: "bg-purple-100 text-purple-700",
    negociacao: "bg-yellow-100 text-yellow-700",
    ganho: "bg-green-100 text-green-700",
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

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "empresa", label: "Empresa / Contato", defaultVisible: true },
    { key: "temperatura", label: "Temperatura", defaultVisible: true },
    { key: "valor", label: "Valor Estimado", defaultVisible: true },
    { key: "data", label: "Data", defaultVisible: true },
    { key: "estagio", label: "Estágio", defaultVisible: true },
    { key: "acao", label: "Ação", defaultVisible: true },
];

const ALL_COLUMN_KEYS = TABLE_COLUMNS.map((c) => c.key);

const FILTER_DEFS: FilterDef[] = [
    { key: "temperatura", label: "Temperatura", options: [
        { value: "quente", label: "Quente" },
        { value: "morno", label: "Morno" },
        { value: "frio", label: "Frio" },
    ]},
    { key: "estagio", label: "Estágio", options: [
        { value: "novo", label: "Novo" },
        { value: "contato_feito", label: "Em Contato" },
        { value: "proposta_enviada", label: "Proposta Enviada" },
        { value: "negociacao", label: "Negociação" },
        { value: "ganho", label: "Ganho" },
    ]},
];

export default function LeadsPage() {
    const [search, setSearch] = useState("");
    const [tempFilter, setTempFilter] = useState<string[]>([]);
    const [stageFilter, setStageFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMN_KEYS);
    const [density, setDensity] = useState<Density>("compact");

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setTempFilter(filters.temperatura || []);
        setStageFilter(filters.estagio || []);
    };

    const densityClasses = getDensityClasses(density);

    const filtered = LEADS.filter((l) =>
        (search === "" ||
            l.contactName.toLowerCase().includes(search.toLowerCase()) ||
            (l.companyName ?? "").toLowerCase().includes(search.toLowerCase())) &&
        (tempFilter.length === 0 || tempFilter.includes(l.temperature)) &&
        (stageFilter.length === 0 || stageFilter.includes(l.stage))
    );

    const leadsQuentes = LEADS.filter((l) => l.temperature === "quente").length;
    const leadsComProposta = LEADS.filter((l) => l.stage === "proposta_enviada" || l.stage === "negociacao").length;
    const leadsGanhos = LEADS.filter((l) => l.stage === "ganho").length;

    return (
        <div>
            <div className="sticky top-0 z-20 bg-[#F4F5F7] space-y-2 pb-3">
                <PageHeader
                    title="CRM & Leads"
                    subtitle="Gerenciamento do pipeline de potenciais clientes e controle de propostas."
                    actions={
                        <button
                            onClick={() => window.alert("Modal: Formulário de Novo Lead / Prospect.")}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-blue px-3 py-1.5 font-sans text-xs font-bold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-sm"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Novo Lead
                        </button>
                    }
                />

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Total de Leads</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{LEADS.length}</p>
                        <p className="text-[9px] text-pf-grey mt-1">No pipeline</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Leads Quentes</p>
                        <p className="font-sans text-xl font-bold text-red-600 mt-1 leading-none">{leadsQuentes}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Prioridade alta</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Em Negociação</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{leadsComProposta}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Proposta ou negociação</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Convertidos (Mês)</p>
                        <p className="font-sans text-xl font-bold text-green-600 mt-1 leading-none">{leadsGanhos}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Ganhos em Mar/2026</p>
                    </div>
                </div>

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
                                className="h-8 w-48 rounded-md border border-pf-grey/20 pl-10 pr-4 text-sm font-sans outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
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
                        <FilterDropdown
                            label="Estágio"
                            options={[
                                { value: "novo", label: "Novo" },
                                { value: "contato_feito", label: "Em Contato" },
                                { value: "proposta_enviada", label: "Proposta Enviada" },
                                { value: "negociacao", label: "Negociação" },
                                { value: "ganho", label: "Ganho" },
                            ]}
                            selected={stageFilter}
                            onChange={setStageFilter}
                        />
                    </div>
                </div>

                {/* Report Toolbar */}
                <ReportToolbar
                    pageId="leads"
                    columns={TABLE_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    currentFilters={{ temperatura: tempFilter, estagio: stageFilter }}
                    filterDefs={FILTER_DEFS}
                    onApplyFilters={handleApplyFilters}
                />
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("empresa") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Empresa / Contato</th>}
                            {visibleColumns.includes("temperatura") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Temperatura</th>}
                            {visibleColumns.includes("valor") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Valor Estimado</th>}
                            {visibleColumns.includes("data") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Data</th>}
                            {visibleColumns.includes("estagio") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Estágio</th>}
                            {visibleColumns.includes("acao") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Ação</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((lead) => (
                            <tr
                                key={lead.id}
                                className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer"
                                onClick={() => window.alert(`Abrindo ficha do lead: ${lead.contactName}`)}
                            >
                                {visibleColumns.includes("empresa") && <td className={`${densityClasses.cell}`}>
                                    <p className={`font-bold text-pf-black ${densityClasses.text}`}>{lead.companyName || "Pessoa Física"}</p>
                                    <p className={`${densityClasses.text} text-pf-grey mt-0.5`}>{lead.contactName}</p>
                                </td>}
                                {visibleColumns.includes("temperatura") && <td className={`${densityClasses.cell}`}>
                                    <span className={`flex items-center gap-2 ${densityClasses.text} text-pf-grey`}>
                                        <span className={`h-2 w-2 rounded-full shrink-0 ${tempDot[lead.temperature]}`} aria-hidden="true" />
                                        {tempLabel[lead.temperature]}
                                    </span>
                                </td>}
                                {visibleColumns.includes("valor") && <td className={`${densityClasses.cell} text-right font-mono font-bold text-pf-black`}>
                                    {lead.value ?? <span className="text-pf-grey/40 font-sans text-xs font-normal">&mdash;</span>}
                                </td>}
                                {visibleColumns.includes("data") && <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-pf-grey`}>{lead.date}</td>}
                                {visibleColumns.includes("estagio") && <td className={`${densityClasses.cell}`}>
                                    <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${stageStyle[lead.stage]}`}>{stageLabel[lead.stage]}</span>
                                </td>}
                                {visibleColumns.includes("acao") && <td className={`${densityClasses.cell} text-right`}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); window.alert(`Avançar estágio: ${lead.contactName}`); }}
                                        className="text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors"
                                    >
                                        Avançar
                                    </button>
                                </td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
