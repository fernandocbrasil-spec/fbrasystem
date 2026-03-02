"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { useToast } from "@/components/ui/toast";
import { Button, SearchInput } from "@/components/ui";
import { Plus, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

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

const INITIAL_LEADS: Lead[] = [
    { id: "1", companyName: "TechCorp BR", contactName: "Carlos Silva", temperature: "morno", stage: "novo", date: "01/03/2026" },
    { id: "2", contactName: "Ana Paula Consultoria", temperature: "frio", stage: "novo", date: "28/02/2026" },
    { id: "3", companyName: "Logistica ABC", contactName: "Marcos Torres", temperature: "quente", stage: "contato_feito", date: "27/02/2026" },
    { id: "4", companyName: "Grupo Sequoia", contactName: "Marcelo Furtado", temperature: "quente", value: "R$ 11.150,00/mes", stage: "proposta_enviada", date: "20/02/2026" },
];

const stageLabel: Record<LeadStage, string> = {
    novo: "Novo",
    contato_feito: "Em Contato",
    proposta_enviada: "Proposta Enviada",
    negociacao: "Negociacao",
    ganho: "Ganho",
};

const stageStyle: Record<LeadStage, string> = {
    novo: "bg-blue-100 text-blue-700",
    contato_feito: "bg-orange-100 text-orange-700",
    proposta_enviada: "bg-purple-100 text-purple-700",
    negociacao: "bg-yellow-100 text-yellow-700",
    ganho: "bg-green-100 text-green-700",
};

const STAGE_ORDER: LeadStage[] = ["novo", "contato_feito", "proposta_enviada", "negociacao", "ganho"];

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
    { key: "estagio", label: "Estagio", defaultVisible: true },
    { key: "acao", label: "Acao", defaultVisible: true },
];

const ALL_COLUMN_KEYS = TABLE_COLUMNS.map((c) => c.key);

const FILTER_DEFS: FilterDef[] = [
    { key: "temperatura", label: "Temperatura", options: [
        { value: "quente", label: "Quente" },
        { value: "morno", label: "Morno" },
        { value: "frio", label: "Frio" },
    ]},
    { key: "estagio", label: "Estagio", options: [
        { value: "novo", label: "Novo" },
        { value: "contato_feito", label: "Em Contato" },
        { value: "proposta_enviada", label: "Proposta Enviada" },
        { value: "negociacao", label: "Negociacao" },
        { value: "ganho", label: "Ganho" },
    ]},
];

