"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { Receipt, Calendar, CheckSquare, Search } from "lucide-react";

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "mes", label: "Mês Ref.", defaultVisible: true },
    { key: "cliente", label: "Cliente / Caso", defaultVisible: true },
    { key: "modalidade", label: "Modalidade", defaultVisible: true },
    { key: "valor", label: "Valor Bruto", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
    { key: "acao", label: "Ação", defaultVisible: true },
];

type InvoiceStatus = "Pendente Aprovação" | "Faturado" | "Rascunho";

type Invoice = {
    id: string;
    month: string;
    client: string;
    case: string;
    value: string;
    status: InvoiceStatus;
    type: string;
};

const invoices: Invoice[] = [
    { id: "1", month: "02/2026", client: "Grupo Sequoia", case: "Assessoria Contábil e Fiscal", value: "R$ 13.045,51", status: "Pendente Aprovação", type: "Fixo Mensal" },
    { id: "2", month: "02/2026", client: "TechCorp BR", case: "Planejamento Tributário 2026", value: "R$ 45.000,00", status: "Faturado", type: "Êxito / Única" },
    { id: "3", month: "02/2026", client: "Indústria Metal SP", case: "Consultoria Trabalhista HR", value: "R$ 8.540,00", status: "Rascunho", type: "Horas (Time & Material)" },
];

const statusStyle: Record<InvoiceStatus, string> = {
    "Pendente Aprovação": "bg-orange-100 text-orange-700",
    Faturado: "bg-green-100 text-green-700",
    Rascunho: "bg-pf-grey/10 text-pf-grey",
};

const FILTER_DEFS: FilterDef[] = [
    { key: "modalidade", label: "Modalidade", options: [
        { value: "Fixo Mensal", label: "Fixo Mensal" },
        { value: "Êxito / Única", label: "Êxito / Única" },
        { value: "Horas (Time & Material)", label: "Horas" },
    ]},
];

