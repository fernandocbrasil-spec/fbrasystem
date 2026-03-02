"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { useToast } from "@/components/ui/toast";
import { Button, SearchInput } from "@/components/ui";
import { Play, Briefcase, CalendarDays, X } from "lucide-react";

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

const WORKFLOW_TEMPLATES: Record<string, number> = {
    "Onboarding de Cliente": 5,
    "Aprovacao de Proposta": 3,
    "Fechamento Contabil Mensal": 6,
    "Encerramento de Caso": 4,
};

const INITIAL_WORKFLOWS: Workflow[] = [
    { id: "1", code: "WF-2026-001", name: "Onboarding de Cliente", entity: "Grupo Sequoia", responsible: "Jose Rafael Feiteiro", completedSteps: 2, totalSteps: 5, dueDate: "06/03/2026", status: "Em Andamento" },
    { id: "2", code: "WF-2026-002", name: "Aprovacao de Proposta", entity: "TechCorp BR", responsible: "Ana Souza", completedSteps: 1, totalSteps: 3, dueDate: "28/02/2026", status: "Aguardando Aprovação" },
    { id: "3", code: "WF-2026-003", name: "Fechamento Contabil Mensal", entity: "Competencia Fev/2026", responsible: "Financeiro", completedSteps: 3, totalSteps: 6, dueDate: "01/03/2026", status: "Atrasado" },
    { id: "4", code: "WF-2026-004", name: "Encerramento de Caso", entity: "Logistica ABC", responsible: "Ana Souza", completedSteps: 5, totalSteps: 5, dueDate: "17/02/2026", status: "Concluído" },
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

function formatDateBR(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

export default function WorkflowsPage() {
    const { toast } = useToast();
    const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState(Object.keys(WORKFLOW_TEMPLATES)[0]);
    const [formEntity, setFormEntity] = useState("");
    const [formResponsible, setFormResponsible] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["codigo", "workflow", "responsavel", "progresso", "prazo", "status"]);
    const [density, setDensity] = useState<Density>("compact");

    const TABLE_COLUMNS: ColumnDef[] = [
        { key: "codigo", label: "Codigo" },
        { key: "workflow", label: "Workflow / Entidade" },
        { key: "responsavel", label: "Responsavel" },
        { key: "progresso", label: "Progresso" },
        { key: "prazo", label: "Prazo" },
        { key: "status", label: "Status" },
    ];

    const densityClasses = getDensityClasses(density);

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setStatusFilter(filters.status || []);
    };

    const handleSubmitWorkflow = () => {
        if (!formEntity.trim() || !formResponsible.trim()) return;

        const nextNum = workflows.length + 1;
        const code = `WF-2026-${String(nextNum).padStart(3, "0")}`;
        const totalSteps = WORKFLOW_TEMPLATES[formName] || 5;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const newWorkflow: Workflow = {
            id: `wf-${Date.now()}`,
            code,
            name: formName,
            entity: formEntity.trim(),
            responsible: formResponsible.trim(),
            completedSteps: 0,
            totalSteps,
            dueDate: formatDateBR(dueDate),
            status: "Em Andamento",
        };

        setWorkflows((prev) => [newWorkflow, ...prev]);
        setShowForm(false);
        setFormEntity("");
        setFormResponsible("");
        setFormName(Object.keys(WORKFLOW_TEMPLATES)[0]);
        toast(`Workflow "${code}" iniciado com sucesso.`, "success");
    };

    const filtered = workflows.filter((wf) =>
        (search === "" || wf.name.toLowerCase().includes(search.toLowerCase()) || wf.entity.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter.length === 0 || statusFilter.includes(wf.status))
    );

    // KPIs computed from state
    const activeCount = workflows.filter((wf) => wf.status !== "Concluído").length;
    const awaitingCount = workflows.filter((wf) => wf.status === "Aguardando Aprovação").length;
    const overdueCount = workflows.filter((wf) => wf.status === "Atrasado").length;
    const completedCount = workflows.filter((wf) => wf.status === "Concluído").length;

    return (
        <div>
            {/* PageHeader + KPIs scroll with content */}
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Workflows"
                    subtitle="Gerencie processos padronizados e acompanhe o progresso de cada etapa."
                    actions={
                        <Button icon={<Play className="h-4 w-4" />} onClick={() => setShowForm((prev) => !prev)}>
                            Iniciar Workflow
                        </Button>
                    }
                />

                {/* Inline Form */}
                {showForm && (
                    <div className="bg-white border border-pf-grey/20 rounded p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-pf-black">Novo Workflow</h3>
                            <button onClick={() => setShowForm(false)} className="text-pf-grey hover:text-pf-black transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Nome do Workflow</label>
                                <select
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                                >
                                    {Object.keys(WORKFLOW_TEMPLATES).map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Entidade</label>
                                <input
                                    type="text"
                                    value={formEntity}
                                    onChange={(e) => setFormEntity(e.target.value)}
                                    placeholder="Ex: Grupo Sequoia"
                                    className="w-full h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Responsavel</label>
                                <input
                                    type="text"
                                    value={formResponsible}
                                    onChange={(e) => setFormResponsible(e.target.value)}
                                    placeholder="Ex: Ana Souza"
                                    className="w-full h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleSubmitWorkflow} disabled={!formEntity.trim() || !formResponsible.trim()}>
                                Iniciar
                            </Button>
                        </div>
                    </div>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Workflows Ativos</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{activeCount}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Em andamento ou pendentes</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Aguardando Aprovacao</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{awaitingCount}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Requer acao de aprovador</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Atrasados</p>
                        <p className="font-sans text-xl font-bold text-red-600 mt-1 leading-none">{overdueCount}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Prazo expirado</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Concluidos (Mes)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{completedCount}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Finalizados em Mar/2026</p>
                    </div>
                </div>
            </div>

            {/* Sticky: only search + ReportToolbar */}
            <div className="sticky top-0 z-20 bg-[#F4F5F7] py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Workflows do Periodo</span>
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Buscar workflow..."
                        aria-label="Buscar workflow"
                    />
                </div>

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

            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("codigo") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Codigo</th>}
                            {visibleColumns.includes("workflow") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Workflow / Entidade</th>}
                            {visibleColumns.includes("responsavel") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Responsavel</th>}
                            {visibleColumns.includes("progresso") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Progresso</th>}
                            {visibleColumns.includes("prazo") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Prazo</th>}
                            {visibleColumns.includes("status") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Status</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length}>
                                    <EmptyState
                                        title="Nenhum workflow encontrado"
                                        message="Limpe os filtros ou inicie um novo workflow."
                                    />
                                </td>
                            </tr>
                        ) : (
                            filtered.map((wf) => (
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
