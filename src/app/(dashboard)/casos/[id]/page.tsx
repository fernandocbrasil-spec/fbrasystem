"use client"

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { TimeEntryForm } from "@/components/time-entry/time-entry-form";
import { TimeEntryTable } from "@/components/time-entry/time-entry-table";
import { ApprovalBadge } from "@/components/approval/approval-badge";
import { Clock, CheckSquare, FileText, User, ArrowLeft, Plus, X, ChevronRight, AlertTriangle, FolderOpen, ExternalLink, FileIcon, Loader2, Mic, Sparkles } from "lucide-react";
import Link from "next/link";
import {
    getCaseById,
    getTasksForCase,
    createTask,
    updateTaskStatus,
    deleteTask,
    getCapStatusAction,
    getTimeEntries,
    submitTimeEntry,
    retractTimeEntry,
    deleteTimeEntry,
    getCaseDriveInfo,
    listCaseFiles,
    createOrGetCaseFolder,
    getCaseMeetings,
    summarizeMeeting,
} from "@/lib/actions";
import type { CaseMeeting, SummarizeMeetingResult } from "@/lib/actions";
import type { MeetingSummaryResult } from "@/lib/integrations/ai";
import type { CaseDriveInfo } from "@/lib/actions";
import type { GDriveFile } from "@/lib/integrations/gdrive";
import type { MockCase } from "@/lib/mock-data";
import type { MockTimeEntry } from "@/lib/mock-data";
import type { TaskItem } from "@/lib/actions/tasks";
import type { CapStatus } from "@/lib/billing/cap";

// ─── Priority mapping ───────────────────────────────────────────────────────

type Priority = "Alta" | "Media" | "Baixa";

