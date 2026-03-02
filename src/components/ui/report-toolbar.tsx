"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Columns3,
    SlidersHorizontal,
    Rows3,
    Bookmark,
    Save,
    FileSpreadsheet,
    Check,
    Trash2,
} from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";

// ======================== TYPES ========================

export type ColumnDef = {
    key: string;
    label: string;
    defaultVisible?: boolean;
};

export type Density = "compact" | "normal" | "comfortable";

export type FilterDef = {
    key: string;
    label: string;
    options: { value: string; label: string }[];
};

export type SavedView = {
    id: string;
    name: string;
    visibleColumns: string[];
    density: Density;
    filters: Record<string, string[]>;
};

export type ReportToolbarProps = {
    /** Page identifier for localStorage key namespacing */
    pageId: string;
    /** Available columns */
    columns: ColumnDef[];
    /** Currently visible column keys */
    visibleColumns: string[];
    onVisibleColumnsChange: (cols: string[]) => void;
    /** Density */
    density: Density;
    onDensityChange: (d: Density) => void;
    /** Filter definitions for the FILTROS dropdown */
    filterDefs?: FilterDef[];
    /** Current filters state (for saving views and FILTROS display) */
    currentFilters?: Record<string, string[]>;
    onApplyFilters?: (filters: Record<string, string[]>) => void;
    /** Generate report callback */
    onGenerateReport?: () => void;
};

// ======================== HELPERS ========================

function getStorageKey(pageId: string) {
    return `pf-views-${pageId}`;
}

