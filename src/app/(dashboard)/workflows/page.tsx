"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { Search, Play, Briefcase, CalendarDays } from "lucide-react";

type WorkflowStatus = "Atrasado" | "Aguardando Aprovação" | "Em Andamento" | "Concluído";

type Workflow = {
    id: string;
    code: string;
    name: string;
    entity: string;
    responsible: string;
    completedSteps: number;
    totalSteps: number;
    dueDate: string;
    status: WorkflowStatus;
};

const workflows: Workflow[] = [
    { id: "1", code: "WF-2026-001", name: "Onboarding de Cliente", entity: "Grupo Sequoia", responsible: "José Rafael Feiteiro", completedSteps: 2, totalSteps: 5, dueDate: "06/03/2026", status: "Em Andamento" },
    { id: "2", code: "WF-2026-002", name: "Aprovação de Proposta", entity: "TechCorp BR", responsible: "Ana Souza", completedSteps: 1, totalSteps: 3, dueDate: "28/02/2026", status: "Aguardando Aprovação" },
    { id: "3", code: "WF-2026-003", name: "Fechamento Contábil Mensal", entity: "Competência Fev/2026", responsible: "Financeiro", completedSteps: 3, totalSteps: 6, dueDate: "01/03/2026", status: "Atrasado" },
    { id: "4", code: "WF-2026-004", name: "Encerramento de Caso", entity: "Logística ABC", responsible: "Ana Souza", completedSteps: 5, totalSteps: 5, dueDate: "17/02/2026", status: "Concluído" },
];

const statusStyle: Record<WorkflowStatus, string> = {
    "Atrasado": "bg-red-100 text-red-700",
    "Aguardando Aprovação": "bg-orange-100 text-orange-700",
    "Em Andamento": "bg-blue-100 text-blue-700",
    "Concluído": "bg-green-100 text-green-700",
};

const FILTER_DEFS: FilterDef[] = [
    { key: "status", label: "Status", options: [
        { value: "Atrasado", label: "Atrasado" },
        { value: "Aguardando Aprovação", label: "Aguardando Aprovação" },
        { value: "Em Andamento", label: "Em Andamento" },
        { value: "Concluído", label: "Concluído" },
    ]},
];

export default function WorkflowsPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["codigo", "workflow", "responsavel", "progresso", "prazo", "status"]);
    const [density, setDensity] = useState<Density>("compact");

    const TABLE_COLUMNS: ColumnDef[] = [
        { key: "codigo", label: "Código" },
        { key: "workflow", label: "Workflow / Entidade" },
        { key: "responsavel", label: "Responsável" },
        { key: "progresso", label: "Progresso" },
        { key: "prazo", label: "Prazo" },
        { key: "status", label: "Status" },
    ];

    const densityClasses = getDensityClasses(density);

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setStatusFilter(filters.status || []);
    };

    const statusOptions: { value: string; label: string }[] = [
        { value: "Atrasado", label: "Atrasado" },
        { value: "Aguardando Aprovação", label: "Aguardando Aprovação" },
        { value: "Em Andamento", label: "Em Andamento" },
        { value: "Concluído", label: "Concluído" },
    ];

    const filtered = workflows.filter((wf) =>
        (search === "" || wf.name.toLowerCase().includes(search.toLowerCase()) || wf.entity.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter.length === 0 || statusFilter.includes(wf.status))
    );

    return (
        <div>
            <div className="sticky top-0 z-20 bg-[#F4F5F7] space-y-2 pb-3">
                <PageHeader
                    title="Workflows"
                    subtitle="Gerencie processos padronizados e acompanhe o progresso de cada etapa."
                    actions={
                        <button
                            onClick={() => window.alert("Iniciar novo Workflow.")}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-blue px-3 py-1.5 font-sans text-xs font-bold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-sm"
                        >
                            <Play className="h-4 w-4" aria-hidden="true" />
                            Iniciar Workflow
                        </button>
                    }
                />

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Workflows Ativos</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">3</p>
                        <p className="text-[9px] text-pf-grey mt-1">Em andamento ou pendentes</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Aguardando Aprovação</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">1</p>
                        <p className="text-[9px] text-pf-grey mt-1">Requer ação de aprovador</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Atrasados</p>
                        <p className="font-sans text-xl font-bold text-red-600 mt-1 leading-none">1</p>
                        <p className="text-[9px] text-pf-grey mt-1">Prazo expirado</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Concluídos (Mês)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">1</p>
                        <p className="text-[9px] text-pf-grey mt-1">Finalizados em Mar/2026</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Workflows do Período</span>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar workflow..."
                                aria-label="Buscar workflow"
                                className="h-8 w-48 rounded-md border border-pf-grey/20 pl-10 pr-4 text-sm font-sans outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                            />
                        </div>
                        <FilterDropdown
                            label="Status"
                            options={statusOptions}
                            selected={statusFilter}
                            onChange={setStatusFilter}
                        />
                    </div>
                </div>

                {/* Report Toolbar */}
                <ReportToolbar
                    pageId="workflows"
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

            {/* Lista agrupada */}
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("codigo") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Código</th>}
                            {visibleColumns.includes("workflow") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Workflow / Entidade</th>}
                            {visibleColumns.includes("responsavel") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Responsável</th>}
                            {visibleColumns.includes("progresso") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Progresso</th>}
                            {visibleColumns.includes("prazo") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Prazo</th>}
                            {visibleColumns.includes("status") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Status</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((wf) => (
                            <tr key={wf.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer">
                                {visibleColumns.includes("codigo") && <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-pf-grey`}>{wf.code}</td>}
                                {visibleColumns.includes("workflow") && <td className={`${densityClasses.cell}`}>
                                    <p className={`font-bold text-pf-black ${densityClasses.text}`}>{wf.name}</p>
                                    <p className={`${densityClasses.text} text-pf-grey mt-0.5`}>{wf.entity}</p>
                                </td>}
                                {visibleColumns.includes("responsavel") && <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                                    <span className="flex items-center gap-1.5 text-pf-black">
                                        <Briefcase className="h-3.5 w-3.5 text-pf-grey shrink-0" aria-hidden="true" />
                                        {wf.responsible}
                                    </span>
                                </td>}
                                {visibleColumns.includes("progresso") && <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-24 bg-pf-grey/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-pf-blue rounded-full" style={{ width: `${(wf.completedSteps / wf.totalSteps) * 100}%` }} />
                                        </div>
                                        <span className="text-[10px] font-mono text-pf-grey">{wf.completedSteps}/{wf.totalSteps}</span>
                                    </div>
                                </td>}
                                {visibleColumns.includes("prazo") && <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                                    <span className="flex items-center gap-1.5 text-pf-grey font-mono">
                                        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                        {wf.dueDate}
                                    </span>
                                </td>}
                                {visibleColumns.includes("status") && <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                                    <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle[wf.status]}`}>{wf.status}</span>
                                </td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
