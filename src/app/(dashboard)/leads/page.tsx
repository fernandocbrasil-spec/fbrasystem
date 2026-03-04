"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    ChevronDown,
    ChevronUp,
    Search,
    Users,
    SlidersHorizontal,
    ArrowUpDown,
    EyeOff,
    LayoutGrid,
    MoreHorizontal,
    Plus,
    Star,
    MessageSquare,
    FileText,
    User,
    X,
    Check,
    Maximize2,
    Minimize2,
    Download,
} from "lucide-react";
import {
    getLeadsForBoard,
    createLeadFromBoard,
    updateLeadFromBoard,
} from "@/lib/actions";
import type {
    BoardLead,
    BoardLeadStatus,
    BoardLeadPriority,
    BoardLeadStage,
} from "@/lib/actions/leads";

// ─── Types ──────────────────────────────────────────────────────────────────

type LeadStatus = BoardLeadStatus;
type LeadPriority = BoardLeadPriority;
type LeadStage = BoardLeadStage;
type Lead = BoardLead;

type Group = {
    id: string;
    label: string;
    color: string;
    colorBg: string;
    collapsed: boolean;
    items: Lead[];
};

type GroupByKey = "stage" | "status" | "priority" | "responsible";
type SortKey = "name" | "value" | "deadline" | "status" | "priority" | "updatedAt";
type SortDir = "asc" | "desc";

type ColumnKey = "check" | "name" | "responsible" | "status" | "deadline" | "priority" | "notes" | "value" | "files" | "timeline" | "updated";

// ─── Config ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string; textColor: string }[] = [
    { value: "feito", label: "Feito", color: "#00C875", textColor: "#fff" },
    { value: "em_andamento", label: "Em andamento", color: "#FDAB3D", textColor: "#fff" },
    { value: "parado", label: "Parado", color: "#E2445C", textColor: "#fff" },
    { value: "nao_iniciado", label: "Nao iniciado", color: "#C4C4C4", textColor: "#fff" },
];

const PRIORITY_OPTIONS: { value: LeadPriority; label: string; color: string; textColor: string; icon?: string }[] = [
    { value: "critico", label: "Critico", color: "#333333", textColor: "#fff", icon: "⚠" },
    { value: "alta", label: "Alta", color: "#401694", textColor: "#fff" },
    { value: "media", label: "Media", color: "#5559DF", textColor: "#fff" },
    { value: "baixa", label: "Baixa", color: "#579BFC", textColor: "#fff" },
    { value: "", label: "(sem prioridade)", color: "#C4C4C4", textColor: "#fff" },
];

const STAGE_GROUPS: { stage: LeadStage; label: string; color: string; colorBg: string }[] = [
    { stage: "prospeccao", label: "Prospeccao", color: "#579BFC", colorBg: "#579BFC15" },
    { stage: "qualificacao", label: "Qualificacao", color: "#FDAB3D", colorBg: "#FDAB3D15" },
    { stage: "proposta", label: "Proposta Enviada", color: "#A25DDC", colorBg: "#A25DDC15" },
    { stage: "negociacao", label: "Negociacao", color: "#FFCB00", colorBg: "#FFCB0015" },
    { stage: "ganho", label: "Ganho", color: "#00C875", colorBg: "#00C87515" },
    { stage: "perdido", label: "Perdido", color: "#E2445C", colorBg: "#E2445C15" },
];

const RESPONSIBLE_LIST = ["Jose Rafael", "Carlos Oliveira", "Ana Souza", "Fernando Brasil"];

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: "name", label: "Lead" },
    { key: "responsible", label: "Responsavel" },
    { key: "status", label: "Status" },
    { key: "deadline", label: "Prazo" },
    { key: "priority", label: "Prioridade" },
    { key: "notes", label: "Notas" },
    { key: "value", label: "Valor" },
    { key: "files", label: "Arquivos" },
    { key: "timeline", label: "Cronograma" },
    { key: "updated", label: "Ultima atualizacao" },
];