function loadViews(pageId: string): SavedView[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(getStorageKey(pageId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function persistViews(pageId: string, views: SavedView[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(getStorageKey(pageId), JSON.stringify(views));
}

// ======================== DENSITY LABELS ========================

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
    { value: "compact", label: "Compacto" },
    { value: "normal", label: "Normal" },
    { value: "comfortable", label: "Espaçoso" },
];

// ======================== MAIN COMPONENT ========================

export function ReportToolbar({
    pageId,
    columns,
    visibleColumns,
    onVisibleColumnsChange,
    density,
    onDensityChange,
    filterDefs = [],
    currentFilters = {},
    onApplyFilters,
    onGenerateReport,
}: ReportToolbarProps) {
    // Dropdown states
    const [colOpen, setColOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [densityOpen, setDensityOpen] = useState(false);
    const [viewsOpen, setViewsOpen] = useState(false);
    const [saveOpen, setSaveOpen] = useState(false);
    const [saveName, setSaveName] = useState("");

    // Saved views
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);

    // Load on mount
    useEffect(() => {
        setSavedViews(loadViews(pageId));
    }, [pageId]);

    // Refs for click-outside
    const colRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const densityRef = useRef<HTMLDivElement>(null);
    const viewsRef = useRef<HTMLDivElement>(null);
    const saveRef = useRef<HTMLDivElement>(null);

    useClickOutside(colRef, useCallback(() => setColOpen(false), []));
    useClickOutside(filterRef, useCallback(() => setFilterOpen(false), []));
    useClickOutside(densityRef, useCallback(() => setDensityOpen(false), []));
    useClickOutside(viewsRef, useCallback(() => setViewsOpen(false), []));
    useClickOutside(saveRef, useCallback(() => { setSaveOpen(false); setSaveName(""); }, []));

    // Active filter count
    const activeFilterCount = Object.values(currentFilters).reduce((count, arr) => count + arr.length, 0);

    // Toggle a filter value
    const toggleFilter = (filterKey: string, value: string) => {
        if (!onApplyFilters) return;
        const current = currentFilters[filterKey] || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        onApplyFilters({ ...currentFilters, [filterKey]: updated });
    };

    // Clear all filters
    const clearAllFilters = () => {
        if (!onApplyFilters) return;
        const cleared: Record<string, string[]> = {};
        for (const key of Object.keys(currentFilters)) {
            cleared[key] = [];
        }
        onApplyFilters(cleared);
    };

    // Column toggle
    const toggleColumn = (key: string) => {
        if (visibleColumns.includes(key)) {
            if (visibleColumns.length > 1) {
                onVisibleColumnsChange(visibleColumns.filter((k) => k !== key));
            }
        } else {
            onVisibleColumnsChange([...visibleColumns, key]);
        }
    };

    const showAllColumns = () => {
        onVisibleColumnsChange(columns.map((c) => c.key));
    };

    // Save view
    const handleSaveView = () => {
        if (!saveName.trim()) return;
        const newView: SavedView = {
            id: Date.now().toString(),
            name: saveName.trim(),
            visibleColumns: [...visibleColumns],
            density,
            filters: { ...currentFilters },
        };
        const updated = [...savedViews, newView];
        setSavedViews(updated);
        persistViews(pageId, updated);
        setSaveName("");
        setSaveOpen(false);
    };

    // Apply view
    const applyView = (view: SavedView) => {
        onVisibleColumnsChange(view.visibleColumns);
        onDensityChange(view.density);
        if (onApplyFilters) {
            onApplyFilters(view.filters);
        }
        setViewsOpen(false);
    };

    // Delete view
    const deleteView = (id: string) => {
        const updated = savedViews.filter((v) => v.id !== id);
        setSavedViews(updated);
        persistViews(pageId, updated);
    };

    // Generate report
    const handleGenerateReport = () => {
        if (onGenerateReport) {
            onGenerateReport();
        } else {
            window.print();
        }
    };

    // Common button style
    const btnBase =
        "flex h-8 items-center gap-1.5 rounded-md border px-3 text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap";
    const btnDefault =
        "border-pf-grey/20 bg-white text-pf-grey hover:bg-pf-blue/5 hover:text-pf-blue hover:border-pf-blue/30";
    const btnActive =
        "border-pf-blue bg-pf-blue/5 text-pf-blue";

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-pf-grey/10 bg-pf-grey/[0.02] px-3 py-2">
            {/* COLUNAS */}
            <div ref={colRef} className="relative">
                <button
                    onClick={() => { setColOpen(!colOpen); setFilterOpen(false); setDensityOpen(false); setViewsOpen(false); setSaveOpen(false); }}
                    className={`${btnBase} ${visibleColumns.length < columns.length ? btnActive : btnDefault}`}
                >
                    <Columns3 className="h-3.5 w-3.5" />
                    Colunas
                    {visibleColumns.length < columns.length && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pf-blue text-[9px] font-bold text-white">
                            {visibleColumns.length}
                        </span>
                    )}
                </button>
                {colOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-md border border-pf-grey/20 bg-white py-1 shadow-lg">
                        {columns.map((col) => {
                            const isVisible = visibleColumns.includes(col.key);
                            return (
                                <button
                                    key={col.key}
                                    onClick={() => toggleColumn(col.key)}
                                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-xs transition-colors ${isVisible ? "bg-pf-blue/5 text-pf-blue font-semibold" : "text-pf-black hover:bg-pf-grey/5"}`}
                                >
                                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${isVisible ? "border-pf-blue bg-pf-blue" : "border-pf-grey/30"}`}>
                                        {isVisible && <Check className="h-3 w-3 text-white" />}
                                    </span>
                                    {col.label}
                                </button>
                            );
                        })}
                        {visibleColumns.length < columns.length && (
                            <>
                                <div className="mx-3 my-1 border-t border-pf-grey/10" />
                                <button onClick={showAllColumns} className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-pf-grey hover:text-pf-black transition-colors">
                                    Mostrar todas
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* FILTROS */}
            <div ref={filterRef} className="relative">
                <button
                    onClick={() => { setFilterOpen(!filterOpen); setColOpen(false); setDensityOpen(false); setViewsOpen(false); setSaveOpen(false); }}
                    className={`${btnBase} ${activeFilterCount > 0 ? btnActive : btnDefault}`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filtros
                    {activeFilterCount > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pf-blue text-[9px] font-bold text-white">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
                {filterOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 min-w-[240px] rounded-md border border-pf-grey/20 bg-white py-1 shadow-lg">
                        {filterDefs.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-pf-grey italic">Nenhum filtro disponível.</p>
                        ) : (
                            <>
                                {filterDefs.map((fd, idx) => {
                                    const selected = currentFilters[fd.key] || [];
                                    return (
                                        <div key={fd.key}>
                                            {idx > 0 && <div className="mx-3 my-1 border-t border-pf-grey/10" />}
                                            <p className="px-4 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-pf-grey/60">{fd.label}</p>
                                            {fd.options.map((opt) => {
                                                const isActive = selected.includes(opt.value);
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => toggleFilter(fd.key, opt.value)}
                                                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-xs transition-colors ${isActive ? "bg-pf-blue/5 text-pf-blue font-semibold" : "text-pf-black hover:bg-pf-grey/5"}`}
                                                    >
                                                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${isActive ? "border-pf-blue bg-pf-blue" : "border-pf-grey/30"}`}>
                                                            {isActive && <Check className="h-3 w-3 text-white" />}
                                                        </span>
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                                {activeFilterCount > 0 && (
                                    <>
                                        <div className="mx-3 my-1 border-t border-pf-grey/10" />
                                        <button
                                            onClick={clearAllFilters}
                                            className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            Limpar Todos
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* DENSIDADE */}
            <div ref={densityRef} className="relative">
                <button
                    onClick={() => { setDensityOpen(!densityOpen); setColOpen(false); setFilterOpen(false); setViewsOpen(false); setSaveOpen(false); }}
                    className={`${btnBase} ${density !== "compact" ? btnActive : btnDefault}`}
                >
                    <Rows3 className="h-3.5 w-3.5" />
                    Densidade
                </button>
                {densityOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-pf-grey/20 bg-white py-1 shadow-lg">
                        {DENSITY_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onDensityChange(opt.value); setDensityOpen(false); }}
                                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors ${density === opt.value ? "bg-pf-blue/5 text-pf-blue font-semibold" : "text-pf-black hover:bg-pf-grey/5"}`}
                            >
                                <span className={`flex h-3 w-3 shrink-0 rounded-full border-2 transition-colors ${density === opt.value ? "border-pf-blue bg-pf-blue" : "border-pf-grey/30"}`} />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Separator */}
            <div className="h-5 w-px bg-pf-grey/15 mx-1" />

            {/* VISOES SALVAS */}
            <div ref={viewsRef} className="relative">
                <button
                    onClick={() => { setViewsOpen(!viewsOpen); setColOpen(false); setFilterOpen(false); setDensityOpen(false); setSaveOpen(false); }}
                    className={`${btnBase} ${savedViews.length > 0 ? btnActive : btnDefault}`}
                >
                    <Bookmark className="h-3.5 w-3.5" />
                    Visões Salvas
                    {savedViews.length > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pf-blue text-[9px] font-bold text-white">
                            {savedViews.length}
                        </span>
                    )}
                </button>
                {viewsOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 min-w-[240px] rounded-md border border-pf-grey/20 bg-white py-1 shadow-lg">
                        {savedViews.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-pf-grey italic">Nenhuma visão salva.</p>
                        ) : (
                            savedViews.map((view) => (
                                <div key={view.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-pf-blue/5 transition-colors group">
                                    <button
                                        onClick={() => applyView(view)}
                                        className="text-left text-xs font-semibold text-pf-black group-hover:text-pf-blue flex-1 truncate"
                                    >
                                        {view.name}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteView(view.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-pf-grey hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* SALVAR VISAO */}
            <div ref={saveRef} className="relative">
                <button
                    onClick={() => { setSaveOpen(!saveOpen); setColOpen(false); setFilterOpen(false); setDensityOpen(false); setViewsOpen(false); }}
                    className={`${btnBase} ${btnDefault}`}
                >
                    <Save className="h-3.5 w-3.5" />
                    Salvar Visão
                </button>
                {saveOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[260px] rounded-md border border-pf-grey/20 bg-white p-3 shadow-lg">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-pf-grey mb-2">Nome da Visão</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSaveView(); }}
                                placeholder="Ex: Minha visão..."
                                className="flex-1 rounded-md border border-pf-grey/30 px-2.5 py-1.5 text-xs outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue"
                                autoFocus
                            />
                            <button
                                onClick={handleSaveView}
                                disabled={!saveName.trim()}
                                className="rounded-md bg-pf-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Separator */}
            <div className="h-5 w-px bg-pf-grey/15 mx-1" />

            {/* GERAR RELATORIO */}
            <button
                onClick={handleGenerateReport}
                className={`${btnBase} border-pf-blue bg-pf-blue text-white hover:bg-blue-700 hover:border-blue-700`}
            >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Gerar Relatório
            </button>
        </div>
    );
}

// ======================== DENSITY HELPER ========================

/** Returns Tailwind padding classes for table cells based on density */
export function getDensityClasses(density: Density) {
    switch (density) {
        case "compact":
            return { cell: "px-4 py-1.5", text: "text-[11px]" };
        case "comfortable":
            return { cell: "px-6 py-5", text: "text-sm" };
        default:
            return { cell: "px-6 py-3", text: "text-xs" };
    }
}
