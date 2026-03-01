"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import {
    Search, Play, Pause, Square, Plus, Clock,
    CalendarDays, Briefcase, Receipt
} from "lucide-react";

type ActivityType = "reuniao" | "pesquisa" | "elaboracao" | "revisao" | "audiencia" | "administrativo";
type TimerStatus = "idle" | "running" | "paused";

type TimeEntry = {
    id: string;
    caseNumber: string;
    caseTitle: string;
    clientName: string;
    activityType: ActivityType;
    description: string;
    durationMinutes: number;
    date: string;
    startTime: string;
    isBillable: boolean;
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
    reuniao: "Reunião",
    pesquisa: "Pesquisa Jurídica",
    elaboracao: "Elaboração",
    revisao: "Revisão / Análise",
    audiencia: "Audiência",
    administrativo: "Administrativo",
};

const CASES = [
    { id: "c-001", number: "CA-2026-001", title: "Assessoria Contábil e Fiscal", client: "Grupo Sequoia" },
    { id: "c-002", number: "CA-2026-002", title: "Planejamento Tributário 2026", client: "TechCorp BR" },
    { id: "c-003", number: "CA-2025-089", title: "Revisão de Passivo Trabalhista", client: "Logística ABC" },
];

const ENTRIES: TimeEntry[] = [
    { id: "1", caseNumber: "CA-2026-001", caseTitle: "Assessoria Contábil e Fiscal", clientName: "Grupo Sequoia", activityType: "revisao", description: "Revisão dos balancetes mensais e conferência de IRPJ", durationMinutes: 90, date: "2026-03-01", startTime: "09:00", isBillable: true },
    { id: "2", caseNumber: "CA-2026-001", caseTitle: "Assessoria Contábil e Fiscal", clientName: "Grupo Sequoia", activityType: "reuniao", description: "Call mensal com cliente — checkpoint de fechamento", durationMinutes: 45, date: "2026-03-01", startTime: "11:00", isBillable: true },
    { id: "3", caseNumber: "CA-2026-002", caseTitle: "Planejamento Tributário 2026", clientName: "TechCorp BR", activityType: "pesquisa", description: "Pesquisa jurisprudência STJ sobre créditos PIS/COFINS", durationMinutes: 120, date: "2026-03-01", startTime: "14:00", isBillable: true },
    { id: "4", caseNumber: "CA-2026-001", caseTitle: "Assessoria Contábil e Fiscal", clientName: "Grupo Sequoia", activityType: "administrativo", description: "Organização de pastas no Drive e atualização de status", durationMinutes: 30, date: "2026-03-01", startTime: "17:00", isBillable: false },
    { id: "5", caseNumber: "CA-2026-002", caseTitle: "Planejamento Tributário 2026", clientName: "TechCorp BR", activityType: "elaboracao", description: "Elaboração do parecer sobre reorganização societária", durationMinutes: 180, date: "2026-02-28", startTime: "09:00", isBillable: true },
    { id: "6", caseNumber: "CA-2025-089", caseTitle: "Revisão de Passivo Trabalhista", clientName: "Logística ABC", activityType: "audiencia", description: "Participação em audiência de conciliação — TRT 2ª Região", durationMinutes: 240, date: "2026-02-27", startTime: "13:00", isBillable: true },
];

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
    // Timer state
    const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
    const [timerCaseId, setTimerCaseId] = useState(CASES[0].id);
    const [timerDesc, setTimerDesc] = useState("");
    const [timerBillable, setTimerBillable] = useState(true);
    const [accumulatedMs, setAccumulatedMs] = useState(0);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [displayMs, setDisplayMs] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // List state
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["hora", "atividade", "descricao", "tipo", "duracao"]);
    const [density, setDensity] = useState<Density>("compact");

    const TABLE_COLUMNS: ColumnDef[] = [
        { key: "hora", label: "Hora" },
        { key: "atividade", label: "Atividade" },
        { key: "descricao", label: "Descrição" },
        { key: "tipo", label: "Tipo" },
        { key: "duracao", label: "Duração" },
    ];

    const FILTER_DEFS: FilterDef[] = [
        { key: "activityType", label: "Tipo de Atividade", options: Object.entries(ACTIVITY_LABELS).map(([value, label]) => ({ value, label })) },
    ];

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setTypeFilter(filters.activityType || []);
    };

    const densityClasses = getDensityClasses(density);

    // Timer interval
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
        window.alert("Lançamento de horas salvo com sucesso.");
    };

    // Filter today's entries
    const todayEntries = ENTRIES.filter(e =>
        e.date === "2026-03-01" &&
        (search === "" || e.description.toLowerCase().includes(search.toLowerCase()) || e.clientName.toLowerCase().includes(search.toLowerCase())) &&
        (typeFilter.length === 0 || typeFilter.includes(e.activityType))
    );

    const todayTotalMinutes = ENTRIES.filter(e => e.date === "2026-03-01").reduce((s, e) => s + e.durationMinutes, 0);
    const weekBillableMinutes = ENTRIES.filter(e => e.isBillable).reduce((s, e) => s + e.durationMinutes, 0);
    const monthMinutes = ENTRIES.reduce((s, e) => s + e.durationMinutes, 0);

    const selectedCase = CASES.find(c => c.id === timerCaseId);

    return (
        <div>
            <div className="sticky top-0 z-20 bg-[#F4F5F7] space-y-2 pb-3">
                <PageHeader
                    title="Apontamento de Horas"
                    subtitle="Registre e acompanhe as horas trabalhadas por caso."
                    actions={
                        <button
                            onClick={() => window.alert("Modal: Formulário de lançamento manual de horas.")}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-black px-3 py-1.5 font-sans text-xs font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Lançar Manual
                        </button>
                    }
                />

                {/* Timer Widget */}
                <div className={`bg-white border rounded p-3 flex flex-col md:flex-row items-start md:items-center gap-4 ${timerStatus === "running" ? "border-l-[3px] border-l-pf-blue border-pf-blue/20" : timerStatus === "paused" ? "border-l-[3px] border-l-orange-400 border-orange-200" : "border-pf-grey/20"}`}>
                    {/* Clock display */}
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

                    {/* Case selector + description */}
                    <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
                        <select
                            value={timerCaseId}
                            onChange={e => setTimerCaseId(e.target.value)}
                            disabled={timerStatus === "running"}
                            className="h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue disabled:opacity-50 bg-white"
                        >
                            {CASES.map(c => (
                                <option key={c.id} value={c.id}>{c.number} — {c.client}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={timerDesc}
                            onChange={e => setTimerDesc(e.target.value)}
                            placeholder="Descrição da atividade..."
                            className="flex-1 h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-pf-grey cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={timerBillable}
                                onChange={e => setTimerBillable(e.target.checked)}
                                className="accent-pf-blue"
                            />
                            Faturável
                        </label>
                        {timerStatus === "idle" && (
                            <button onClick={startTimer} className="flex h-8 w-8 items-center justify-center rounded-md bg-pf-blue text-white hover:bg-blue-700 transition-colors" aria-label="Iniciar timer">
                                <Play className="h-4 w-4" />
                            </button>
                        )}
                        {timerStatus === "running" && (
                            <>
                                <button onClick={pauseTimer} className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors" aria-label="Pausar">
                                    <Pause className="h-4 w-4" />
                                </button>
                                <button onClick={stopTimer} className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors" aria-label="Parar e salvar">
                                    <Square className="h-4 w-4" />
                                </button>
                            </>
                        )}
                        {timerStatus === "paused" && (
                            <>
                                <button onClick={resumeTimer} className="flex h-8 w-8 items-center justify-center rounded-md bg-pf-blue text-white hover:bg-blue-700 transition-colors" aria-label="Retomar">
                                    <Play className="h-4 w-4" />
                                </button>
                                <button onClick={stopTimer} className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors" aria-label="Parar e salvar">
                                    <Square className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Horas Hoje</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{formatDuration(todayTotalMinutes)}</p>
                        <p className="text-[9px] text-pf-grey mt-1">{todayEntries.length} lançamentos</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Billable (Semana)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{formatDuration(weekBillableMinutes)}</p>
                        <p className="text-[9px] text-pf-grey mt-1">82% do total</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Meta Mensal</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{Math.round((monthMinutes / 9600) * 100)}%</p>
                        <p className="text-[9px] text-pf-grey mt-1">{formatDuration(monthMinutes)} / 160:00 target</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Total do Mês</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{formatDuration(monthMinutes)}</p>
                        <p className="text-[9px] text-green-600 font-semibold mt-1">+12% vs Fevereiro</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Lançamentos do Dia</span>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                            <input
                                type="search"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar atividade..."
                                aria-label="Buscar atividade"
                                className="h-8 w-48 rounded-md border border-pf-grey/20 pl-10 pr-4 text-sm font-sans outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                            />
                        </div>
                        <FilterDropdown
                            label="Tipo"
                            options={Object.entries(ACTIVITY_LABELS).map(([value, label]) => ({ value, label }))}
                            selected={typeFilter}
                            onChange={setTypeFilter}
                        />
                    </div>
                </div>

                {/* Report Toolbar */}
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

            {/* Entries */}
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("hora") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Hora</th>}
                            {visibleColumns.includes("atividade") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Atividade</th>}
                            {visibleColumns.includes("descricao") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Descrição</th>}
                            {visibleColumns.includes("tipo") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider`}>Tipo</th>}
                            {visibleColumns.includes("duracao") && <th className={`${densityClasses.cell} ${densityClasses.text} font-semibold uppercase tracking-wider text-right`}>Duração</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {todayEntries.map(entry => (
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
                                        {entry.isBillable ? "Faturável" : "Interno"}
                                    </span>
                                </td>}
                                {visibleColumns.includes("duracao") && <td className={`${densityClasses.cell} ${densityClasses.text} text-right font-mono font-bold text-pf-blue`}>
                                    {formatDuration(entry.durationMinutes)}
                                </td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
