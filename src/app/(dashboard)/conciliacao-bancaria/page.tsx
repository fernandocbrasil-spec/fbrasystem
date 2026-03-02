"use client";

import { useState, useMemo, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { useToast } from "@/components/ui/toast";
import { MOCK_BANK_ENTRIES } from "@/lib/mock-data";
import type { MockBankEntry } from "@/lib/mock-data";
import { Landmark, Download, Search, Link2, CheckCircle2, Clock, Loader2 } from "lucide-react";

// ======================== HELPERS ========================

function formatCurrency(value: number): string {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

// ======================== CONSTANTS ========================

const SALDO_ANTERIOR = 132275.00;

const MONTHS = [
    { value: "2026-02", label: "Fevereiro 2026" },
    { value: "2026-01", label: "Janeiro 2026" },
    { value: "2025-12", label: "Dezembro 2025" },
];

const STATUS_FILTERS = [
    { value: "todas", label: "Todas" },
    { value: "conciliada", label: "Conciliadas" },
    { value: "pendente", label: "Pendentes" },
];

const ALL_COLUMNS: ColumnDef[] = [
    { key: "date", label: "Data" },
    { key: "description", label: "Descricao" },
    { key: "value", label: "Valor" },
    { key: "balance", label: "Saldo" },
    { key: "status", label: "Status" },
    { key: "action", label: "Acao" },
];

const FILTER_DEFS: FilterDef[] = [
    { key: "status", label: "Status", options: STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label })) },
];

// Mock entries generated on OFX import
function generateImportedEntries(existingCount: number, lastBalance: number): MockBankEntry[] {
    const entries: MockBankEntry[] = [
        {
            id: `bk-imp-${Date.now()}-1`,
            date: "2026-02-28",
            description: "PIX RECEBIDO — DISTRIBUIDORA ALFA LTDA",
            value: 6750.00,
            balance: lastBalance + 6750.00,
            reconciled: false,
        },
        {
            id: `bk-imp-${Date.now()}-2`,
            date: "2026-02-28",
            description: "DEB AUTOMATICO — SEGURO EMPRESARIAL PORTO",
            value: -1890.00,
            balance: lastBalance + 6750.00 - 1890.00,
            reconciled: false,
        },
        {
            id: `bk-imp-${Date.now()}-3`,
            date: "2026-02-28",
            description: "TED RECEBIDA — CONSULTORIA BETA SA",
            value: 12400.00,
            balance: lastBalance + 6750.00 - 1890.00 + 12400.00,
            reconciled: false,
        },
    ];
    return entries;
}

// ======================== COMPONENT ========================