export default function BillingPage() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["mes", "cliente", "modalidade", "valor", "status", "acao"]);
    const [density, setDensity] = useState<Density>("compact");

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setTypeFilter(filters.modalidade || []);
    };

    const filtered = invoices.filter((inv) =>
        (search === "" || inv.client.toLowerCase().includes(search.toLowerCase()) || inv.case.toLowerCase().includes(search.toLowerCase())) &&
        (typeFilter.length === 0 || typeFilter.includes(inv.type))
    );

    return (
        <div>
            <div className="sticky top-0 z-20 bg-[#F4F5F7] space-y-2 pb-3">
                <PageHeader
                    title="Faturamento (Pré-Faturas)"
                    subtitle="Módulo de geração e aprovação de cobranças baseadas nos contratos (Plans) ou Horas."
                    actions={
                        <button
                            onClick={() => window.alert("Engine de Cálculo Acionada: Varrendo Drizzle DB em busca de Planos Fixos Ativos e Tabela de Horas.")}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-black px-4 py-1.5 font-sans text-xs font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm"
                        >
                            <Receipt className="h-4 w-4" aria-hidden="true" />
                            Rodar Engine de Fechamento (Fev/26)
                        </button>
                    }
                />

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Total a Faturar</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 66.585</p>
                        <p className="text-[9px] text-green-600 font-semibold mt-1">+12% vs mês anterior</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Horas Apontadas</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">124h 30m</p>
                        <p className="text-[9px] text-orange-500 font-semibold mt-1">18h pendentes aprovação</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Pré-Faturas Abertas</p>
                        <p className="font-sans text-xl font-bold text-pf-blue mt-1 leading-none">4</p>
                        <p className="text-[9px] text-pf-grey mt-1">Fevereiro/2026</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Ticket Médio</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 22.195</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Pré-Faturas do Período</span>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar cliente ou caso..."
                                aria-label="Buscar cliente ou caso"
                                className="h-8 w-48 rounded-md border border-pf-grey/20 pl-10 pr-4 text-sm font-sans outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                            />
                        </div>
                        <button
                            onClick={() => window.alert("Modal Calendário: Filtrar relatórios por outra competência.")}
                            className="flex h-8 items-center gap-2 rounded-md border border-pf-grey/20 bg-white px-4 text-sm font-semibold text-pf-black hover:bg-pf-blue/5 hover:text-pf-blue hover:border-pf-blue transition-colors"
                        >
                            <Calendar className="h-4 w-4" aria-hidden="true" /> Fev/2026
                        </button>
                        <FilterDropdown
                            label="Modalidade"
                            options={[
                                { value: "Fixo Mensal", label: "Fixo Mensal" },
                                { value: "Êxito / Única", label: "Êxito / Única" },
                                { value: "Horas (Time & Material)", label: "Horas" },
                            ]}
                            selected={typeFilter}
                            onChange={setTypeFilter}
                        />
                    </div>
                </div>

                {/* Report Toolbar */}
                <ReportToolbar
                    pageId="faturamento"
                    columns={TABLE_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    currentFilters={{ modalidade: typeFilter }}
                    filterDefs={FILTER_DEFS}
                    onApplyFilters={handleApplyFilters}
                />
            </div>

            {/* Lista agrupada */}
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("mes") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider`}>Mês Ref.</th>}
                            {visibleColumns.includes("cliente") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider`}>Cliente / Caso</th>}
                            {visibleColumns.includes("modalidade") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider`}>Modalidade</th>}
                            {visibleColumns.includes("valor") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider text-right`}>Valor Bruto</th>}
                            {visibleColumns.includes("status") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider`}>Status</th>}
                            {visibleColumns.includes("acao") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider text-right`}>Ação</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((inv) => (
                            <tr key={inv.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer">
                                {visibleColumns.includes("mes") && <td className={`${getDensityClasses(density).cell} text-pf-grey font-mono ${getDensityClasses(density).text}`}>{inv.month}</td>}
                                {visibleColumns.includes("cliente") && <td className={`${getDensityClasses(density).cell}`}>
                                    <p className={`font-bold text-pf-black ${getDensityClasses(density).text}`}>{inv.client}</p>
                                    <p className={`${getDensityClasses(density).text} text-pf-grey truncate max-w-[200px] mt-0.5`}>{inv.case}</p>
                                </td>}
                                {visibleColumns.includes("modalidade") && <td className={`${getDensityClasses(density).cell} text-pf-grey ${getDensityClasses(density).text} uppercase font-bold`}>{inv.type}</td>}
                                {visibleColumns.includes("valor") && <td className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} text-right font-bold text-pf-black font-mono`}>{inv.value}</td>}
                                {visibleColumns.includes("status") && <td className={`${getDensityClasses(density).cell}`}>
                                    <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle[inv.status]}`}>{inv.status}</span>
                                </td>}
                                {visibleColumns.includes("acao") && <td className={`${getDensityClasses(density).cell} text-right`}>
                                    {inv.status === "Faturado" ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); window.alert("Integração pendente (Fase 6): Conexão com API NFS-e SP para baixar o PDF simulado da Nota Fiscal."); }}
                                            aria-label="Baixar NFS-e"
                                            className="rounded p-2 text-pf-blue hover:bg-pf-blue/10 transition-all font-bold text-xs"
                                        >
                                            NFS-E
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); window.alert(`Abrindo rascunho de pré-fatura para revisar horas do cliente ${inv.client}.`); }}
                                            aria-label={`Revisar pré-fatura ${inv.client}`}
                                            className="flex items-center gap-1 rounded bg-pf-blue/10 px-2 py-1.5 text-xs font-bold text-pf-blue hover:bg-pf-blue hover:text-white transition-all"
                                        >
                                            <CheckSquare className="h-3 w-3" aria-hidden="true" />
                                            Revisar
                                        </button>
                                    )}
                                </td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
