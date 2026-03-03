"use client"

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { Clock, CheckSquare, FileText, User, ArrowLeft, Plus, X, ChevronRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
    getTasksForCase,
    createTask,
    updateTaskStatus,
    deleteTask,
    getCapStatusAction,
} from "@/lib/actions";
import type { TaskItem } from "@/lib/actions/tasks";
import type { CapStatus } from "@/lib/billing/cap";

// ─── Priority mapping ───────────────────────────────────────────────────────

type Priority = "Alta" | "Media" | "Baixa";
const PRIORITY_STYLES: Record<Priority, string> = {
    Alta: "bg-red-100 text-red-700",
    Media: "bg-orange-100 text-orange-700",
    Baixa: "bg-blue-100 text-blue-700",
};

const DB_TO_UI_PRIORITY: Record<string, Priority> = {
    urgent: "Alta", high: "Alta", medium: "Media", low: "Baixa",
};
const UI_TO_DB_PRIORITY: Record<Priority, string> = {
    Alta: "high", Media: "medium", Baixa: "low",
};

// ─── Local time entry type (kept for inline form) ───────────────────────────

type TimeEntry = {
    id: string;
    date: string;
    professional: string;
    description: string;
    time: string;
};

const INITIAL_TIME_ENTRIES: TimeEntry[] = [
    { id: "te-1", date: "25/02/2026", professional: "Carlos Oliveira", description: "Setup do projeto e coleta de balancetes mensais.", time: "02:30" },
];