const GROUP_BY_OPTIONS: { key: GroupByKey; label: string }[] = [
    { key: "stage", label: "Estagio" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Prioridade" },
    { key: "responsible", label: "Responsavel" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "name", label: "Lead" },
    { key: "value", label: "Valor" },
    { key: "deadline", label: "Prazo" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Prioridade" },
    { key: "updatedAt", label: "Ultima atualizacao" },
];

const GROUP_COLORS = ["#579BFC", "#FDAB3D", "#A25DDC", "#FFCB00", "#00C875", "#E2445C", "#FF642E", "#797E93", "#037F4C", "#BB3354"];

function getStatusConfig(status: LeadStatus) {
    return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[3];
}

function getPriorityConfig(priority: LeadPriority) {
    return PRIORITY_OPTIONS.find((p) => p.value === priority) ?? PRIORITY_OPTIONS[4];
}

function relativeTime(dateStr: string): string {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins} min atras`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} horas atras`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dias atras`;
}

function formatDeadline(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return `${months[d.getMonth()]} ${d.getDate()}`;
}

function formatTimeline(tl: { start: string; end: string } | null): string {
    if (!tl) return "";
    const s = new Date(tl.start);
    const e = new Date(tl.end);
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return `${months[s.getMonth()]} ${s.getDate()} - ${e.getDate()}`;
}

function parseValue(val: string): number {
    const num = parseFloat(val.replace(/[^\d,.]/g, "").replace(".", "").replace(",", "."));
    return isNaN(num) ? 0 : num;
}

// ─── Generic Toolbar Dropdown ────────────────────────────────────────────────

function ToolbarDropdown({
    open,
    children,
    width = 220,
}: {
    open: boolean;
    children: React.ReactNode;
    width?: number;
}) {
    if (!open) return null;

    return (
        <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-pf-grey/20 bg-white py-2 shadow-xl"
            style={{ width }}
        >
            {children}
        </div>
    );
}

// ─── Cell Dropdown (Status/Priority) ─────────────────────────────────────────

function CellDropdown({
    options,
    onSelect,
    onClose,
    anchorRect,
}: {
    options: { value: string; label: string; color: string; textColor: string; icon?: string }[];
    onSelect: (value: string) => void;
    onClose: () => void;
    anchorRect: DOMRect | null;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [onClose]);

    if (!anchorRect) return null;

    return (
        <div
            ref={ref}
            className="fixed z-[9999] min-w-[160px] rounded-md border border-pf-grey/20 bg-white py-1.5 shadow-lg"
            style={{ top: anchorRect.bottom + 4, left: anchorRect.left }}
        >
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => { onSelect(opt.value); onClose(); }}
                    className="flex w-full items-center gap-2 px-2 py-1 text-sm hover:bg-white transition-colors"
                >
                    <span
                        className="flex h-7 min-w-[120px] items-center justify-center rounded-[3px] text-xs font-medium"
                        style={{ backgroundColor: opt.color, color: opt.textColor }}
                    >
                        {opt.icon && <span className="mr-1">{opt.icon}</span>}
                        {opt.label}
                    </span>
                </button>
            ))}
            <div className="border-t border-pf-grey/10 mt-1 pt-1 px-2">
                <button className="flex w-full items-center gap-2 py-1.5 text-xs text-pf-grey hover:text-pf-black">
                    <span className="text-[11px]">✎</span> Editar etiquetas
                </button>
            </div>
        </div>
    );
}

// ─── Status Cell ─────────────────────────────────────────────────────────────

function StatusCell({ value, onChange }: { value: LeadStatus; onChange: (v: LeadStatus) => void }) {
    const [open, setOpen] = useState(false);
    const cellRef = useRef<HTMLDivElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const handleOpen = () => {
        if (cellRef.current) setRect(cellRef.current.getBoundingClientRect());
        setOpen(true);
    };

    const cfg = getStatusConfig(value);

    return (
        <>
            <div ref={cellRef} onClick={handleOpen} className="flex h-full cursor-pointer items-center justify-center">
                <span
                    className="inline-flex h-[26px] w-full max-w-[130px] items-center justify-center rounded-[3px] text-[13px] font-medium"
                    style={{ backgroundColor: cfg.color, color: cfg.textColor }}
                >
                    {cfg.label}
                </span>
            </div>
            {open && (
                <CellDropdown
                    options={STATUS_OPTIONS}
                    onSelect={(v) => onChange(v as LeadStatus)}
                    onClose={() => setOpen(false)}
                    anchorRect={rect}
                />
            )}
        </>
    );
}

// ─── Priority Cell ───────────────────────────────────────────────────────────

function PriorityCell({ value, onChange }: { value: LeadPriority; onChange: (v: LeadPriority) => void }) {
    const [open, setOpen] = useState(false);
    const cellRef = useRef<HTMLDivElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const handleOpen = () => {
        if (cellRef.current) setRect(cellRef.current.getBoundingClientRect());
        setOpen(true);
    };

    const cfg = getPriorityConfig(value);

    return (
        <>
            <div ref={cellRef} onClick={handleOpen} className="flex h-full cursor-pointer items-center justify-center">
                <span
                    className="inline-flex h-[26px] w-full max-w-[130px] items-center justify-center rounded-[3px] text-[13px] font-medium"
                    style={{ backgroundColor: cfg.color, color: cfg.textColor }}
                >
                    {cfg.icon && <span className="mr-1">{cfg.icon}</span>}
                    {cfg.label}
                </span>
            </div>
            {open && (
                <CellDropdown
                    options={PRIORITY_OPTIONS}
                    onSelect={(v) => onChange(v as LeadPriority)}
                    onClose={() => setOpen(false)}
                    anchorRect={rect}
                />
            )}
        </>
    );
}

// ─── Timeline Cell ───────────────────────────────────────────────────────────

function TimelineCell({ timeline, color }: { timeline: { start: string; end: string } | null; color: string }) {
    if (!timeline) return <span className="text-gray-300">—</span>;
    return (
        <span
            className="inline-flex h-[24px] items-center rounded-full px-3 text-[11px] font-medium text-white whitespace-nowrap"
            style={{ backgroundColor: color }}
        >
            {formatTimeline(timeline)}
        </span>
    );
}

// ─── Updated Cell ────────────────────────────────────────────────────────────

function UpdatedCell({ updatedAt, updatedBy }: { updatedAt: string; updatedBy: string }) {
    const [hover, setHover] = useState(false);

    return (
        <div
            className="relative flex items-center gap-2 text-[13px] text-pf-grey"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pf-grey text-[10px] font-bold text-white">
                {updatedBy.charAt(0)}
            </span>
            <span className="whitespace-nowrap">{relativeTime(updatedAt)}</span>
            {hover && (
                <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-pf-black px-3 py-2 text-xs text-white shadow-lg">
                    <p className="font-medium">Atualizado por {updatedBy}</p>
                    <p className="text-pf-grey/50">
                        em {new Date(updatedAt).toLocaleDateString("pt-BR")} as{" "}
                        {new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
    const colors = ["#579BFC", "#FDAB3D", "#00C875", "#A25DDC", "#E2445C", "#FF642E"];
    const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
    return (
        <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shrink-0"
            style={{ backgroundColor: colors[idx] }}
            title={name}
        >
            {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
        </span>
    );
}

// ─── Grouping logic ──────────────────────────────────────────────────────────

function buildGroups(leads: Lead[], groupBy: GroupByKey): Group[] {
    if (groupBy === "stage") {
        return STAGE_GROUPS.map((sg) => ({
            id: sg.stage,
            label: sg.label,
            color: sg.color,
            colorBg: sg.colorBg,
            collapsed: false,
            items: leads.filter((l) => l.stage === sg.stage),
        }));
    }

    if (groupBy === "status") {
        return STATUS_OPTIONS.map((so, i) => ({
            id: so.value,
            label: so.label,
            color: so.color,
            colorBg: so.color + "15",
            collapsed: false,
            items: leads.filter((l) => l.status === so.value),
        }));
    }

    if (groupBy === "priority") {
        return PRIORITY_OPTIONS.map((po, i) => ({
            id: po.value || "__none",
            label: po.label || "Sem prioridade",
            color: po.color,
            colorBg: po.color + "15",
            collapsed: false,
            items: leads.filter((l) => l.priority === po.value),
        }));
    }

    if (groupBy === "responsible") {
        const all = [...new Set(leads.map((l) => l.responsible).filter(Boolean))];
        const groups: Group[] = all.map((name, i) => ({
            id: name,
            label: name,
            color: GROUP_COLORS[i % GROUP_COLORS.length],
            colorBg: GROUP_COLORS[i % GROUP_COLORS.length] + "15",
            collapsed: false,
            items: leads.filter((l) => l.responsible === name),
        }));
        const unassigned = leads.filter((l) => !l.responsible);
        if (unassigned.length > 0) {
            groups.push({
                id: "__unassigned",
                label: "Sem responsavel",
                color: "#797E93",
                colorBg: "#797E9315",
                collapsed: false,
                items: unassigned,
            });
        }
        return groups;
    }

    return [];
}

// ─── Sorting logic ───────────────────────────────────────────────────────────

function sortLeads(items: Lead[], sortKey: SortKey | null, sortDir: SortDir): Lead[] {
    if (!sortKey) return items;
    const sorted = [...items].sort((a, b) => {
        let cmp = 0;
        switch (sortKey) {
            case "name": cmp = a.name.localeCompare(b.name); break;
            case "value": cmp = parseValue(a.value) - parseValue(b.value); break;
            case "deadline": cmp = (a.deadline || "").localeCompare(b.deadline || ""); break;
            case "status": cmp = a.status.localeCompare(b.status); break;
            case "priority": cmp = (a.priority || "zzz").localeCompare(b.priority || "zzz"); break;
            case "updatedAt": cmp = (a.updatedAt || "").localeCompare(b.updatedAt || ""); break;
        }
        return sortDir === "desc" ? -cmp : cmp;
    });
    return sorted;
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function LeadsMondayBoard() {
    // Core data — loaded from server action
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLeads = useCallback(async () => {
        try {
            const data = await getLeadsForBoard();
            setAllLeads(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    // Toolbar state
    const [search, setSearch] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [personFilter, setPersonFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<LeadPriority[]>([]);
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(new Set());
    const [groupBy, setGroupBy] = useState<GroupByKey>("stage");

    // Dropdown toggles
    const [personOpen, setPersonOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [hideOpen, setHideOpen] = useState(false);
    const [groupByOpen, setGroupByOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    // New lead form
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState("");
    const newNameRef = useRef<HTMLInputElement>(null);

    // Inline add per group
    const [addingToGroup, setAddingToGroup] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState("");
    const addInputRef = useRef<HTMLInputElement>(null);

    // Group collapsed state
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // Selection & interaction state
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [starredLeads, setStarredLeads] = useState<Set<string>>(new Set());
    const [editingNotesId, setEditingNotesId] = useState<string | null>(null);

    // New lead form extra fields
    const [newResponsible, setNewResponsible] = useState("");
    const [newStage, setNewStage] = useState<LeadStage>("prospeccao");
    const [newFormStatus, setNewFormStatus] = useState<LeadStatus>("nao_iniciado");
    const [newPriority, setNewPriority] = useState<LeadPriority>("");
    const [newDeadline, setNewDeadline] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newNotes, setNewNotes] = useState("");

    // Toolbar ref for outside-click detection
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (addingToGroup && addInputRef.current) addInputRef.current.focus();
    }, [addingToGroup]);

    useEffect(() => {
        if (showNewForm && newNameRef.current) newNameRef.current.focus();
    }, [showNewForm]);

    // Close all dropdowns
    const closeAllDropdowns = useCallback(() => {
        setPersonOpen(false);
        setFilterOpen(false);
        setSortOpen(false);
        setHideOpen(false);
        setGroupByOpen(false);
        setMoreOpen(false);
    }, []);

    // Page-level: close dropdowns on outside click or Escape
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
                closeAllDropdowns();
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeAllDropdowns();
        };
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("keydown", handleKey);
        };
    }, [closeAllDropdowns]);

    // ─── Filtering ──────────────────────────────────────────────────────

    const filteredLeads = allLeads.filter((l) => {
        if (search && !l.name.toLowerCase().includes(search.toLowerCase()) &&
            !l.responsible.toLowerCase().includes(search.toLowerCase()) &&
            !l.notes.toLowerCase().includes(search.toLowerCase())) return false;
        if (personFilter.length > 0 && !personFilter.includes(l.responsible)) return false;
        if (statusFilter.length > 0 && !statusFilter.includes(l.status)) return false;
        if (priorityFilter.length > 0 && !priorityFilter.includes(l.priority)) return false;
        return true;
    });

    // ─── Sorting ────────────────────────────────────────────────────────

    const sortedLeads = sortLeads(filteredLeads, sortKey, sortDir);

    // ─── Grouping ───────────────────────────────────────────────────────

    const groups = buildGroups(sortedLeads, groupBy);

    // ─── Toggle helpers ─────────────────────────────────────────────────

    const toggleCollapsed = useCallback((groupId: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
            return next;
        });
    }, []);

    const togglePersonFilter = (name: string) => {
        setPersonFilter((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
    };

    const toggleStatusFilter = (status: LeadStatus) => {
        setStatusFilter((prev) => prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]);
    };

    const togglePriorityFilter = (priority: LeadPriority) => {
        setPriorityFilter((prev) => prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]);
    };

    const toggleColumn = (col: ColumnKey) => {
        setHiddenColumns((prev) => {
            const next = new Set(prev);
            if (next.has(col)) next.delete(col); else next.add(col);
            return next;
        });
    };

    const isColumnVisible = (col: ColumnKey) => !hiddenColumns.has(col);

    const toggleStar = (leadId: string) => {
        setStarredLeads((prev) => {
            const next = new Set(prev);
            if (next.has(leadId)) next.delete(leadId); else next.add(leadId);
            return next;
        });
    };

    const toggleSelect = (leadId: string) => {
        setSelectedLeads((prev) => {
            const next = new Set(prev);
            if (next.has(leadId)) next.delete(leadId); else next.add(leadId);
            return next;
        });
    };

    const selectAllInGroup = (items: Lead[]) => {
        setSelectedLeads((prev) => {
            const next = new Set(prev);
            const allSelected = items.every((i) => prev.has(i.id));
            if (allSelected) items.forEach((i) => next.delete(i.id));
            else items.forEach((i) => next.add(i.id));
            return next;
        });
    };

    const updateLead = useCallback((leadId: string, patch: Partial<Lead>) => {
        // Optimistic local update
        setAllLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...patch, updatedAt: new Date().toISOString(), updatedBy: "Voce" } : l)));
        // Persist to DB in background
        updateLeadFromBoard(leadId, { ...patch, updatedBy: "Voce" }).catch(() => {});
    }, []);

    const addItem = useCallback(async (groupId: string) => {
        if (!newItemName.trim()) return;
        const stage: LeadStage = groupBy === "stage" ? (groupId as LeadStage) : "prospeccao";
        let status: LeadStatus = "nao_iniciado";
        let responsible = "";
        let priority: LeadPriority = "";
        if (groupBy === "status") status = groupId as LeadStatus;
        if (groupBy === "priority") priority = (groupId === "__none" ? "" : groupId) as LeadPriority;
        if (groupBy === "responsible") responsible = groupId === "__unassigned" ? "" : groupId;

        const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newLead: Lead = {
            id: tempId, name: newItemName.trim(), responsible, status, deadline: "", priority,
            notes: "", value: "", files: 0, timeline: null,
            updatedAt: new Date().toISOString(), updatedBy: "Voce", stage, followUpDate: "",
        };
        setAllLeads((prev) => [...prev, newLead]);
        setNewItemName("");
        setAddingToGroup(null);

        // Persist to DB, replace temp ID with real UUID
        const result = await createLeadFromBoard({
            name: newLead.name, responsible, status, stage,
            priority, notes: "", value: "",
        });
        if (result.success && result.id) {
            setAllLeads((prev) => prev.map((l) => (l.id === tempId ? { ...l, id: result.id! } : l)));
        }
    }, [newItemName, groupBy]);

    const addNewLead = useCallback(async () => {
        if (!newName.trim()) return;
        const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newLead: Lead = {
            id: tempId,
            name: newName.trim(),
            responsible: newResponsible,
            status: newFormStatus,
            deadline: newDeadline,
            priority: newPriority,
            notes: newNotes,
            value: newValue,
            files: 0,
            timeline: null,
            updatedAt: new Date().toISOString(),
            updatedBy: "Voce",
            stage: newStage,
            followUpDate: "",
        };
        setAllLeads((prev) => [newLead, ...prev]);
        setNewName("");
        setNewResponsible("");
        setNewStage("prospeccao");
        setNewFormStatus("nao_iniciado");
        setNewPriority("");
        setNewDeadline("");
        setNewValue("");
        setNewNotes("");
        setShowNewForm(false);

        // Persist to DB
        const result = await createLeadFromBoard({
            name: newLead.name, responsible: newLead.responsible,
            status: newLead.status, stage: newLead.stage,
            deadline: newLead.deadline, priority: newLead.priority,
            notes: newLead.notes, value: newLead.value,
        });
        if (result.success && result.id) {
            setAllLeads((prev) => prev.map((l) => (l.id === tempId ? { ...l, id: result.id! } : l)));
        }
    }, [newName, newResponsible, newFormStatus, newDeadline, newPriority, newNotes, newValue, newStage]);

    const exportCsv = useCallback(() => {
        const headers = ["Lead", "Responsavel", "Status", "Prazo", "Prioridade", "Notas", "Valor", "Arquivos", "Estagio"];
        const statusLabel = (s: LeadStatus) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
        const priorityLabel = (p: LeadPriority) => PRIORITY_OPTIONS.find((o) => o.value === p)?.label ?? p;
        const rows = sortedLeads.map((l) => [
            l.name, l.responsible, statusLabel(l.status), l.deadline, priorityLabel(l.priority),
            l.notes, l.value, String(l.files), STAGE_GROUPS.find((sg) => sg.stage === l.stage)?.label ?? l.stage,
        ]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [sortedLeads]);

    const expandAll = () => setCollapsedGroups(new Set());
    const collapseAll = () => setCollapsedGroups(new Set(groups.map((g) => g.id)));

    const activeFilterCount = personFilter.length + statusFilter.length + priorityFilter.length;

    // ─── Column config ──────────────────────────────────────────────────

    const COL = {
        check: "w-[36px] min-w-[36px]",
        name: "min-w-[240px]",
        responsible: "w-[100px] min-w-[100px]",
        status: "w-[140px] min-w-[140px]",
        deadline: "w-[90px] min-w-[90px]",
        priority: "w-[140px] min-w-[140px]",
        notes: "w-[140px] min-w-[140px]",
        value: "w-[110px] min-w-[110px]",
        files: "w-[80px] min-w-[80px]",
        timeline: "w-[120px] min-w-[120px]",
        updated: "w-[150px] min-w-[150px]",
        addCol: "w-[36px] min-w-[36px]",
    };

    const hCell = "px-2 py-2 text-[13px] font-medium text-pf-grey border-b border-pf-grey/10 select-none whitespace-nowrap";

    return (
        <div className="h-full flex flex-col font-sans text-[14px]">
            {/* ─── Board Header ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-1 pb-4">
                <h1 className="text-xl font-bold tracking-tight text-pf-black">Leads</h1>
            </div>

            {/* ─── Toolbar ───────────────────────────────────────────── */}
            <div ref={toolbarRef} className="flex items-center gap-1 pb-4 flex-wrap">
                {/* 1. Novo Lead */}
                <div className="relative">
                    <button
                        onClick={() => { closeAllDropdowns(); setShowNewForm(!showNewForm); }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-pf-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-pf-blue/90 transition-colors"
                    >
                        Novo Lead
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="h-5 w-px bg-pf-grey/20 mx-1" />

                {/* 2. Pesquisar */}
                <button
                    onClick={() => { closeAllDropdowns(); setSearchOpen(!searchOpen); }}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${searchOpen ? "bg-blue-50 text-pf-blue" : "text-pf-grey hover:bg-background"}`}
                >
                    <Search className="h-4 w-4" />
                    Pesquisar
                </button>

                {searchOpen && (
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar..."
                            className="h-8 w-48 rounded-md border border-pf-grey/20 px-3 pr-7 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all"
                            autoFocus
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-2 text-pf-grey/50 hover:text-pf-grey">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {/* 3. Pessoa */}
                <div className="relative">
                    <button
                        onClick={() => { closeAllDropdowns(); setPersonOpen(!personOpen); }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${personFilter.length > 0 ? "bg-blue-50 text-pf-blue" : "text-pf-grey hover:bg-background"}`}
                    >
                        <Users className="h-4 w-4" />
                        Pessoa
                        {personFilter.length > 0 && (
                            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pf-blue text-[10px] text-white">{personFilter.length}</span>
                        )}
                    </button>
                    <ToolbarDropdown open={personOpen}>
                        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-pf-grey/50">Responsavel</div>
                        {RESPONSIBLE_LIST.map((name) => (
                            <button
                                key={name}
                                onClick={() => togglePersonFilter(name)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-pf-black hover:bg-white transition-colors"
                            >
                                <span className={`flex h-4 w-4 items-center justify-center rounded border ${personFilter.includes(name) ? "border-pf-blue bg-pf-blue" : "border-pf-grey/20"}`}>
                                    {personFilter.includes(name) && <Check className="h-3 w-3 text-white" />}
                                </span>
                                <Avatar name={name} />
                                <span className="truncate">{name}</span>
                            </button>
                        ))}
                        {personFilter.length > 0 && (
                            <div className="border-t border-pf-grey/10 mt-1 pt-1 px-3">
                                <button onClick={() => setPersonFilter([])} className="w-full py-1.5 text-xs text-pf-blue hover:underline text-left">
                                    Limpar filtros
                                </button>
                            </div>
                        )}
                    </ToolbarDropdown>
                </div>

                {/* 4. Filtro */}
                <div className="relative">
                    <button
                        onClick={() => { closeAllDropdowns(); setFilterOpen(!filterOpen); }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${activeFilterCount > 0 ? "bg-blue-50 text-pf-blue" : "text-pf-grey hover:bg-background"}`}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filtro
                        {activeFilterCount > 0 && (
                            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pf-blue text-[10px] text-white">{activeFilterCount}</span>
                        )}
                    </button>
                    <ToolbarDropdown open={filterOpen} width={260}>
                        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-pf-grey/50">Status</div>
                        {STATUS_OPTIONS.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => toggleStatusFilter(s.value)}
                                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-pf-black hover:bg-white"
                            >
                                <span className={`flex h-4 w-4 items-center justify-center rounded border ${statusFilter.includes(s.value) ? "border-pf-blue bg-pf-blue" : "border-pf-grey/20"}`}>
                                    {statusFilter.includes(s.value) && <Check className="h-3 w-3 text-white" />}
                                </span>
                                <span className="flex h-5 w-5 rounded-[3px]" style={{ backgroundColor: s.color }} />
                                <span>{s.label}</span>
                            </button>
                        ))}
                        <div className="mx-3 my-1.5 border-t border-pf-grey/10" />
                        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-pf-grey/50">Prioridade</div>
                        {PRIORITY_OPTIONS.filter((p) => p.value !== "").map((p) => (
                            <button
                                key={p.value}
                                onClick={() => togglePriorityFilter(p.value)}
                                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-pf-black hover:bg-white"
                            >
                                <span className={`flex h-4 w-4 items-center justify-center rounded border ${priorityFilter.includes(p.value) ? "border-pf-blue bg-pf-blue" : "border-pf-grey/20"}`}>
                                    {priorityFilter.includes(p.value) && <Check className="h-3 w-3 text-white" />}
                                </span>
                                <span className="flex h-5 w-5 rounded-[3px]" style={{ backgroundColor: p.color }} />
                                <span>{p.label}</span>
                            </button>
                        ))}
                        {(statusFilter.length > 0 || priorityFilter.length > 0) && (
                            <div className="border-t border-pf-grey/10 mt-1 pt-1 px-3">
                                <button onClick={() => { setStatusFilter([]); setPriorityFilter([]); }} className="w-full py-1.5 text-xs text-pf-blue hover:underline text-left">
                                    Limpar todos os filtros
                                </button>
                            </div>
                        )}
                    </ToolbarDropdown>
                </div>

                {/* 5. Ordenar */}
                <div className="relative">
                    <button
                        onClick={() => { closeAllDropdowns(); setSortOpen(!sortOpen); }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${sortKey ? "bg-blue-50 text-pf-blue" : "text-pf-grey hover:bg-background"}`}
                    >
                        <ArrowUpDown className="h-4 w-4" />
                        Ordenar
                    </button>
                    <ToolbarDropdown open={sortOpen} width={200}>
                        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-pf-grey/50">Ordenar por</div>
                        {SORT_OPTIONS.map((opt) => (
                            <button
                                key={opt.key}
                                onClick={() => {
                                    if (sortKey === opt.key) {
                                        if (sortDir === "asc") setSortDir("desc");
                                        else { setSortKey(null); setSortDir("asc"); }
                                    } else {
                                        setSortKey(opt.key);
                                        setSortDir("asc");
                                    }
                                }}
                                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${sortKey === opt.key ? "bg-blue-50 text-pf-blue" : "text-pf-black hover:bg-white"}`}
                            >
                                <span>{opt.label}</span>
                                {sortKey === opt.key && (
                                    sortDir === "asc"
                                        ? <ChevronUp className="h-3.5 w-3.5" />
                                        : <ChevronDown className="h-3.5 w-3.5" />
                                )}
                            </button>
                        ))}
                        {sortKey && (
                            <div className="border-t border-pf-grey/10 mt-1 pt-1 px-3">
                                <button onClick={() => { setSortKey(null); setSortDir("asc"); }} className="w-full py-1.5 text-xs text-pf-blue hover:underline text-left">
                                    Remover ordenacao
                                </button>
                            </div>
                        )}
                    </ToolbarDropdown>
                </div>

                {/* 6. Ocultar */}
                <div className="relative">
                    <button
                        onClick={() => { closeAllDropdowns(); setHideOpen(!hideOpen); }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${hiddenColumns.size > 0 ? "bg-blue-50 text-pf-blue" : "text-pf-grey hover:bg-background"}`}
                    >
                        <EyeOff className="h-4 w-4" />
                        Ocultar
                        {hiddenColumns.size > 0 && (
                            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pf-blue text-[10px] text-white">{hiddenColumns.size}</span>
                        )}
                    </button>
                    <ToolbarDropdown open={hideOpen} width={220}>
                        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-pf-grey/50">Colunas visiveis</div>
                        {ALL_COLUMNS.map((col) => (
                            <button
                                key={col.key}
                                onClick={() => toggleColumn(col.key)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-pf-black hover:bg-white"
                            >
                                <span className={`flex h-4 w-4 items-center justify-center rounded border ${isColumnVisible(col.key) ? "border-pf-blue bg-pf-blue" : "border-pf-grey/20"}`}>
                                    {isColumnVisible(col.key) && <Check className="h-3 w-3 text-white" />}
                                </span>
                                <span>{col.label}</span>
                            </button>
                        ))}
                        {hiddenColumns.size > 0 && (
                            <div className="border-t border-pf-grey/10 mt-1 pt-1 px-3">
                                <button onClick={() => setHiddenColumns(new Set())} className="w-full py-1.5 text-xs text-pf-blue hover:underline text-left">
                                    Mostrar todas
                                </button>
                            </div>
                        )}
                    </ToolbarDropdown>
                </div>

                {/* 7. Agrupar por */}
                <div className="relative">
                    <button
                        onClick={() => { closeAllDropdowns(); setGroupByOpen(!groupByOpen); }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${groupBy !== "stage" ? "bg-blue-50 text-pf-blue" : "text-pf-grey hover:bg-background"}`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Agrupar por
                    </button>
                    <ToolbarDropdown open={groupByOpen} width={200}>
                        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-pf-grey/50">Agrupar por</div>
                        {GROUP_BY_OPTIONS.map((opt) => (
                            <button
                                key={opt.key}
                                onClick={() => { setGroupBy(opt.key); setGroupByOpen(false); setCollapsedGroups(new Set()); }}
                                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${groupBy === opt.key ? "bg-blue-50 text-pf-blue font-medium" : "text-pf-black hover:bg-white"}`}
                            >
                                <span>{opt.label}</span>
                                {groupBy === opt.key && <Check className="h-3.5 w-3.5" />}
                            </button>
                        ))}
                    </ToolbarDropdown>
                </div>

                {/* 8. More (...) */}
                <div className="relative">
                    <button
                        onClick={() => { closeAllDropdowns(); setMoreOpen(!moreOpen); }}
                        className="inline-flex items-center rounded-md px-2 py-1.5 text-sm text-pf-grey/50 hover:bg-background transition-colors"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <ToolbarDropdown open={moreOpen} width={200}>
                        <button
                            onClick={() => { expandAll(); setMoreOpen(false); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-pf-black hover:bg-white"
                        >
                            <Maximize2 className="h-3.5 w-3.5 text-pf-grey/50" />
                            Expandir todos
                        </button>
                        <button
                            onClick={() => { collapseAll(); setMoreOpen(false); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-pf-black hover:bg-white"
                        >
                            <Minimize2 className="h-3.5 w-3.5 text-pf-grey/50" />
                            Colapsar todos
                        </button>
                        <div className="mx-3 my-1 border-t border-pf-grey/10" />
                        <button
                            onClick={() => { exportCsv(); setMoreOpen(false); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-pf-black hover:bg-white"
                        >
                            <Download className="h-3.5 w-3.5 text-pf-grey/50" />
                            Exportar dados
                        </button>
                    </ToolbarDropdown>
                </div>
            </div>

            {/* ─── New Lead Form (inline) ─────────────────────────────── */}
            {showNewForm && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-pf-black">Novo Lead</span>
                        <button onClick={() => setShowNewForm(false)} className="text-pf-grey/50 hover:text-pf-grey">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); addNewLead(); }}>
                        <div className="grid grid-cols-4 gap-3 mb-3">
                            <div className="col-span-4">
                                <label className="block text-xs font-medium text-pf-grey mb-1">Nome do lead *</label>
                                <input
                                    ref={newNameRef}
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ex: Empresa XYZ — Assessoria Tributaria"
                                    className="w-full h-9 rounded-md border border-pf-grey/20 px-3 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-pf-grey mb-1">Responsavel</label>
                                <select
                                    value={newResponsible}
                                    onChange={(e) => setNewResponsible(e.target.value)}
                                    className="w-full h-9 rounded-md border border-pf-grey/20 px-2 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                                >
                                    <option value="">Selecionar...</option>
                                    {RESPONSIBLE_LIST.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-pf-grey mb-1">Estagio</label>
                                <select
                                    value={newStage}
                                    onChange={(e) => setNewStage(e.target.value as LeadStage)}
                                    className="w-full h-9 rounded-md border border-pf-grey/20 px-2 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                                >
                                    {STAGE_GROUPS.map((sg) => (
                                        <option key={sg.stage} value={sg.stage}>{sg.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-pf-grey mb-1">Status</label>
                                <select
                                    value={newFormStatus}
                                    onChange={(e) => setNewFormStatus(e.target.value as LeadStatus)}
                                    className="w-full h-9 rounded-md border border-pf-grey/20 px-2 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-pf-grey mb-1">Prioridade</label>
                                <select
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value as LeadPriority)}
                                    className="w-full h-9 rounded-md border border-pf-grey/20 px-2 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                                >
                                    {PRIORITY_OPTIONS.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-pf-grey mb-1">Prazo</label>
                                <input
                                    type="date"
                                    value={newDeadline}
                                    onChange={(e) => setNewDeadline(e.target.value)}
                                    className="w-full h-9 rounded-md border border-pf-grey/20 px-2 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-pf-grey mb-1">Valor</label>
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder="R$ 0"
                                    className="w-full h-9 rounded-md border border-pf-grey/20 px-3 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-pf-grey mb-1">Notas</label>
                                <input
                                    type="text"
                                    value={newNotes}
                                    onChange={(e) => setNewNotes(e.target.value)}
                                    placeholder="Observacoes..."
                                    className="w-full h-9 rounded-md border border-pf-grey/20 px-3 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={!newName.trim()}
                                className="inline-flex items-center gap-1.5 rounded-md bg-pf-blue px-4 py-2 text-sm font-medium text-white hover:bg-pf-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Adicionar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ─── Active filters bar ─────────────────────────────────── */}
            {(personFilter.length > 0 || statusFilter.length > 0 || priorityFilter.length > 0 || sortKey || search) && (
                <div className="flex items-center gap-2 pb-3 flex-wrap">
                    <span className="text-xs text-pf-grey/50">Filtros ativos:</span>
                    {personFilter.map((name) => (
                        <span key={name} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">
                            {name}
                            <button onClick={() => togglePersonFilter(name)}><X className="h-3 w-3" /></button>
                        </span>
                    ))}
                    {statusFilter.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs text-white" style={{ backgroundColor: getStatusConfig(s).color }}>
                            {getStatusConfig(s).label}
                            <button onClick={() => toggleStatusFilter(s)}><X className="h-3 w-3" /></button>
                        </span>
                    ))}
                    {priorityFilter.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs text-white" style={{ backgroundColor: getPriorityConfig(p).color }}>
                            {getPriorityConfig(p).label}
                            <button onClick={() => togglePriorityFilter(p)}><X className="h-3 w-3" /></button>
                        </span>
                    ))}
                    {sortKey && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-pf-grey/10 px-2.5 py-0.5 text-xs text-pf-grey">
                            Ordenado: {SORT_OPTIONS.find((o) => o.key === sortKey)?.label} ({sortDir === "asc" ? "A-Z" : "Z-A"})
                            <button onClick={() => { setSortKey(null); setSortDir("asc"); }}><X className="h-3 w-3" /></button>
                        </span>
                    )}
                    {search && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-pf-grey/10 px-2.5 py-0.5 text-xs text-pf-grey">
                            Busca: &quot;{search}&quot;
                            <button onClick={() => setSearch("")}><X className="h-3 w-3" /></button>
                        </span>
                    )}
                    <button
                        onClick={() => { setPersonFilter([]); setStatusFilter([]); setPriorityFilter([]); setSortKey(null); setSortDir("asc"); setSearch(""); }}
                        className="text-xs text-pf-blue hover:underline ml-1"
                    >
                        Limpar tudo
                    </button>
                </div>
            )}

            {/* ─── Board Body ────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto">
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-pf-grey/20 border-t-[#0073EA]" />
                        <span className="ml-3 text-sm text-pf-grey">Carregando leads...</span>
                    </div>
                )}
                {!loading && groups.map((group) => {
                    const isCollapsed = collapsedGroups.has(group.id);
                    const totalValue = group.items.reduce((sum, item) => sum + parseValue(item.value), 0);
                    const totalFiles = group.items.reduce((sum, item) => sum + item.files, 0);

                    return (
                        <div key={group.id} className="mb-6">
                            {/* ─── Group Header ──────────────────────────── */}
                            <button onClick={() => toggleCollapsed(group.id)} className="flex items-center gap-2 mb-1 group">
                                <ChevronDown
                                    className="h-4 w-4 transition-transform"
                                    style={{ color: group.color, transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                                />
                                <span className="text-[18px] font-bold" style={{ color: group.color }}>
                                    {group.label}
                                </span>
                                <span className="text-xs text-pf-grey/50 ml-1">
                                    {group.items.length} {group.items.length === 1 ? "lead" : "leads"}
                                </span>
                            </button>

                            {!isCollapsed && (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse" style={{ minWidth: 1200 }}>
                                        <thead>
                                            <tr>
                                                <th className={`${hCell} ${COL.check} text-center`} style={{ borderLeft: `3px solid ${group.color}` }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={group.items.length > 0 && group.items.every((i) => selectedLeads.has(i.id))}
                                                        onChange={() => selectAllInGroup(group.items)}
                                                        className="h-3.5 w-3.5 rounded accent-[#0073EA] cursor-pointer"
                                                    />
                                                </th>
                                                {isColumnVisible("name") && <th className={`${hCell} ${COL.name} text-left`}>Lead</th>}
                                                {isColumnVisible("responsible") && <th className={`${hCell} ${COL.responsible} text-center`}>Responsavel</th>}
                                                {isColumnVisible("status") && <th className={`${hCell} ${COL.status} text-center`}>Status</th>}
                                                {isColumnVisible("deadline") && <th className={`${hCell} ${COL.deadline} text-center`}>Prazo</th>}
                                                {isColumnVisible("priority") && <th className={`${hCell} ${COL.priority} text-center`}>Prioridade</th>}
                                                {isColumnVisible("notes") && <th className={`${hCell} ${COL.notes} text-left`}>Notas</th>}
                                                {isColumnVisible("value") && <th className={`${hCell} ${COL.value} text-right`}>Valor</th>}
                                                {isColumnVisible("files") && <th className={`${hCell} ${COL.files} text-center`}>Arquivos</th>}
                                                {isColumnVisible("timeline") && <th className={`${hCell} ${COL.timeline} text-center`}>Cronograma</th>}
                                                {isColumnVisible("updated") && <th className={`${hCell} ${COL.updated} text-left`}>Ultima atualizacao</th>}
                                                <th className={`${hCell} ${COL.addCol} text-center`}><Plus className="h-3.5 w-3.5 text-pf-grey/50" /></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.items.map((item) => (
                                                <tr key={item.id} className="group/row border-b border-gray-100 hover:bg-[#F5F6F8] transition-colors">
                                                    <td className="px-2 py-1 text-center" style={{ borderLeft: `3px solid ${group.color}` }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedLeads.has(item.id)}
                                                            onChange={() => toggleSelect(item.id)}
                                                            className="h-3.5 w-3.5 rounded accent-[#0073EA] cursor-pointer"
                                                        />
                                                    </td>

                                                    {isColumnVisible("name") && (
                                                        <td className="px-2 py-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[14px] text-pf-black font-medium truncate">{item.name}</span>
                                                                <div className="flex items-center gap-0.5 shrink-0">
                                                                    <button
                                                                        onClick={() => toggleStar(item.id)}
                                                                        className={`p-0.5 transition-colors ${starredLeads.has(item.id) ? "text-yellow-500" : "opacity-0 group-hover/row:opacity-100 text-pf-grey/50 hover:text-pf-grey"}`}
                                                                    >
                                                                        <Star className={`h-3.5 w-3.5 ${starredLeads.has(item.id) ? "fill-yellow-500" : ""}`} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingNotesId(editingNotesId === item.id ? null : item.id)}
                                                                        className={`p-0.5 transition-colors ${item.notes ? "text-blue-400 hover:text-blue-600" : "opacity-0 group-hover/row:opacity-100 text-pf-grey/50 hover:text-pf-grey"}`}
                                                                    >
                                                                        <MessageSquare className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}

                                                    {isColumnVisible("responsible") && (
                                                        <td className="px-2 py-1 text-center">
                                                            {item.responsible ? (
                                                                <div className="flex justify-center"><Avatar name={item.responsible} /></div>
                                                            ) : (
                                                                <div className="flex justify-center">
                                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-pf-grey/20 text-gray-300">
                                                                        <User className="h-3.5 w-3.5" />
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}

                                                    {isColumnVisible("status") && (
                                                        <td className="px-1 py-1">
                                                            <StatusCell value={item.status} onChange={(v) => updateLead(item.id, { status: v })} />
                                                        </td>
                                                    )}

                                                    {isColumnVisible("deadline") && (
                                                        <td className="px-2 py-1 text-center text-[13px] text-pf-grey">{formatDeadline(item.deadline)}</td>
                                                    )}

                                                    {isColumnVisible("priority") && (
                                                        <td className="px-1 py-1">
                                                            <PriorityCell value={item.priority} onChange={(v) => updateLead(item.id, { priority: v })} />
                                                        </td>
                                                    )}

                                                    {isColumnVisible("notes") && (
                                                        <td className="px-2 py-1 text-[13px] text-pf-grey">
                                                            {editingNotesId === item.id ? (
                                                                <input
                                                                    type="text"
                                                                    value={item.notes}
                                                                    onChange={(e) => updateLead(item.id, { notes: e.target.value })}
                                                                    onBlur={() => setEditingNotesId(null)}
                                                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingNotesId(null); }}
                                                                    className="w-full h-7 rounded border border-pf-blue px-2 text-sm outline-none ring-1 ring-[#0073EA]"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="block truncate max-w-[140px] cursor-pointer hover:text-pf-black"
                                                                    onClick={() => setEditingNotesId(item.id)}
                                                                >
                                                                    {item.notes || <span className="text-gray-300">—</span>}
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}

                                                    {isColumnVisible("value") && (
                                                        <td className="px-2 py-1 text-right text-[13px] font-medium text-pf-black font-mono">{item.value}</td>
                                                    )}

                                                    {isColumnVisible("files") && (
                                                        <td className="px-2 py-1 text-center text-[13px] text-pf-grey">
                                                            <button
                                                                onClick={() => updateLead(item.id, { files: item.files + 1 })}
                                                                className="inline-flex items-center gap-1 hover:text-pf-blue transition-colors"
                                                                title="Adicionar arquivo"
                                                            >
                                                                {item.files > 0 ? (
                                                                    <><FileText className="h-3.5 w-3.5" /><span>{item.files}</span></>
                                                                ) : (
                                                                    <span className="text-gray-300 hover:text-pf-blue"><Plus className="h-3.5 w-3.5" /></span>
                                                                )}
                                                            </button>
                                                        </td>
                                                    )}

                                                    {isColumnVisible("timeline") && (
                                                        <td className="px-2 py-1 text-center">
                                                            <TimelineCell timeline={item.timeline} color={group.color} />
                                                        </td>
                                                    )}

                                                    {isColumnVisible("updated") && (
                                                        <td className="px-2 py-1">
                                                            <UpdatedCell updatedAt={item.updatedAt} updatedBy={item.updatedBy} />
                                                        </td>
                                                    )}

                                                    <td className="px-2 py-1" />
                                                </tr>
                                            ))}

                                            {/* ─── Add item row ──────────────── */}
                                            <tr className="border-b border-gray-100">
                                                <td className="px-2 py-1" style={{ borderLeft: `3px solid ${group.color}` }} />
                                                <td colSpan={ALL_COLUMNS.filter((c) => isColumnVisible(c.key)).length + 1} className="px-2 py-1">
                                                    {addingToGroup === group.id ? (
                                                        <form onSubmit={(e) => { e.preventDefault(); addItem(group.id); }} className="flex items-center gap-2">
                                                            <input
                                                                ref={addInputRef}
                                                                type="text"
                                                                value={newItemName}
                                                                onChange={(e) => setNewItemName(e.target.value)}
                                                                placeholder="Nome do lead..."
                                                                className="h-7 w-64 rounded border border-pf-grey/20 px-2 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue"
                                                                onBlur={() => { if (!newItemName.trim()) setAddingToGroup(null); }}
                                                                onKeyDown={(e) => { if (e.key === "Escape") { setAddingToGroup(null); setNewItemName(""); } }}
                                                            />
                                                        </form>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setAddingToGroup(group.id); setNewItemName(""); }}
                                                            className="text-[13px] text-pf-grey/50 hover:text-pf-grey transition-colors"
                                                        >
                                                            + Adicionar lead
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* ─── Summary row ───────────────── */}
                                            <tr className="bg-gray-50/50">
                                                <td className="px-2 py-2" style={{ borderLeft: `3px solid ${group.color}` }} />
                                                {isColumnVisible("name") && <td className="px-2 py-2" />}
                                                {isColumnVisible("responsible") && <td className="px-2 py-2" />}
                                                {isColumnVisible("status") && (
                                                    <td className="px-1 py-2">
                                                        <div className="flex h-[20px] w-full overflow-hidden rounded-[3px]">
                                                            {(() => {
                                                                const total = group.items.length || 1;
                                                                const counts: Record<string, number> = {};
                                                                group.items.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });
                                                                return STATUS_OPTIONS.map((s) =>
                                                                    (counts[s.value] || 0) > 0 ? (
                                                                        <div key={s.value} style={{ width: `${((counts[s.value] || 0) / total) * 100}%`, backgroundColor: s.color }} className="h-full" />
                                                                    ) : null,
                                                                );
                                                            })()}
                                                        </div>
                                                    </td>
                                                )}
                                                {isColumnVisible("deadline") && (
                                                    <td className="px-2 py-2 text-center">
                                                        {group.items.length > 0 && group.items.some((i) => i.deadline) && (
                                                            <span className="inline-flex h-[20px] items-center rounded-full px-2.5 text-[10px] font-medium text-white whitespace-nowrap" style={{ backgroundColor: group.color }}>
                                                                {formatTimeline({
                                                                    start: group.items.filter((i) => i.deadline).reduce((min, i) => (i.deadline < min ? i.deadline : min), group.items.find((i) => i.deadline)!.deadline),
                                                                    end: group.items.filter((i) => i.deadline).reduce((max, i) => (i.deadline > max ? i.deadline : max), group.items.find((i) => i.deadline)!.deadline),
                                                                })}
                                                            </span>
                                                        )}
                                                    </td>
                                                )}
                                                {isColumnVisible("priority") && (
                                                    <td className="px-1 py-2">
                                                        <div className="flex h-[20px] w-full overflow-hidden rounded-[3px]">
                                                            {(() => {
                                                                const total = group.items.length || 1;
                                                                const counts: Record<string, number> = {};
                                                                group.items.forEach((i) => { counts[i.priority] = (counts[i.priority] || 0) + 1; });
                                                                return PRIORITY_OPTIONS.map((p) =>
                                                                    (counts[p.value] || 0) > 0 ? (
                                                                        <div key={p.value || "__none"} style={{ width: `${((counts[p.value] || 0) / total) * 100}%`, backgroundColor: p.color }} className="h-full" />
                                                                    ) : null,
                                                                );
                                                            })()}
                                                        </div>
                                                    </td>
                                                )}
                                                {isColumnVisible("notes") && <td className="px-2 py-2" />}
                                                {isColumnVisible("value") && (
                                                    <td className="px-2 py-2 text-right">
                                                        <div className="text-[13px] font-bold text-pf-black font-mono">R$ {totalValue.toLocaleString("pt-BR")}</div>
                                                        <div className="text-[10px] text-pf-grey/50">Total</div>
                                                    </td>
                                                )}
                                                {isColumnVisible("files") && (
                                                    <td className="px-2 py-2 text-center">
                                                        <div className="text-[13px] text-pf-grey">{totalFiles}</div>
                                                        <div className="text-[10px] text-pf-grey/50">Arquivos</div>
                                                    </td>
                                                )}
                                                {isColumnVisible("timeline") && (
                                                    <td className="px-2 py-2 text-center">
                                                        {group.items.length > 0 && group.items.some((i) => i.timeline) && (
                                                            <span className="inline-flex h-[20px] items-center rounded-full px-2.5 text-[10px] font-medium text-white whitespace-nowrap" style={{ backgroundColor: group.color }}>
                                                                {formatTimeline({
                                                                    start: group.items.filter((i) => i.timeline).reduce((min, i) => (i.timeline!.start < min ? i.timeline!.start : min), group.items.find((i) => i.timeline)!.timeline!.start),
                                                                    end: group.items.filter((i) => i.timeline).reduce((max, i) => (i.timeline!.end > max ? i.timeline!.end : max), group.items.find((i) => i.timeline)!.timeline!.end),
                                                                })}
                                                            </span>
                                                        )}
                                                    </td>
                                                )}
                                                {isColumnVisible("updated") && <td className="px-2 py-2" />}
                                                <td className="px-2 py-2" />
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="mb-8" />
            </div>
        </div>
    );
}
