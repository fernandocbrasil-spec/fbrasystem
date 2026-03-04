"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { ApprovalBadge } from "@/components/approval/approval-badge";
import { useToast } from "@/components/ui/toast";
import { TimeEntryForm } from "@/components/time-entry/time-entry-form";
import { getTimeEntries, getCases, submitTimeEntry, deleteTimeEntry, retractTimeEntry } from "@/lib/actions";
import { MOCK_CASE_OPTIONS } from "@/lib/mock-data";
import type { MockTimeEntry } from "@/lib/mock-data";
import type { MockCase } from "@/lib/mock-data";
import { Button, SearchInput } from "@/components/ui";
import {
    Play, Pause, Square, Plus, Clock, X, Send, Trash2, Undo2, AlertTriangle,
} from "lucide-react";

type ActivityType = "reuniao" | "pesquisa" | "elaboracao" | "revisao" | "audiencia" | "administrativo";
type TimerStatus = "idle" | "running" | "paused";

const ACTIVITY_LABELS: Record<ActivityType, string> = {
    reuniao: "Reuniao",
    pesquisa: "Pesquisa Juridica",
    elaboracao: "Elaboracao",
    revisao: "Revisao / Analise",
    audiencia: "Audiencia",
    administrativo: "Administrativo",
};

const billableStyle = { true: "bg-green-100 text-green-700", false: "bg-pf-grey/10 text-pf-grey" } as const;