function getTodayFormatted(): string {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

export default function LeadsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
    const [search, setSearch] = useState("");
    const [tempFilter, setTempFilter] = useState<string[]>([]);
    const [stageFilter, setStageFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMN_KEYS);
    const [density, setDensity] = useState<Density>("compact");

    // Inline form state
    const [showForm, setShowForm] = useState(false);
    const [formEmpresa, setFormEmpresa] = useState("");
    const [formContato, setFormContato] = useState("");
    const [formTemperatura, setFormTemperatura] = useState<LeadTemperature>("morno");
    const [formValor, setFormValor] = useState("");

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setTempFilter(filters.temperatura || []);
        setStageFilter(filters.estagio || []);
    };

    const densityClasses = getDensityClasses(density);

    const filtered = leads.filter((l) =>
        (search === "" ||
            l.contactName.toLowerCase().includes(search.toLowerCase()) ||
            (l.companyName ?? "").toLowerCase().includes(search.toLowerCase())) &&
        (tempFilter.length === 0 || tempFilter.includes(l.temperature)) &&
        (stageFilter.length === 0 || stageFilter.includes(l.stage))
    );

    // KPIs computed from stateful leads
    const leadsQuentes = leads.filter((l) => l.temperature === "quente").length;
    const leadsComProposta = leads.filter((l) => l.stage === "proposta_enviada" || l.stage === "negociacao").length;
    const leadsGanhos = leads.filter((l) => l.stage === "ganho").length;

    const resetForm = () => {
        setFormEmpresa("");
        setFormContato("");
        setFormTemperatura("morno");
        setFormValor("");
    };

    const handleOpenForm = () => {
        resetForm();
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        resetForm();
    };

    const handleAddLead = () => {
        if (!formContato.trim()) {
            toast("O campo Contato e obrigatorio.", "error");
            return;
        }

        const newLead: Lead = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            companyName: formEmpresa.trim() || undefined,
            contactName: formContato.trim(),
            temperature: formTemperatura,
            value: formValor.trim() || undefined,
            stage: "novo",
            date: getTodayFormatted(),
        };

        setLeads((prev) => [newLead, ...prev]);
        toast(`Lead "${formContato.trim()}" adicionado com sucesso.`, "success");
        handleCloseForm();
    };

    const handleAdvanceStage = (leadId: string) => {
        setLeads((prev) =>
            prev.map((lead) => {
                if (lead.id !== leadId) return lead;

                const currentIndex = STAGE_ORDER.indexOf(lead.stage);

                if (currentIndex === STAGE_ORDER.length - 1) {
                    toast(`"${lead.contactName}" ja esta no estagio final (Ganho).`, "info");
                    return lead;
                }

                const nextStage = STAGE_ORDER[currentIndex + 1];
                toast(
                    `"${lead.contactName}" avancou para ${stageLabel[nextStage]}.`,
                    nextStage === "ganho" ? "success" : "info"
                );
                return { ...lead, stage: nextStage };
            })
        );
    };

    const inputClasses = "border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded";

    return (
        <div>
            {/* PageHeader + KPIs scroll with content */}
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="CRM & Leads"
                    subtitle="Gerenciamento do pipeline de potenciais clientes e controle de propostas."
                    actions={
                        <Button icon={<Plus className="h-4 w-4" />} onClick={handleOpenForm}>
                            Novo Lead
                        </Button>
                    }
                />

                {/* Inline form for adding a new lead */}
                {showForm && (
                    <div className="border border-pf-grey/20 bg-white rounded p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-pf-black">Novo Lead</h3>
                            <button
                                onClick={handleCloseForm}
                                className="text-pf-grey hover:text-pf-black transition-colors"
                                aria-label="Fechar formulario"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="lead-empresa" className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                                    Empresa (opcional)
                                </label>
                                <input
                                    id="lead-empresa"
                                    type="text"
                                    value={formEmpresa}
                                    onChange={(e) => setFormEmpresa(e.target.value)}
                                    placeholder="Nome da empresa"
                                    className={inputClasses}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="lead-contato" className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                                    Contato *
                                </label>
                                <input
                                    id="lead-contato"
                                    type="text"
                                    value={formContato}
                                    onChange={(e) => setFormContato(e.target.value)}
                                    placeholder="Nome do contato"
                                    className={inputClasses}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="lead-temperatura" className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                                    Temperatura
                                </label>
                                <select
                                    id="lead-temperatura"
                                    value={formTemperatura}
                                    onChange={(e) => setFormTemperatura(e.target.value as LeadTemperature)}
                                    className={inputClasses}
                                >
                                    <option value="frio">Frio</option>
                                    <option value="morno">Morno</option>
                                    <option value="quente">Quente</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="lead-valor" className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                                    Valor Estimado (opcional)
                                </label>
                                <input
                                    id="lead-valor"
                                    type="text"
                                    value={formValor}
                                    onChange={(e) => setFormValor(e.target.value)}
                                    placeholder="R$ 0,00"
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-4">
                            <Button variant="secondary" onClick={handleCloseForm}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAddLead}>
                                Adicionar Lead
                            </Button>
                        </div>
                    </div>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Total de Leads</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{leads.length}</p>
                        <p className="text-[9px] text-pf-grey mt-1">No pipeline</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Leads Quentes</p>
                        <p className="font-sans text-xl font-bold text-red-600 mt-1 leading-none">{leadsQuentes}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Prioridade alta</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Em Negociacao</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{leadsComProposta}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Proposta ou negociacao</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Convertidos (Mes)</p>
                        <p className="font-sans text-xl font-bold text-green-600 mt-1 leading-none">{leadsGanhos}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Ganhos em Mar/2026</p>
                    </div>
                </div>
            </div>

            {/* Sticky: only search + ReportToolbar */}
            <div className="sticky top-0 z-20 bg-[#F4F5F7] py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Pipeline de Leads</span>
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Buscar lead ou empresa..."
                        aria-label="Buscar lead ou empresa"
                    />
                </div>

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

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("empresa") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Empresa / Contato</th>}
                            {visibleColumns.includes("temperatura") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Temperatura</th>}
                            {visibleColumns.includes("valor") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Valor Estimado</th>}
                            {visibleColumns.includes("data") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Data</th>}
                            {visibleColumns.includes("estagio") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Estagio</th>}
                            {visibleColumns.includes("acao") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Acao</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length}>
                                    <EmptyState
                                        title="Nenhum lead encontrado"
                                        message="Limpe os filtros ou adicione um novo lead."
                                    />
                                </td>
                            </tr>
                        ) : (
                            filtered.map((lead) => (
                                <tr
                                    key={lead.id}
                                    className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer"
                                >
                                    {visibleColumns.includes("empresa") && <td className={`${densityClasses.cell}`}>
                                        <p className={`font-bold text-pf-black ${densityClasses.text}`}>{lead.companyName || "Pessoa Fisica"}</p>
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
                                        {lead.stage === "ganho" ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const params = new URLSearchParams({
                                                        fromLead: lead.id,
                                                        client: lead.companyName || lead.contactName,
                                                        contact: lead.contactName,
                                                        ...(lead.value ? { value: lead.value } : {}),
                                                    });
                                                    router.push(`/propostas/nova?${params.toString()}`);
                                                }}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors"
                                            >
                                                Gerar Proposta
                                                <ArrowRight className="h-3 w-3" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAdvanceStage(lead.id);
                                                }}
                                                className="text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors"
                                            >
                                                Avancar
                                            </button>
                                        )}
                                    </td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