export default function ConciliacaoBancariaPage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [bankEntries, setBankEntries] = useState<MockBankEntry[]>([...MOCK_BANK_ENTRIES]);
    const [importing, setImporting] = useState(false);

    const [density, setDensity] = useState<Density>("compact");
    const [search, setSearch] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("2026-02");
    const [statusFilter, setStatusFilter] = useState("todas");
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMNS.map((c) => c.key));
    const [reconciledIds, setReconciledIds] = useState<Set<string>>(new Set());

    const dc = getDensityClasses(density);

    // Handle OFX import
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);

        // Simulate processing delay
        setTimeout(() => {
            const lastEntry = bankEntries.filter((be) => be.date.startsWith(selectedMonth));
            const lastBalance = lastEntry.length > 0 ? lastEntry[lastEntry.length - 1].balance : SALDO_ANTERIOR;
            const newEntries = generateImportedEntries(bankEntries.length, lastBalance);

            setBankEntries((prev) => [...prev, ...newEntries]);
            setImporting(false);
            toast(`${newEntries.length} lancamentos importados com sucesso.`, "success");

            // Reset file input so the same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = "";
        }, 1500);
    };

    // Filter entries
    const entries = useMemo(() => {
        let filtered = bankEntries.filter((e) => e.date.startsWith(selectedMonth));

        if (statusFilter === "conciliada") {
            filtered = filtered.filter((e) => e.reconciled || reconciledIds.has(e.id));
        } else if (statusFilter === "pendente") {
            filtered = filtered.filter((e) => !e.reconciled && !reconciledIds.has(e.id));
        }

        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter((e) => e.description.toLowerCase().includes(q));
        }

        return filtered;
    }, [selectedMonth, statusFilter, search, reconciledIds, bankEntries]);

    // KPIs computed from state
    const allMonthEntries = bankEntries.filter((e) => e.date.startsWith(selectedMonth));
    const totalEntradas = allMonthEntries.filter((e) => e.value > 0).reduce((s, e) => s + e.value, 0);
    const totalSaidas = allMonthEntries.filter((e) => e.value < 0).reduce((s, e) => s + e.value, 0);
    const saldoFinal = allMonthEntries.length > 0 ? allMonthEntries[allMonthEntries.length - 1].balance : SALDO_ANTERIOR;
    const naoConciliadas = allMonthEntries.filter((e) => !e.reconciled && !reconciledIds.has(e.id)).length;

    const isCol = (key: string) => visibleColumns.includes(key);

    const handleReconcile = (id: string) => {
        setReconciledIds((prev) => new Set(prev).add(id));
    };

    return (
        <div className="space-y-4">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".ofx,.csv"
                className="hidden"
                onChange={handleFileSelected}
            />

            {/* Header */}
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">Tesouraria</span>
                </div>
                <PageHeader
                    title="Conciliacoes Bancarias"
                    subtitle="Banco do Brasil — Ag 1234 / CC 56789-0"
                    actions={
                        <button
                            onClick={handleImportClick}
                            disabled={importing}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-black px-3 py-1.5 font-sans text-xs font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {importing ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Download className="h-4 w-4" aria-hidden="true" />
                            )}
                            {importing ? "Importando..." : "Importar OFX"}
                        </button>
                    }
                />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Saldo Anterior</p>
                    <p className="font-sans text-xl font-bold text-pf-black mt-1">{formatCurrency(SALDO_ANTERIOR)}</p>
                </div>
                <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-green-500 p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Entradas</p>
                    <p className="font-sans text-xl font-bold text-green-600 mt-1">{formatCurrency(totalEntradas)}</p>
                </div>
                <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-red-500 p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Saidas</p>
                    <p className="font-sans text-xl font-bold text-red-600 mt-1">{formatCurrency(Math.abs(totalSaidas))}</p>
                </div>
                <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-black p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Saldo Atual</p>
                    <p className="font-sans text-xl font-bold text-pf-black mt-1">{formatCurrency(saldoFinal)}</p>
                </div>
                <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-amber-500 p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Nao Conciliadas</p>
                    <p className="font-sans text-xl font-bold text-amber-600 mt-1">{naoConciliadas}</p>
                    <p className="text-[10px] text-pf-grey mt-0.5">de {allMonthEntries.length} lancamentos</p>
                </div>
            </div>

            {/* Filters + Toolbar */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Period selector */}
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-xs font-bold text-pf-black outline-none"
                    >
                        {MONTHS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>

                    {/* Status filter */}
                    <div className="flex items-center gap-1">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setStatusFilter(f.value)}
                                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                                    statusFilter === f.value
                                        ? "bg-pf-blue text-white"
                                        : "bg-white border border-pf-grey/20 text-pf-grey hover:text-pf-black hover:border-pf-grey/40"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex items-center ml-auto">
                        <Search className="absolute left-2.5 h-3.5 w-3.5 text-pf-grey pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Buscar descricao..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-64 bg-white border border-pf-grey/20 pl-8 pr-3 py-1.5 text-xs text-pf-black placeholder:text-pf-grey/60 outline-none rounded-md"
                        />
                    </div>
                </div>

                <ReportToolbar
                    pageId="conciliacao-bancaria"
                    density={density}
                    onDensityChange={setDensity}
                    columns={ALL_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    filterDefs={FILTER_DEFS}
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-pf-black/10">
                            {isCol("date") && <th className={`${dc.cell} ${dc.text} text-left font-bold uppercase tracking-[0.15em] text-pf-grey`}>Data</th>}
                            {isCol("description") && <th className={`${dc.cell} ${dc.text} text-left font-bold uppercase tracking-[0.15em] text-pf-grey`}>Descricao</th>}
                            {isCol("value") && <th className={`${dc.cell} ${dc.text} text-right font-bold uppercase tracking-[0.15em] text-pf-grey`}>Valor</th>}
                            {isCol("balance") && <th className={`${dc.cell} ${dc.text} text-right font-bold uppercase tracking-[0.15em] text-pf-grey`}>Saldo</th>}
                            {isCol("status") && <th className={`${dc.cell} ${dc.text} text-center font-bold uppercase tracking-[0.15em] text-pf-grey`}>Status</th>}
                            {isCol("action") && <th className={`${dc.cell} ${dc.text} text-right font-bold uppercase tracking-[0.15em] text-pf-grey`}>Acao</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-xs text-pf-grey italic">
                                    Nenhum lancamento encontrado para os filtros selecionados.
                                </td>
                            </tr>
                        ) : (
                            entries.map((entry) => {
                                const isReconciled = entry.reconciled || reconciledIds.has(entry.id);
                                return (
                                    <tr
                                        key={entry.id}
                                        className="border-b border-pf-grey/10 hover:bg-white transition-colors"
                                    >
                                        {isCol("date") && (
                                            <td className={`${dc.cell} ${dc.text} font-mono text-pf-black whitespace-nowrap`}>
                                                {formatDate(entry.date)}
                                            </td>
                                        )}
                                        {isCol("description") && (
                                            <td className={`${dc.cell} ${dc.text} text-pf-black max-w-[300px] truncate`}>
                                                {entry.description}
                                            </td>
                                        )}
                                        {isCol("value") && (
                                            <td className={`${dc.cell} ${dc.text} text-right font-mono font-bold whitespace-nowrap ${
                                                entry.value > 0 ? "text-green-600" : "text-red-600"
                                            }`}>
                                                {entry.value > 0 ? "+" : ""}{formatCurrency(entry.value)}
                                            </td>
                                        )}
                                        {isCol("balance") && (
                                            <td className={`${dc.cell} ${dc.text} text-right font-mono text-pf-black whitespace-nowrap`}>
                                                {formatCurrency(entry.balance)}
                                            </td>
                                        )}
                                        {isCol("status") && (
                                            <td className={`${dc.cell} ${dc.text} text-center`}>
                                                {isReconciled ? (
                                                    <span className="inline-flex items-center gap-1 rounded-sm bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-green-700">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Conciliada
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-sm bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                                                        <Clock className="h-3 w-3" />
                                                        Pendente
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        {isCol("action") && (
                                            <td className={`${dc.cell} ${dc.text} text-right`}>
                                                {!isReconciled ? (
                                                    <button
                                                        onClick={() => handleReconcile(entry.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pf-black hover:border-pf-blue hover:text-pf-blue hover:bg-pf-blue/5 transition-colors"
                                                    >
                                                        <Link2 className="h-3 w-3" />
                                                        Conciliar
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-pf-grey italic">--</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-pf-black/10 bg-white">
                            {isCol("date") && <td className={`${dc.cell} ${dc.text} font-bold text-pf-black`}>{entries.length} lancamentos</td>}
                            {isCol("description") && <td className={dc.cell} />}
                            {isCol("value") && (
                                <td className={`${dc.cell} ${dc.text} text-right`}>
                                    <div className="font-mono font-bold text-green-600">{formatCurrency(entries.filter((e) => e.value > 0).reduce((s, e) => s + e.value, 0))}</div>
                                    <div className="font-mono font-bold text-red-600">{formatCurrency(entries.filter((e) => e.value < 0).reduce((s, e) => s + e.value, 0))}</div>
                                </td>
                            )}
                            {isCol("balance") && (
                                <td className={`${dc.cell} ${dc.text} text-right font-mono font-bold text-pf-black`}>
                                    {entries.length > 0 ? formatCurrency(entries[entries.length - 1].balance) : "--"}
                                </td>
                            )}
                            {isCol("status") && (
                                <td className={`${dc.cell} ${dc.text} text-center text-pf-grey`}>
                                    {entries.filter((e) => e.reconciled || reconciledIds.has(e.id)).length}/{entries.length}
                                </td>
                            )}
                            {isCol("action") && <td className={dc.cell} />}
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Period context */}
            <p className="text-[10px] text-pf-grey text-center py-2">
                Extrato referente a {MONTHS.find((m) => m.value === selectedMonth)?.label} · Conta Corrente 56789-0 · Banco do Brasil
            </p>
        </div>
    );
}