function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTimerDisplay(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TimeTrackingPage() {
    const { toast } = useToast();

    // Stateful entries
    const [entries, setEntries] = useState<MockTimeEntry[]>([]);

    const loadEntries = useCallback(async () => {
        const data = await getTimeEntries();
        setEntries(data);
    }, []);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    // Manual form state
    const [showManualForm, setShowManualForm] = useState(false);
    const [caseOptions, setCaseOptions] = useState<Array<{ id: string; number: string; client: string }>>([]);

    // Load case options from DB
    useEffect(() => {
        getCases().then((cases: MockCase[]) => {
            const opts = cases.map((c) => ({ id: c.id, number: c.number, client: c.client }));
            setCaseOptions(opts.length > 0 ? opts : MOCK_CASE_OPTIONS);
        });
    }, []);

    // Timer state
    const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
    const [timerCaseId, setTimerCaseId] = useState(MOCK_CASE_OPTIONS[0].id);
    const [timerDesc, setTimerDesc] = useState("");
    const [timerBillable, setTimerBillable] = useState(true);
    const [accumulatedMs, setAccumulatedMs] = useState(0);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [displayMs, setDisplayMs] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["hora", "atividade", "descricao", "tipo", "duracao", "status", "acoes"]);
    const [density, setDensity] = useState<Density>("compact");

    const TABLE_COLUMNS: ColumnDef[] = [
        { key: "hora", label: "Hora" },
        { key: "atividade", label: "Atividade" },
        { key: "descricao", label: "Descricao" },
        { key: "tipo", label: "Tipo" },
        { key: "duracao", label: "Duracao" },
        { key: "status", label: "Status" },
        { key: "acoes", label: "Acoes" },
    ];

    const FILTER_DEFS: FilterDef[] = [
        { key: "activityType", label: "Tipo de Atividade", options: Object.entries(ACTIVITY_LABELS).map(([value, label]) => ({ value, label })) },
    ];

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setTypeFilter(filters.activityType || []);
    };

    const densityClasses = getDensityClasses(density);

    useEffect(() => {
        if (timerStatus === "running" && startedAt !== null) {
            intervalRef.current = setInterval(() => {
                setDisplayMs(accumulatedMs + (Date.now() - startedAt));
            }, 1000);
        } else {
            setDisplayMs(accumulatedMs);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [timerStatus, startedAt, accumulatedMs]);

    const startTimer = () => { setStartedAt(Date.now()); setTimerStatus("running"); };
    const pauseTimer = () => {
        if (startedAt) setAccumulatedMs(prev => prev + (Date.now() - startedAt));
        setStartedAt(null);
        setTimerStatus("paused");
    };
    const resumeTimer = () => { setStartedAt(Date.now()); setTimerStatus("running"); };
    const stopTimer = () => {
        setAccumulatedMs(0); setStartedAt(null); setDisplayMs(0);
        setTimerStatus("idle"); setTimerDesc("");
    };

    // Row actions
    const handleSubmitEntry = async (id: string) => {
        const result = await submitTimeEntry(id);
        if (result.success) {
            toast("Apontamento submetido para aprovacao.");
            loadEntries();
        } else {
            toast(result.error ?? "Erro ao submeter", "warning");
        }
    };

    const handleRetractEntry = async (id: string) => {
        const result = await retractTimeEntry(id);
        if (result.success) {
            toast("Apontamento retratado.");
            loadEntries();
        } else {
            toast(result.error ?? "Erro ao retratar", "warning");
        }
    };

    const handleDeleteEntry = async (id: string) => {
        const result = await deleteTimeEntry(id);
        if (result.success) {
            toast("Apontamento excluido.");
            loadEntries();
        } else {
            toast(result.error ?? "Erro ao excluir", "warning");
        }
    };

    // Filtered entries for today
    const todayEntries = entries.filter(e =>
        e.date === "2026-03-01" &&
        (search === "" || e.description.toLowerCase().includes(search.toLowerCase()) || e.clientName.toLowerCase().includes(search.toLowerCase())) &&
        (typeFilter.length === 0 || typeFilter.includes(e.activityType))
    );

    // KPIs computed from state
    const todayAll = entries.filter(e => e.date === "2026-03-01");
    const todayTotalMinutes = todayAll.reduce((s, e) => s + e.durationMinutes, 0);
    const draftCount = entries.filter(e => e.approvalStatus === "rascunho").length;
    const pendingCount = entries.filter(e => e.approvalStatus === "pendente").length;
    const monthMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0);

    return (
        <div>
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Apontamento de Horas"
                    subtitle="Registre e acompanhe as horas trabalhadas por caso."
                    actions={
                        <Button variant="dark" icon={<Plus className="h-4 w-4" />} onClick={() => setShowManualForm((prev) => !prev)}>
                            Lancar Manual
                        </Button>
                    }
                />

                {/* Manual Entry Form — shared component */}
                {showManualForm && (
                    <TimeEntryForm
                        caseOptions={caseOptions}
                        onSuccess={() => { setShowManualForm(false); loadEntries(); }}
                        onCancel={() => setShowManualForm(false)}
                    />
                )}

                {/* Timer Widget */}
                <div className={`bg-white border rounded p-3 flex flex-col md:flex-row items-start md:items-center gap-4 ${timerStatus === "running" ? "border-l-[3px] border-l-pf-blue border-pf-blue/20" : timerStatus === "paused" ? "border-l-[3px] border-l-orange-400 border-orange-200" : "border-pf-grey/20"}`}>
                    <div className="flex items-center gap-4 shrink-0">
                        {timerStatus === "running" && (
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                            </span>
                        )}
                        {timerStatus === "paused" && <span className="h-3 w-3 rounded-full bg-orange-400" />}
                        {timerStatus === "idle" && <Clock className="h-5 w-5 text-pf-grey/40" aria-hidden="true" />}
                        <span className={`font-mono text-xl font-bold tracking-tight ${timerStatus === "running" ? "text-pf-blue" : timerStatus === "paused" ? "text-orange-500" : "text-pf-grey/40"}`}>
                            {formatTimerDisplay(displayMs)}
                        </span>
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
                        <select
                            value={timerCaseId}
                            onChange={e => setTimerCaseId(e.target.value)}
                            disabled={timerStatus === "running"}
                            className="h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue disabled:opacity-50 bg-white"
                        >
                            {MOCK_CASE_OPTIONS.map(c => (
                                <option key={c.id} value={c.id}>{c.number} -- {c.client}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={timerDesc}
                            onChange={e => setTimerDesc(e.target.value)}
                            placeholder="Descricao da atividade..."
                            className="flex-1 h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-pf-grey cursor-pointer select-none">
                            <input type="checkbox" checked={timerBillable} onChange={e => setTimerBillable(e.target.checked)} className="accent-pf-blue" />
                            Faturavel
                        </label>
                        {timerStatus === "idle" && (
                            <button onClick={startTimer} className="flex h-8 w-8 items-center justify-center rounded-md bg-pf-blue text-white hover:bg-blue-700 transition-colors" aria-label="Iniciar timer"><Play className="h-4 w-4" /></button>
                        )}
                        {timerStatus === "running" && (
                            <>
                                <button onClick={pauseTimer} className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors" aria-label="Pausar"><Pause className="h-4 w-4" /></button>
                                <button onClick={stopTimer} className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors" aria-label="Parar e salvar"><Square className="h-4 w-4" /></button>
                            </>
                        )}
                        {timerStatus === "paused" && (
                            <>
                                <button onClick={resumeTimer} className="flex h-8 w-8 items-center justify-center rounded-md bg-pf-blue text-white hover:bg-blue-700 transition-colors" aria-label="Retomar"><Play className="h-4 w-4" /></button>
                                <button onClick={stopTimer} className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors" aria-label="Parar e salvar"><Square className="h-4 w-4" /></button>
                            </>
                        )}
                    </div>
                </div>

                {/* Draft reminder banner */}
                {draftCount > 0 && (
                    <div className="flex items-center gap-2 rounded bg-gray-50 border border-gray-200 px-4 py-2.5">
                        <AlertTriangle size={14} className="text-gray-500 shrink-0" />
                        <p className="text-xs font-semibold text-gray-600">
                            Voce tem <span className="text-pf-black">{draftCount}</span> rascunho{draftCount > 1 ? "s" : ""} nao submetido{draftCount > 1 ? "s" : ""}. Submeta para aprovacao.
                        </p>
                    </div>
                )}

                {/* KPI Strip */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Horas Hoje</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{formatDuration(todayTotalMinutes)}</p>
                        <p className="text-[9px] text-pf-grey mt-1">{todayAll.length} lancamentos</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Pend. Aprovacao</p>
                        <p className="font-sans text-xl font-bold text-orange-600 mt-1 leading-none">{pendingCount}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Aguardando socio</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Meta Mensal</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{Math.round((monthMinutes / 9600) * 100)}%</p>
                        <p className="text-[9px] text-pf-grey mt-1">{formatDuration(monthMinutes)} / 160:00 target</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Total do Mes</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{formatDuration(monthMinutes)}</p>
                        <p className="text-[9px] text-green-600 font-semibold mt-1">+12% vs Fevereiro</p>
                    </div>
                </div>
            </div>

            {/* Sticky: search + ReportToolbar */}
            <div className="sticky top-0 z-20 bg-[#F4F5F7] py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Lancamentos do Dia</span>
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Buscar atividade..."
                        aria-label="Buscar atividade"
                    />
                </div>

                <ReportToolbar
                    pageId="time-tracking"
                    columns={TABLE_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    currentFilters={{ activityType: typeFilter }}
                    filterDefs={FILTER_DEFS}
                    onApplyFilters={handleApplyFilters}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("hora") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Hora</th>}
                            {visibleColumns.includes("atividade") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Atividade</th>}
                            {visibleColumns.includes("descricao") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Descricao</th>}
                            {visibleColumns.includes("tipo") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Tipo</th>}
                            {visibleColumns.includes("duracao") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider text-right`}>Duracao</th>}
                            {visibleColumns.includes("status") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider text-right`}>Status</th>}
                            {visibleColumns.includes("acoes") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider text-right`}>Acoes</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {todayEntries.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length}>
                                    <EmptyState title="Nenhum lancamento encontrado" message="Limpe os filtros ou inicie o timer para registrar horas." />
                                </td>
                            </tr>
                        ) : (
                            todayEntries.map(entry => (
                                <tr key={entry.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors">
                                    {visibleColumns.includes("hora") && <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-pf-grey`}>{entry.startTime}</td>}
                                    {visibleColumns.includes("atividade") && <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-pf-grey">{ACTIVITY_LABELS[entry.activityType]}</span>
                                    </td>}
                                    {visibleColumns.includes("descricao") && <td className={`${densityClasses.cell}`}>
                                        <p className={`font-bold text-pf-black ${densityClasses.text} truncate max-w-[300px]`}>{entry.description}</p>
                                    </td>}
                                    {visibleColumns.includes("tipo") && <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                                        <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${entry.isBillable ? billableStyle.true : billableStyle.false}`}>
                                            {entry.isBillable ? "Faturavel" : "Interno"}
                                        </span>
                                    </td>}
                                    {visibleColumns.includes("duracao") && <td className={`${densityClasses.cell} ${densityClasses.text} text-right font-mono font-bold text-pf-blue`}>
                                        {formatDuration(entry.durationMinutes)}
                                    </td>}
                                    {visibleColumns.includes("status") && <td className={`${densityClasses.cell} text-right`}>
                                        <ApprovalBadge status={entry.approvalStatus} />
                                    </td>}
                                    {visibleColumns.includes("acoes") && <td className={`${densityClasses.cell} text-right`}>
                                        <div className="flex items-center justify-end gap-1">
                                            {entry.approvalStatus === "rascunho" && (
                                                <>
                                                    <button onClick={() => handleSubmitEntry(entry.id)} title="Submeter para aprovacao" className="p-1 rounded hover:bg-pf-blue/10 transition-colors">
                                                        <Send size={12} className="text-pf-blue" />
                                                    </button>
                                                    <button onClick={() => handleDeleteEntry(entry.id)} title="Excluir" className="p-1 rounded hover:bg-red-50 transition-colors">
                                                        <Trash2 size={12} className="text-red-400" />
                                                    </button>
                                                </>
                                            )}
                                            {entry.approvalStatus === "pendente" && (
                                                <button onClick={() => handleRetractEntry(entry.id)} title="Retratar" className="p-1 rounded hover:bg-orange-50 transition-colors">
                                                    <Undo2 size={12} className="text-orange-500" />
                                                </button>
                                            )}
                                            {entry.approvalStatus === "rejeitado" && (
                                                <button onClick={() => handleDeleteEntry(entry.id)} title="Excluir" className="p-1 rounded hover:bg-red-50 transition-colors">
                                                    <Trash2 size={12} className="text-red-400" />
                                                </button>
                                            )}
                                        </div>
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