const DB_TO_UI_PRIORITY: Record<string, Priority> = {
    urgent: "Alta", high: "Alta", medium: "Media", low: "Baixa",
};
const UI_TO_DB_PRIORITY: Record<Priority, string> = {
    Alta: "high", Media: "medium", Baixa: "low",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function capColor(threshold: string): string {
    if (threshold === "ok") return "bg-emerald-500";
    if (threshold === "warning") return "bg-amber-500";
    return "bg-red-500";
}

function capTextColor(threshold: string): string {
    if (threshold === "ok") return "text-emerald-600";
    if (threshold === "warning") return "text-amber-600";
    return "text-red-600";
}


// ─── Page ───────────────────────────────────────────────────────────────────

export default function CaseDetailsPage({ params }: { params: { id: string } }) {
    const [activeTab, setActiveTab] = useState("tarefas");
    const { toast } = useToast();

    // Case metadata (from DB)
    const [caseData, setCaseData] = useState<MockCase | null>(null);
    const [caseLoading, setCaseLoading] = useState(true);

    // Tasks state (server-persisted)
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [showNewTask, setShowNewTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<Priority>("Media");
    const [guardError, setGuardError] = useState<string | null>(null);

    // Cap status
    const [capStatus, setCapStatus] = useState<CapStatus | null>(null);

    // Time entries (from DB via server action)
    const [timeEntries, setTimeEntries] = useState<MockTimeEntry[]>([]);
    const [timeEntriesLoading, setTimeEntriesLoading] = useState(true);
    const [showTimeForm, setShowTimeForm] = useState(false);

    // Drive state
    const [driveInfo, setDriveInfo] = useState<CaseDriveInfo>({ folderId: null, folderUrl: null });
    const [driveFiles, setDriveFiles] = useState<GDriveFile[]>([]);
    const [driveLoading, setDriveLoading] = useState(true);
    const [driveCreating, setDriveCreating] = useState(false);

    // Meetings / AI
    const [caseMeetings, setCaseMeetings] = useState<CaseMeeting[]>([]);
    const [meetingsLoading, setMeetingsLoading] = useState(true);
    const [summarizingId, setSummarizingId] = useState<string | null>(null);
    const [summaryResult, setSummaryResult] = useState<MeetingSummaryResult | null>(null);
    const [summaryMeetingId, setSummaryMeetingId] = useState<string | null>(null);

    // ── Loaders ──

    const loadCase = useCallback(async () => {
        try {
            const data = await getCaseById(params.id);
            setCaseData(data);
        } finally {
            setCaseLoading(false);
        }
    }, [params.id]);

    const loadTasks = useCallback(async () => {
        try {
            const data = await getTasksForCase(params.id);
            setTasks(data);
        } finally {
            setTasksLoading(false);
        }
    }, [params.id]);

    const loadCap = useCallback(async () => {
        const today = new Date().toISOString().split("T")[0];
        const cap = await getCapStatusAction(params.id, today);
        setCapStatus(cap);
    }, [params.id]);

    const loadTimeEntries = useCallback(async () => {
        try {
            const data = await getTimeEntries({ caseId: params.id });
            setTimeEntries(data);
        } finally {
            setTimeEntriesLoading(false);
        }
    }, [params.id]);

    const loadDrive = useCallback(async () => {
        try {
            const info = await getCaseDriveInfo(params.id);
            setDriveInfo(info);
            if (info.folderId) {
                const files = await listCaseFiles(params.id);
                setDriveFiles(files);
            }
        } finally {
            setDriveLoading(false);
        }
    }, [params.id]);

    const loadMeetings = useCallback(async () => {
        try {
            const m = await getCaseMeetings(params.id);
            setCaseMeetings(m);
        } finally {
            setMeetingsLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        loadCase();
        loadTasks();
        loadCap();
        loadTimeEntries();
        loadDrive();
        loadMeetings();
    }, [loadCase, loadTasks, loadCap, loadTimeEntries, loadDrive, loadMeetings]);

    const handleSummarizeMeeting = async (meetingId: string) => {
        setSummarizingId(meetingId);
        setSummaryResult(null);
        const res = await summarizeMeeting(meetingId);
        if (res.success && res.data) {
            setSummaryResult(res.data);
            setSummaryMeetingId(meetingId);
            loadMeetings();
            toast("Reuniao resumida com sucesso", "success");
        } else {
            toast(res.error ?? "Erro ao resumir reuniao", "error");
        }
        setSummarizingId(null);
    };

    // ── Tab definitions ──

    const TABS = [
        { id: "visao_geral", label: "Visao Geral", icon: <FileText className="h-4 w-4" /> },
        { id: "tarefas", label: "Tarefas (Kanban)", icon: <CheckSquare className="h-4 w-4" /> },
        { id: "horas", label: "Planilha de Horas", icon: <Clock className="h-4 w-4" /> },
        { id: "arquivos", label: "Arquivos", icon: <FolderOpen className="h-4 w-4" /> },
        { id: "reunioes", label: "Reunioes", icon: <Mic className="h-4 w-4" /> },
        { id: "equipe", label: "Equipe do Caso", icon: <User className="h-4 w-4" /> },
    ];

    // ── Derived data ──

    const todoTasks = tasks.filter((t) => t.status === "todo");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
    const doneTasks = tasks.filter((t) => t.status === "done");

    const totalMinutes = timeEntries.reduce((s, e) => s + e.durationMinutes, 0);
    const pendingApproval = timeEntries.filter((e) => e.approvalStatus === "pendente").length;

    // Equipe: group time entries by professional
    const equipeMap = new Map<string, { minutes: number; count: number; billableMinutes: number }>();
    for (const e of timeEntries) {
        const name = e.submittedBy ?? "Desconhecido";
        const prev = equipeMap.get(name) ?? { minutes: 0, count: 0, billableMinutes: 0 };
        prev.minutes += e.durationMinutes;
        prev.count += 1;
        if (e.isBillable) prev.billableMinutes += e.durationMinutes;
        equipeMap.set(name, prev);
    }
    const equipe = Array.from(equipeMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.minutes - a.minutes);

    // ── Task handlers ──

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) {
            toast("Informe o titulo da tarefa.", "warning");
            return;
        }
        const result = await createTask({
            caseId: params.id,
            title: newTaskTitle.trim(),
            priority: UI_TO_DB_PRIORITY[newTaskPriority] as "low" | "medium" | "high" | "urgent",
        });
        if (result.success) {
            setNewTaskTitle("");
            setNewTaskPriority("Media");
            setShowNewTask(false);
            toast("Tarefa adicionada com sucesso.");
            loadTasks();
        } else {
            toast(result.error ?? "Erro ao criar tarefa", "warning");
        }
    };

    const handleMoveTask = async (taskId: string, newStatus: string) => {
        setGuardError(null);
        const result = await updateTaskStatus(taskId, newStatus);
        if (result.success) {
            loadTasks();
        } else {
            setGuardError(result.error ?? "Erro ao mover tarefa");
            toast(result.error ?? "Erro ao mover tarefa", "warning");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const result = await deleteTask(taskId);
        if (result.success) {
            loadTasks();
            toast("Tarefa excluida.");
        } else {
            toast(result.error ?? "Erro ao excluir tarefa", "warning");
        }
    };

    // ── Time entry handlers ──

    const handleSubmitEntry = async (id: string) => {
        const result = await submitTimeEntry(id);
        if (result.success) {
            toast("Apontamento submetido para aprovacao.");
            loadTimeEntries();
            loadCap();
        } else {
            toast(result.error ?? "Erro ao submeter", "warning");
        }
    };

    const handleRetractEntry = async (id: string) => {
        const result = await retractTimeEntry(id);
        if (result.success) {
            toast("Apontamento retratado.");
            loadTimeEntries();
        } else {
            toast(result.error ?? "Erro ao retratar", "warning");
        }
    };

    const handleDeleteEntry = async (id: string) => {
        const result = await deleteTimeEntry(id);
        if (result.success) {
            toast("Apontamento excluido.");
            loadTimeEntries();
            loadCap();
        } else {
            toast(result.error ?? "Erro ao excluir", "warning");
        }
    };

    // ── Drive handlers ──

    const handleCreateDriveFolder = async () => {
        setDriveCreating(true);
        const result = await createOrGetCaseFolder(params.id);
        if (result.success) {
            toast("Pasta criada no Google Drive.");
            loadDrive();
        } else {
            toast(result.error ?? "Erro ao criar pasta", "warning");
        }
        setDriveCreating(false);
    };

    // ── Task Card ──

    const TaskCard = ({ task, actions }: { task: TaskItem; actions?: React.ReactNode }) => {
        const priority = DB_TO_UI_PRIORITY[task.priority] ?? "Media";
        return (
            <div className="cursor-pointer rounded-lg border border-pf-grey/10 bg-white p-4 hover:border-pf-blue/40 group">
                <div className="flex items-start justify-between">
                    <p className={`font-sans text-sm font-semibold text-pf-black mb-2 ${task.status === "done" ? "line-through opacity-70" : ""}`}>{task.title}</p>
                    {actions}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-pf-grey">
                    <StatusBadge status={priority} />
                    <div className="flex items-center gap-2">
                        {task.dueDate && (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {task.dueDate.slice(5).split("-").reverse().join("/")}</span>
                        )}
                        {task.assigneeInitials && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pf-black text-white text-[10px] ring-2 ring-white">{task.assigneeInitials}</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ── Loading state ──

    if (caseLoading) {
        return (
            <PageShell>
                <Link href="/casos" className="inline-flex items-center gap-2 mb-4 text-xs font-bold text-pf-grey hover:text-pf-blue uppercase tracking-widest transition-colors">
                    <ArrowLeft className="h-3 w-3" />
                    Voltar para Casos
                </Link>
                <div className="flex items-center justify-center py-20">
                    <div className="w-5 h-5 border-2 border-pf-blue border-t-transparent rounded-full animate-spin" />
                </div>
            </PageShell>
        );
    }

    if (!caseData) {
        return (
            <PageShell>
                <Link href="/casos" className="inline-flex items-center gap-2 mb-4 text-xs font-bold text-pf-grey hover:text-pf-blue uppercase tracking-widest transition-colors">
                    <ArrowLeft className="h-3 w-3" />
                    Voltar para Casos
                </Link>
                <div className="text-center py-20 text-sm text-pf-grey">Caso nao encontrado.</div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div>
                <Link href="/casos" className="inline-flex items-center gap-2 mb-4 text-xs font-bold text-pf-grey hover:text-pf-blue uppercase tracking-widest transition-colors">
                    <ArrowLeft className="h-3 w-3" />
                    Voltar para Casos
                </Link>
                <PageHeader
                    title={caseData.title}
                    subtitle={`Cliente: ${caseData.client} | Processo Interno: ${caseData.number}`}
                    actions={
                        <StatusBadge status={caseData.status} />
                    }
                />
            </div>

            <div className="flex space-x-1 border-b border-pf-grey/10 overflow-x-auto pb-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-sans text-sm font-semibold transition-all border-b-2 ${activeTab === tab.id
                                ? "border-pf-blue text-pf-blue"
                                : "border-transparent text-pf-grey hover:border-pf-grey/30 hover:text-pf-black"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-6">

                {/* ══════════ VISAO GERAL ══════════ */}
                {activeTab === "visao_geral" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Cap Consumption Widget */}
                        {capStatus && !capStatus.isUncapped && (
                            <div className="rounded-lg border border-pf-grey/10 bg-white p-5">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-pf-grey/50 mb-3">Cap de Horas — {capStatus.period}</h3>
                                <div className="flex items-end gap-4 mb-3">
                                    <p className={`font-sans text-2xl font-bold ${capTextColor(capStatus.threshold)}`}>
                                        {Math.round(capStatus.percentage)}%
                                    </p>
                                    <p className="text-sm text-pf-grey/60 mb-0.5">
                                        {Math.round(capStatus.usedMinutes / 60)}h / {Math.round(capStatus.capMinutes / 60)}h
                                    </p>
                                    {capStatus.rolloverMinutes > 0 && (
                                        <p className="text-[10px] text-pf-grey/40 mb-1">
                                            (inclui {Math.round(capStatus.rolloverMinutes / 60)}h rollover)
                                        </p>
                                    )}
                                </div>
                                <div className="w-full h-2 bg-pf-grey/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${capColor(capStatus.threshold)}`}
                                        style={{ width: `${Math.min(capStatus.percentage, 100)}%` }}
                                    />
                                </div>
                                {capStatus.threshold !== "ok" && (
                                    <p className={`text-[10px] font-semibold mt-2 ${capTextColor(capStatus.threshold)}`}>
                                        {capStatus.threshold === "warning" && "Atencao: Cap acima de 80%"}
                                        {capStatus.threshold === "soft_block" && "Cap atingido — novos apontamentos exigem justificativa"}
                                        {capStatus.threshold === "hard_block" && "Cap excedido (>110%) — justificativa obrigatoria"}
                                    </p>
                                )}
                            </div>
                        )}
                        {capStatus?.isUncapped && (
                            <div className="rounded-lg border border-pf-grey/10 bg-white p-5">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-pf-grey/50 mb-2">Cap de Horas</h3>
                                <p className="text-sm text-pf-grey/60">Sem cap definido para este caso.</p>
                            </div>
                        )}

                        {/* Summary KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "A Fazer", count: todoTasks.length, color: "text-pf-grey" },
                                { label: "Em Andamento", count: inProgressTasks.length, color: "text-pf-blue" },
                                { label: "Concluido", count: doneTasks.length, color: "text-emerald-600" },
                                { label: "Horas Apontadas", count: formatDuration(totalMinutes), color: "text-pf-blue" },
                            ].map((kpi) => (
                                <div key={kpi.label} className="bg-white rounded-xl p-4 border border-pf-grey/10">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-pf-grey/50">{kpi.label}</span>
                                    <p className={`font-sans text-2xl font-bold ${kpi.color} mt-1`}>{kpi.count}</p>
                                </div>
                            ))}
                        </div>

                        {pendingApproval > 0 && (
                            <div className="flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 px-4 py-2.5">
                                <AlertTriangle size={14} className="text-orange-500 shrink-0" />
                                <p className="text-xs font-semibold text-orange-700">
                                    {pendingApproval} apontamento{pendingApproval > 1 ? "s" : ""} pendente{pendingApproval > 1 ? "s" : ""} de aprovacao
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════ KANBAN TAREFAS ══════════ */}
                {activeTab === "tarefas" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {guardError && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                                <AlertTriangle size={14} className="text-red-600 shrink-0" />
                                <p className="text-xs font-semibold text-red-700">{guardError}</p>
                                <button onClick={() => setGuardError(null)} className="ml-auto"><X size={12} className="text-red-400" /></button>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowNewTask((v) => !v)}
                                className="flex items-center justify-center gap-2 rounded border border-pf-grey/30 bg-white px-3 py-1.5 text-xs font-bold text-pf-grey hover:border-pf-blue hover:text-pf-blue transition-colors shadow-sm"
                            >
                                {showNewTask ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                {showNewTask ? "Cancelar" : "Nova Tarefa"}
                            </button>
                        </div>

                        {showNewTask && (
                            <div className="flex items-end gap-3 rounded-lg border border-pf-blue/30 bg-white p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Titulo</label>
                                    <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="Descreva a tarefa..."
                                        className="w-full border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded"
                                        onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(); }}
                                    />
                                </div>
                                <div className="w-36 space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Prioridade</label>
                                    <select
                                        value={newTaskPriority}
                                        onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                                        className="w-full border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded"
                                    >
                                        <option value="Alta">Alta</option>
                                        <option value="Media">Media</option>
                                        <option value="Baixa">Baixa</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddTask}
                                    className="rounded bg-pf-blue px-5 py-3 text-sm font-bold text-white hover:bg-pf-black transition-colors"
                                >
                                    Adicionar
                                </button>
                            </div>
                        )}

                        {tasksLoading && (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-5 h-5 border-2 border-pf-blue border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        {!tasksLoading && (
                            <div className="flex h-[calc(100vh-20rem)] w-full gap-6 overflow-x-auto pb-4">
                                {/* TODO */}
                                <div className="flex min-w-[320px] max-w-[320px] flex-col rounded-lg bg-gray-50/50 border border-pf-grey/20 p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-pf-black">A Fazer <span className="text-pf-grey ml-1 text-xs font-normal">{todoTasks.length}</span></h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {todoTasks.map((task) => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                actions={
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleMoveTask(task.id, "in_progress")} title="Mover para Em Andamento">
                                                            <ChevronRight size={14} className="text-pf-blue" />
                                                        </button>
                                                        <button onClick={() => handleDeleteTask(task.id)} title="Excluir">
                                                            <X size={12} className="text-red-400 hover:text-red-600" />
                                                        </button>
                                                    </div>
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* IN PROGRESS */}
                                <div className="flex min-w-[320px] max-w-[320px] flex-col rounded-lg bg-blue-50/50 border border-pf-blue/20 p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-pf-blue">Em Andamento <span className="text-pf-blue/70 ml-1 text-xs font-normal">{inProgressTasks.length}</span></h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {inProgressTasks.map((task) => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                actions={
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleMoveTask(task.id, "done")} title="Concluir">
                                                            <CheckSquare size={14} className="text-emerald-600" />
                                                        </button>
                                                    </div>
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* DONE */}
                                <div className="flex min-w-[320px] max-w-[320px] flex-col rounded-lg bg-green-50/50 border border-green-200/50 p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-green-800">Concluido <span className="text-green-700/70 ml-1 text-xs font-normal">{doneTasks.length}</span></h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {doneTasks.map((task) => (
                                            <TaskCard key={task.id} task={task} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════ HORAS ══════════ */}
                {activeTab === "horas" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Cap status header */}
                        {capStatus && !capStatus.isUncapped && (
                            <div className={`flex items-center gap-3 rounded-lg px-4 py-2.5 ${
                                capStatus.threshold === "ok" ? "bg-emerald-50 border border-emerald-200" :
                                capStatus.threshold === "warning" ? "bg-amber-50 border border-amber-200" :
                                "bg-red-50 border border-red-200"
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${capColor(capStatus.threshold)}`} />
                                <p className="text-xs font-semibold text-pf-black/70">
                                    Cap: {Math.round(capStatus.usedMinutes / 60)}h / {Math.round(capStatus.capMinutes / 60)}h ({Math.round(capStatus.percentage)}%)
                                </p>
                                {capStatus.remainingMinutes > 0 && (
                                    <p className="text-[10px] text-pf-grey/50">
                                        ({Math.round(capStatus.remainingMinutes / 60)}h restantes)
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="rounded-lg border border-pf-grey/10 bg-white p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-sans text-lg font-bold tracking-tight text-pf-blue">Apontamento de Horas</h3>
                                <button
                                    onClick={() => setShowTimeForm((v) => !v)}
                                    className="flex items-center gap-2 rounded border border-pf-grey/30 bg-white px-3 py-1.5 text-xs font-bold text-pf-grey hover:border-pf-blue hover:text-pf-blue transition-colors shadow-sm"
                                >
                                    {showTimeForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                    {showTimeForm ? "Cancelar" : "Lancar Horas"}
                                </button>
                            </div>

                            {showTimeForm && (
                                <div className="mb-6">
                                    <TimeEntryForm
                                        caseId={params.id}
                                        onSuccess={() => {
                                            loadTimeEntries();
                                            loadCap();
                                            setShowTimeForm(false);
                                        }}
                                        onCancel={() => setShowTimeForm(false)}
                                    />
                                </div>
                            )}

                            {timeEntriesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-5 h-5 border-2 border-pf-blue border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <TimeEntryTable
                                    entries={timeEntries}
                                    onSubmit={handleSubmitEntry}
                                    onRetract={handleRetractEntry}
                                    onDelete={handleDeleteEntry}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════ ARQUIVOS ══════════ */}
                {activeTab === "arquivos" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="rounded-lg border border-pf-grey/10 bg-white p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-sans text-lg font-bold tracking-tight text-pf-blue">Google Drive</h3>
                                {driveInfo.folderUrl && (
                                    <a
                                        href={driveInfo.folderUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 rounded border border-pf-grey/30 bg-white px-3 py-1.5 text-xs font-bold text-pf-grey hover:border-pf-blue hover:text-pf-blue transition-colors shadow-sm"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Abrir no Drive
                                    </a>
                                )}
                            </div>

                            {driveLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-5 h-5 border-2 border-pf-blue border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : !driveInfo.folderId ? (
                                <div className="text-center py-12">
                                    <FolderOpen className="h-10 w-10 text-pf-grey/30 mx-auto mb-3" />
                                    <p className="text-sm text-pf-grey/50 mb-4">
                                        Nenhuma pasta do Drive vinculada a este caso.
                                    </p>
                                    <button
                                        onClick={handleCreateDriveFolder}
                                        disabled={driveCreating}
                                        className="inline-flex items-center gap-2 rounded bg-pf-blue px-4 py-2 text-sm font-bold text-white hover:bg-pf-black transition-colors disabled:opacity-50"
                                    >
                                        {driveCreating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <FolderOpen className="h-4 w-4" />
                                        )}
                                        Criar Pasta no Drive
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {driveFiles.length === 0 ? (
                                        <p className="text-sm text-pf-grey/50 py-8 text-center">
                                            Pasta criada — nenhum arquivo encontrado.
                                        </p>
                                    ) : (
                                        <table className="w-full text-left font-sans text-sm whitespace-nowrap">
                                            <thead>
                                                <tr className="border-b border-pf-grey/10 text-pf-grey text-[10px] font-semibold uppercase tracking-wider">
                                                    <th className="px-4 py-2.5">Arquivo</th>
                                                    <th className="px-4 py-2.5">Tipo</th>
                                                    <th className="px-4 py-2.5 text-right">Tamanho</th>
                                                    <th className="px-4 py-2.5 text-right">Modificado</th>
                                                    <th className="px-4 py-2.5 text-right">Link</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-pf-grey/10">
                                                {driveFiles.map((file) => (
                                                    <tr key={file.id} className="hover:bg-white transition-colors">
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <FileIcon className="h-4 w-4 text-pf-grey/40 shrink-0" />
                                                                <span className="text-xs font-medium text-pf-black truncate max-w-[250px]">{file.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-pf-grey">
                                                                {file.mimeType.split("/").pop()?.split(".").pop() ?? file.mimeType}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-mono text-xs text-pf-grey">
                                                            {file.size ? `${Math.round(file.size / 1024)} KB` : "—"}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-xs text-pf-grey">
                                                            {new Date(file.modifiedTime).toLocaleDateString("pt-BR")}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right">
                                                            <a
                                                                href={file.webViewLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs font-semibold text-pf-blue hover:underline"
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                                Abrir
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════ REUNIOES ══════════ */}
                {activeTab === "reunioes" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="rounded-lg border border-pf-grey/10 bg-white p-6">
                            <h3 className="font-sans text-lg font-bold tracking-tight text-pf-blue mb-4">Reunioes do Caso</h3>

                            {meetingsLoading ? (
                                <div className="flex items-center justify-center py-12 text-pf-grey">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    <span className="text-xs">Carregando reunioes...</span>
                                </div>
                            ) : caseMeetings.length === 0 ? (
                                <p className="text-sm text-pf-grey/50 py-8 text-center">
                                    Nenhuma reuniao registrada para este caso.
                                </p>
                            ) : (
                                <div className="space-y-0 divide-y divide-pf-grey/10">
                                    {caseMeetings.map((mtg) => (
                                        <div key={mtg.id} className="py-3 px-2 hover:bg-background transition-colors rounded">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pf-grey/10">
                                                        <Mic className="h-3.5 w-3.5 text-pf-grey" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-pf-black">{mtg.title}</p>
                                                        <p className="text-[10px] text-pf-grey/50">
                                                            {mtg.date}{mtg.participants.length > 0 && ` · ${mtg.participants.join(", ")}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {mtg.hasSummary && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                                            Resumido
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => handleSummarizeMeeting(mtg.id)}
                                                        disabled={summarizingId === mtg.id}
                                                        className="flex items-center gap-1.5 rounded-md border border-pf-blue/20 bg-pf-blue/5 px-3 py-1.5 text-xs font-bold text-pf-blue transition-colors hover:bg-pf-blue/10 disabled:opacity-50"
                                                    >
                                                        {summarizingId === mtg.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Sparkles className="h-3.5 w-3.5" />
                                                        )}
                                                        {mtg.hasSummary ? "Resumir Novamente" : "Resumir Reuniao"}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Show summary inline if it's the one just summarized */}
                                            {summaryMeetingId === mtg.id && summaryResult && (
                                                <div className="mt-3 ml-11 space-y-3 border-l-2 border-pf-blue/20 pl-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-pf-grey mb-1">Resumo</p>
                                                        <p className="text-xs text-pf-black leading-relaxed">{summaryResult.summary}</p>
                                                    </div>
                                                    {summaryResult.keyPoints.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-pf-grey mb-1">Pontos Chave</p>
                                                            <ul className="space-y-0.5">
                                                                {summaryResult.keyPoints.map((kp, i) => (
                                                                    <li key={i} className="text-xs text-pf-black flex gap-1.5">
                                                                        <span className="text-pf-blue font-bold">·</span> {kp}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {summaryResult.actionItems.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-pf-grey mb-1">Acoes</p>
                                                            <ul className="space-y-0.5">
                                                                {summaryResult.actionItems.map((ai, i) => (
                                                                    <li key={i} className="text-xs text-pf-black flex gap-1.5">
                                                                        <span className="text-amber-600 font-bold">→</span>
                                                                        {ai.description}
                                                                        {ai.assignee && <span className="text-pf-grey ml-1">({ai.assignee})</span>}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {summaryResult.nextSteps.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-pf-grey mb-1">Proximos Passos</p>
                                                            <ul className="space-y-0.5">
                                                                {summaryResult.nextSteps.map((ns, i) => (
                                                                    <li key={i} className="text-xs text-pf-black flex gap-1.5">
                                                                        <span className="text-green-600 font-bold">→</span> {ns}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Show existing summary if it's NOT the one just summarized */}
                                            {mtg.hasSummary && summaryMeetingId !== mtg.id && mtg.summary && (
                                                <div className="mt-2 ml-11">
                                                    <p className="text-xs text-pf-grey leading-relaxed">{mtg.summary}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════ EQUIPE ══════════ */}
                {activeTab === "equipe" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="rounded-lg border border-pf-grey/10 bg-white p-6">
                            <h3 className="font-sans text-lg font-bold tracking-tight text-pf-blue mb-4">Equipe do Caso</h3>

                            {equipe.length === 0 ? (
                                <p className="text-sm text-pf-grey/50 py-8 text-center">
                                    Nenhum profissional com horas apontadas neste caso.
                                </p>
                            ) : (
                                <div className="space-y-0 divide-y divide-pf-grey/10">
                                    {equipe.map((member) => {
                                        const initials = member.name
                                            .split(" ")
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .map((w) => w[0])
                                            .join("")
                                            .toUpperCase();
                                        const billablePct = member.minutes > 0 ? Math.round((member.billableMinutes / member.minutes) * 100) : 0;

                                        return (
                                            <div key={member.name} className="flex items-center justify-between py-3 hover:bg-background transition-colors px-2 rounded">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pf-blue text-white text-[10px] font-bold">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-pf-black">{member.name}</p>
                                                        <p className="text-[10px] text-pf-grey/50">
                                                            {member.count} lancamento{member.count > 1 ? "s" : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="font-mono text-sm font-bold text-pf-blue">{formatDuration(member.minutes)}</p>
                                                        <p className="text-[10px] text-pf-grey/50">{billablePct}% faturavel</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </PageShell>
    );
}