function parseTimeToMinutes(t: string): number {
    const parts = t.split(":");
    if (parts.length !== 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
}

function formatMinutes(total: number): string {
    const h = Math.floor(total / 60).toString().padStart(2, "0");
    const m = (total % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

// ─── Cap threshold colors ───────────────────────────────────────────────────

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

    // Tasks state (server-persisted)
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [showNewTask, setShowNewTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<Priority>("Media");
    const [guardError, setGuardError] = useState<string | null>(null);

    // Cap status
    const [capStatus, setCapStatus] = useState<CapStatus | null>(null);

    // Time entries state (local for now)
    const [localTimeEntries, setLocalTimeEntries] = useState<TimeEntry[]>(INITIAL_TIME_ENTRIES);
    const profRef = useRef<HTMLSelectElement>(null);
    const dateRef = useRef<HTMLInputElement>(null);
    const timeRef = useRef<HTMLInputElement>(null);
    const descRef = useRef<HTMLInputElement>(null);

    const caseData = {
        number: "CA-2026-001",
        client: "Grupo Sequoia",
        title: "Assessoria Contabil e Fiscal Continua",
        status: "Ativo",
    };

    // ── Load tasks from DB ──
    const loadTasks = useCallback(async () => {
        try {
            const data = await getTasksForCase(params.id);
            setTasks(data);
        } finally {
            setTasksLoading(false);
        }
    }, [params.id]);

    // ── Load cap status ──
    const loadCap = useCallback(async () => {
        const today = new Date().toISOString().split("T")[0];
        const cap = await getCapStatusAction(params.id, today);
        setCapStatus(cap);
    }, [params.id]);

    useEffect(() => {
        loadTasks();
        loadCap();
    }, [loadTasks, loadCap]);

    const TABS = [
        { id: "visao_geral", label: "Visao Geral", icon: <FileText className="h-4 w-4" /> },
        { id: "tarefas", label: "Tarefas (Kanban)", icon: <CheckSquare className="h-4 w-4" /> },
        { id: "horas", label: "Planilha de Horas", icon: <Clock className="h-4 w-4" /> },
        { id: "equipe", label: "Equipe do Caso", icon: <User className="h-4 w-4" /> },
    ];

    // Derived counts
    const todoTasks = tasks.filter((t) => t.status === "todo");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
    const doneTasks = tasks.filter((t) => t.status === "done");

    const totalMinutes = localTimeEntries.reduce((acc, e) => acc + parseTimeToMinutes(e.time), 0);

    // ── Handlers ──

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

    const handleLancarHoras = () => {
        const prof = profRef.current?.value || "";
        const date = dateRef.current?.value || "";
        const time = timeRef.current?.value || "";
        const desc = descRef.current?.value || "";

        if (!date || !time || !desc.trim()) {
            toast("Preencha todos os campos obrigatorios.", "warning");
            return;
        }

        const timeRegex = /^\d{1,2}:\d{2}$/;
        if (!timeRegex.test(time)) {
            toast("Formato de tempo invalido. Use hh:mm.", "warning");
            return;
        }

        const [y, m, d] = date.split("-");
        const formattedDate = `${d}/${m}/${y}`;

        const entry: TimeEntry = {
            id: `te-${Date.now()}`,
            date: formattedDate,
            professional: prof,
            description: desc.trim(),
            time,
        };
        setLocalTimeEntries((prev) => [...prev, entry]);

        if (dateRef.current) dateRef.current.value = "";
        if (timeRef.current) timeRef.current.value = "";
        if (descRef.current) descRef.current.value = "";

        toast("Horas lancadas com sucesso.");
    };

    // ── Task Card Component ──
    const TaskCard = ({ task, actions }: { task: TaskItem; actions?: React.ReactNode }) => {
        const priority = DB_TO_UI_PRIORITY[task.priority] ?? "Media";
        return (
            <div className="cursor-pointer rounded-lg border border-pf-grey/10 bg-white p-4 shadow-sm hover:border-pf-blue/40 group">
                <div className="flex items-start justify-between">
                    <p className={`font-sans text-sm font-semibold text-pf-black mb-2 ${task.status === "done" ? "line-through opacity-70" : ""}`}>{task.title}</p>
                    {actions}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-pf-grey">
                    <div className={`rounded px-2 py-0.5 font-bold ${PRIORITY_STYLES[priority]}`}>{priority}</div>
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

    return (
        <div className="space-y-6">
            <div>
                <Link href="/casos" className="inline-flex items-center gap-2 mb-4 text-xs font-bold text-pf-grey hover:text-pf-blue uppercase tracking-widest transition-colors">
                    <ArrowLeft className="h-3 w-3" />
                    Voltar para Casos
                </Link>
                <PageHeader
                    title={caseData.title}
                    subtitle={`Cliente: ${caseData.client} | Processo Interno: ${caseData.number}`}
                    actions={
                        <span className="inline-flex items-center rounded-sm bg-green-100 px-3 py-1 font-sans text-xs font-bold uppercase tracking-widest text-green-700">
                            {caseData.status}
                        </span>
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

                {/* VISAO GERAL */}
                {activeTab === "visao_geral" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Cap Consumption Widget */}
                        {capStatus && !capStatus.isUncapped && (
                            <div className="rounded-lg border border-pf-grey/10 bg-white p-5 shadow-sm">
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
                                {/* Progress bar */}
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
                            <div className="rounded-lg border border-pf-grey/10 bg-white p-5 shadow-sm">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-pf-grey/50 mb-2">Cap de Horas</h3>
                                <p className="text-sm text-pf-grey/60">Sem cap definido para este caso.</p>
                            </div>
                        )}

                        {/* Task summary */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "A Fazer", count: todoTasks.length, color: "text-pf-grey" },
                                { label: "Em Andamento", count: inProgressTasks.length, color: "text-pf-blue" },
                                { label: "Concluido", count: doneTasks.length, color: "text-emerald-600" },
                            ].map((kpi) => (
                                <div key={kpi.label} className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-pf-grey/50">{kpi.label}</span>
                                    <p className={`font-sans text-2xl font-bold ${kpi.color} mt-1`}>{kpi.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* KANBAN TAREFAS */}
                {activeTab === "tarefas" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* Guard error banner */}
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

                        {/* Inline new task form */}
                        {showNewTask && (
                            <div className="flex items-end gap-3 rounded-lg border border-pf-blue/30 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
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

                        {/* Loading */}
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

                {/* TIME ENTRIES (HORAS) */}
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

                        <div className="rounded-lg border border-pf-grey/10 bg-white p-6 shadow-sm">
                            <h3 className="font-sans text-lg font-bold tracking-tight text-pf-blue mb-6">Lancamento de Horas</h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-pf-grey/5 rounded border border-pf-grey/10 items-end">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Profissional</label>
                                    <select ref={profRef} className="w-full rounded-md border border-pf-grey/30 p-2 text-sm focus:border-pf-blue outline-none">
                                        <option>Carlos Oliveira</option>
                                        <option>Jose Rafael Feiteiro</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Data</label>
                                    <input ref={dateRef} type="date" className="w-full rounded-md border border-pf-grey/30 p-2 text-sm focus:border-pf-blue outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Tempo (hh:mm)</label>
                                    <input ref={timeRef} type="text" placeholder="ex: 01:30" className="w-full rounded-md border border-pf-grey/30 p-2 text-sm focus:border-pf-blue outline-none" />
                                </div>
                                <div>
                                    <button
                                        onClick={handleLancarHoras}
                                        className="w-full rounded bg-pf-blue p-2 font-bold text-white hover:bg-pf-black transition-colors"
                                    >
                                        Lancar
                                    </button>
                                </div>
                                <div className="space-y-2 md:col-span-4 mt-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Descricao da Atividade</label>
                                    <input ref={descRef} type="text" placeholder="Qual tarefa foi executada?" className="w-full rounded-md border border-pf-grey/30 p-2 text-sm focus:border-pf-blue outline-none" />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left font-sans text-sm">
                                    <thead>
                                        <tr className="border-b border-pf-grey/10 text-pf-grey text-xs uppercase tracking-wider">
                                            <th className="pb-2 font-semibold">Data</th>
                                            <th className="pb-2 font-semibold">Profissional</th>
                                            <th className="pb-2 font-semibold">Descricao</th>
                                            <th className="pb-2 font-semibold text-right">Tempo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-pf-grey/10">
                                        {localTimeEntries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-pf-blue/5">
                                                <td className="py-3">{entry.date}</td>
                                                <td className="py-3 font-semibold text-pf-black">{entry.professional}</td>
                                                <td className="py-3 text-pf-grey">{entry.description}</td>
                                                <td className="py-3 text-right font-mono font-bold text-pf-blue">{entry.time}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-pf-grey/5">
                                            <td colSpan={3} className="py-3 text-right font-bold text-pf-black">TOTAL APONTADO:</td>
                                            <td className="py-3 text-right font-mono font-bold text-pf-blue">{formatMinutes(totalMinutes)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
