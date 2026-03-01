"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { Plus, FileEdit, Download, CheckCircle, Clock, Search } from "lucide-react";

type ProposalStatus = "Em Revisão" | "Aprovada";

const proposals: {
    id: string;
    title: string;
    client: string;
    status: ProposalStatus;
    date: string;
    value: string;
}[] = [
    { id: "1", title: "Assessoria Contábil e Fiscal", client: "Grupo Sequoia", status: "Em Revisão", date: "26/02/2026", value: "R$ 11.150,00" },
    { id: "2", title: "Planejamento Tributário", client: "TechCorp BR", status: "Aprovada", date: "20/02/2026", value: "R$ 45.000,00" },
];

const statusStyle: Record<ProposalStatus, string> = {
    "Em Revisão": "bg-orange-100 text-orange-700",
    "Aprovada": "bg-green-100 text-green-700",
};

const StatusIcon = ({ status }: { status: ProposalStatus }) =>
    status === "Aprovada" ? <CheckCircle className="h-3 w-3" aria-hidden="true" /> : <Clock className="h-3 w-3" aria-hidden="true" />;

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "titulo", label: "Título / Cliente", defaultVisible: true },
    { key: "data", label: "Data", defaultVisible: true },
    { key: "valor", label: "Valor Total", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
    { key: "acoes", label: "Ações", defaultVisible: true },
];

const ALL_COLUMN_KEYS = TABLE_COLUMNS.map((c) => c.key);

const FILTER_DEFS: FilterDef[] = [
    { key: "status", label: "Status", options: [
        { value: "Em Revisão", label: "Em Revisão" },
        { value: "Aprovada", label: "Aprovada" },
    ]},
];

export default function ProposalsPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMN_KEYS);
    const [density, setDensity] = useState<Density>("compact");

    const densityClasses = getDensityClasses(density);

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setStatusFilter(filters.status || []);
    };

    const filtered = proposals.filter((p) =>
        (search === "" || p.title.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter.length === 0 || statusFilter.includes(p.status))
    );

    return (
        <div>
            <div className="sticky top-0 z-20 bg-[#F4F5F7] space-y-2 pb-3">
                <PageHeader
                    title="Propostas de Honorários"
                    subtitle="Gerenciamento e geração de propostas comerciais no padrão do escritório."
                    actions={
                        <button
                            onClick={() => window.alert("Abrindo Editor de Propostas.")}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-blue px-3 py-1.5 font-sans text-xs font-bold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-sm"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Nova Proposta
                        </button>
                    }
                />

                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Todas as Propostas</span>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar proposta..."
                                aria-label="Buscar proposta"
                                className="h-8 w-48 rounded-md border border-pf-grey/20 pl-10 pr-4 text-sm font-sans outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                            />
                        </div>
                        <FilterDropdown
                            label="Status"
                            options={[
                                { value: "Em Revisão", label: "Em Revisão" },
                                { value: "Aprovada", label: "Aprovada" },
                            ]}
                            selected={statusFilter}
                            onChange={setStatusFilter}
                        />
                    </div>
                </div>

                <ReportToolbar
                    pageId="propostas"
                    columns={TABLE_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    currentFilters={{ status: statusFilter }}
                    filterDefs={FILTER_DEFS}
                    onApplyFilters={handleApplyFilters}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("titulo") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Título / Cliente</th>}
                            {visibleColumns.includes("data") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Data</th>}
                            {visibleColumns.includes("valor") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Valor Total</th>}
                            {visibleColumns.includes("status") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Status</th>}
                            {visibleColumns.includes("acoes") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((proposal) => (
                            <tr key={proposal.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer">
                                {visibleColumns.includes("titulo") && <td className={`${densityClasses.cell}`}>
                                    <p className={`font-bold text-pf-black ${densityClasses.text}`}>{proposal.title}</p>
                                    <p className={`${densityClasses.text} text-pf-grey mt-0.5`}>{proposal.client}</p>
                                </td>}
                                {visibleColumns.includes("data") && <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-pf-grey`}>{proposal.date}</td>}
                                {visibleColumns.includes("valor") && <td className={`${densityClasses.cell} ${densityClasses.text} font-bold text-pf-black font-mono text-right`}>{proposal.value}</td>}
                                {visibleColumns.includes("status") && <td className={`${densityClasses.cell}`}>
                                    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle[proposal.status]}`}>
                                        <StatusIcon status={proposal.status} />
                                        {proposal.status}
                                    </span>
                                </td>}
                                {visibleColumns.includes("acoes") && <td className={`${densityClasses.cell} text-right`}>
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => window.alert(`Editando: ${proposal.title}`)}
                                            aria-label="Editar proposta"
                                            className="p-2 text-pf-grey hover:text-pf-blue transition-colors"
                                        >
                                            <FileEdit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => window.alert("Gerando PDF dinâmico.")}
                                            aria-label="Baixar PDF"
                                            className="p-2 text-pf-grey hover:text-pf-blue transition-colors"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
