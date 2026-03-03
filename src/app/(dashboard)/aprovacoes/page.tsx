"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { ApprovalDialog } from "@/components/approval/approval-dialog";
import { getPayables, getReceivables, getTimeEntries, getProposals } from "@/lib/actions";
import { type MockPayable, type MockReceivable, type MockTimeEntry, type MockProposal } from "@/lib/mock-data";
import { SearchInput } from "@/components/ui";
import { ShieldCheck, CreditCard, Receipt, Clock, FileText, ChevronRight, Check, X } from "lucide-react";

// ======================== HELPERS ========================

function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m.toString().padStart(2, "0")}`;
}

function parseValue(str: string): number {
    return parseFloat(
        str.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".")
    ) || 0;
}

function formatCurrency(value: number): string {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateISO(isoDate: string): string {
    const [y, m, d] = isoDate.split("-");
    if (!d) return isoDate;
    return `${d}/${m}/${y}`;
}

// ======================== CONSTANTS ========================

type GroupKey = "payables" | "receivables" | "timeEntries" | "proposals";

const ACTIVITY_COLORS: Record<string, string> = {
    reuniao: "bg-blue-100 text-blue-700",
    pesquisa: "bg-indigo-100 text-indigo-700",
    elaboracao: "bg-purple-100 text-purple-700",
    revisao: "bg-amber-100 text-amber-700",
    audiencia: "bg-red-100 text-red-700",
    administrativo: "bg-pf-grey/10 text-pf-grey",
};

const ACTIVITY_LABELS: Record<string, string> = {
    reuniao: "Reuniao",
    pesquisa: "Pesquisa",
    elaboracao: "Elaboracao",
    revisao: "Revisao",
    audiencia: "Audiencia",
    administrativo: "Adm.",
};

const ALL_COLUMNS: ColumnDef[] = [
    { key: "pay_fornecedor", label: "AP — Fornecedor", defaultVisible: true },
    { key: "pay_solicitante", label: "AP — Solicitante", defaultVisible: true },
    { key: "pay_vencimento", label: "AP — Vencimento", defaultVisible: true },
    { key: "pay_valor", label: "AP — Valor", defaultVisible: true },
    { key: "rec_tipo", label: "AR — Tipo", defaultVisible: true },
    { key: "rec_vencimento", label: "AR — Vencimento", defaultVisible: true },
    { key: "rec_valor", label: "AR — Valor Original", defaultVisible: true },
    { key: "rec_solicitado", label: "AR — Valor Solicitado", defaultVisible: true },
    { key: "te_atividade", label: "Horas — Atividade", defaultVisible: true },
    { key: "te_data", label: "Horas — Data", defaultVisible: true },
    { key: "te_descricao", label: "Horas — Descricao", defaultVisible: true },
    { key: "te_tipo", label: "Horas — Faturavel", defaultVisible: true },
    { key: "te_duracao", label: "Horas — Duracao", defaultVisible: true },
];

const FILTER_DEFS: FilterDef[] = [
    {
        key: "modulo",
        label: "Modulo",
        options: [
            { value: "payables", label: "Contas a Pagar" },
            { value: "receivables", label: "Financeiro — AR" },
            { value: "timeEntries", label: "Apontamento de Horas" },
            { value: "proposals", label: "Propostas" },
        ],
    },
];

// ======================== COMPONENT ========================

export default function AprovacoesConsolidadasPage() {
    // Data state
    const [payables, setPayables] = useState<MockPayable[]>([]);
    const [receivables, setReceivables] = useState<MockReceivable[]>([]);
    const [timeEntriesData, setTimeEntriesData] = useState<MockTimeEntry[]>([]);
    const [proposals, setProposals] = useState<MockProposal[]>([]);

    const loadData = useCallback(async () => {
        const [p, r, t, pr] = await Promise.all([getPayables(), getReceivables(), getTimeEntries(), getProposals()]);
        setPayables(p);
        setReceivables(r);
        setTimeEntriesData(t);
        setProposals(pr);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // UI state
    const [openGroups, setOpenGroups] = useState<Set<GroupKey>>(new Set(["payables", "receivables", "timeEntries", "proposals"]));
    const [rejectTarget, setRejectTarget] = useState<{ type: GroupKey; id: string; label: string } | null>(null);
    const [density, setDensity] = useState<Density>("compact");
    const [search, setSearch] = useState("");
    const [moduleFilter, setModuleFilter] = useState<Record<string, string[]>>({ modulo: [] });
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMNS.map((c) => c.key));

    // Derived — pending items
    const pendingPayables = payables.filter((p) => p.approvalStatus === "pendente");
    const pendingReceivables = receivables.filter((r) => r.approvalStatus === "desconto_solicitado" || r.approvalStatus === "baixa_solicitada");
    const pendingTimeEntries = timeEntriesData.filter((t) => t.approvalStatus === "pendente");
    const pendingProposals = proposals.filter((p) => p.status === "Em Revisao");

    // Search filtering
    const q = search.toLowerCase();
    const filteredPayables = pendingPayables.filter((p) =>
        q === "" || p.fornecedor.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)
    );
    const filteredReceivables = pendingReceivables.filter((r) =>
        q === "" || r.cliente.toLowerCase().includes(q) || r.descricao.toLowerCase().includes(q)
    );
    const filteredTimeEntries = pendingTimeEntries.filter((t) =>
        q === "" || (t.submittedBy ?? "").toLowerCase().includes(q) || t.clientName.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
    const filteredProposals = pendingProposals.filter((p) =>
        q === "" || p.client.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)
    );

    // Module filter
    const activeModules = moduleFilter.modulo ?? [];
    const showSection = (key: GroupKey) => activeModules.length === 0 || activeModules.includes(key);

    // Totals
    const totalPayablesValue = pendingPayables.reduce((sum, p) => sum + parseValue(p.valor), 0);
    const totalReceivablesValue = pendingReceivables.reduce((sum, r) => sum + parseValue(r.valor), 0);
    const totalReceivablesRequested = pendingReceivables.reduce((sum, r) => sum + (r.requestedValue ? parseValue(r.requestedValue) : 0), 0);
    const totalProposalsValue = pendingProposals.reduce((sum, p) => sum + parseValue(p.value), 0);
    const totalPendingMinutes = pendingTimeEntries.reduce((sum, t) => sum + t.durationMinutes, 0);
    const billableMinutes = pendingTimeEntries.filter((t) => t.isBillable).reduce((sum, t) => sum + t.durationMinutes, 0);
    const billableCount = pendingTimeEntries.filter((t) => t.isBillable).length;
    const totalPending = pendingPayables.length + pendingReceivables.length + pendingTimeEntries.length + pendingProposals.length;
    const totalFinancialExposure = totalPayablesValue + totalReceivablesValue + totalProposalsValue;

    // Density classes
    const dc = getDensityClasses(density);
    const thClass = `${dc.cell} ${dc.text} font-semibold uppercase tracking-wider text-pf-grey`;

    // Handlers
    const toggleGroup = (key: GroupKey) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const handleApprovePayable = (id: string) => {
        setPayables((prev) => prev.map((p) => p.id === id ? { ...p, approvalStatus: "aprovado" as const, approvedBy: "Jose Rafael Feiteiro", approvedAt: "01/03/2026" } : p));
    };

    const handleApproveReceivable = (id: string) => {
        setReceivables((prev) => prev.map((r) => r.id === id ? { ...r, approvalStatus: "aprovado" as const, approvedBy: "Jose Rafael Feiteiro", approvedAt: "01/03/2026" } : r));
    };

    const handleApproveTimeEntry = (id: string) => {
        setTimeEntriesData((prev) => prev.map((t) => t.id === id ? { ...t, approvalStatus: "aprovado" as const, approvedBy: "Jose Rafael Feiteiro", approvedAt: "01/03/2026" } : t));
    };

    const handleReject = (comment: string) => {
        if (!rejectTarget) return;
        const { type, id } = rejectTarget;
        if (type === "payables") {
            setPayables((prev) => prev.map((p) => p.id === id ? { ...p, approvalStatus: "rejeitado" as const, rejectionComment: comment } : p));
        } else if (type === "receivables") {
            setReceivables((prev) => prev.map((r) => r.id === id ? { ...r, approvalStatus: "rejeitado" as const, rejectionComment: comment } : r));
        } else if (type === "timeEntries") {
            setTimeEntriesData((prev) => prev.map((t) => t.id === id ? { ...t, approvalStatus: "rejeitado" as const, rejectionComment: comment } : t));
        }
        setRejectTarget(null);
    };

    // Column visibility helpers
    const col = (key: string) => visibleColumns.includes(key);

    return (
        <div>
            {/* ==================== HEADER ==================== */}
            <div className="space-y-2 pb-3">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-pf-blue" aria-hidden="true" />
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-pf-blue">
                        Visao do Socio
                    </span>
                </div>

                <PageHeader
                    title="Central de Aprovacoes"
                    subtitle="Relatorio consolidado de todas as aprovacoes pendentes do escritorio."
                />

                {/* KPI Strip */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Total Pendente</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{totalPending}</p>
                        <p className="font-mono text-[11px] text-pf-grey mt-1">{formatCurrency(totalFinancialExposure)}</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Contas a Pagar</p>
                        <p className="font-sans text-xl font-bold text-orange-600 mt-1 leading-none">{pendingPayables.length}</p>
                        <p className="font-mono text-[11px] text-pf-grey mt-1">{formatCurrency(totalPayablesValue)}</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Financeiro — AR</p>
                        <p className="font-sans text-xl font-bold text-orange-600 mt-1 leading-none">{pendingReceivables.length}</p>
                        <p className="font-mono text-[11px] text-pf-grey mt-1">{formatCurrency(totalReceivablesValue)}</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Horas Pendentes</p>
                        <p className="font-sans text-xl font-bold text-orange-600 mt-1 leading-none">{formatDuration(totalPendingMinutes)}</p>
                        <p className="text-[11px] text-pf-grey mt-1">{billableCount} faturave{billableCount === 1 ? "l" : "is"}</p>
                    </div>
                </div>
            </div>

            {/* ==================== STICKY TOOLBAR ==================== */}
            <div className="sticky top-0 z-20 bg-[#F4F5F7] py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Pendente de Aprovacao</span>
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Buscar fornecedor, cliente ou colaborador..."
                        aria-label="Buscar"
                        className="w-72"
                    />
                </div>
                <ReportToolbar
                    pageId="aprovacoes"
                    columns={ALL_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    filterDefs={FILTER_DEFS}
                    currentFilters={moduleFilter}
                    onApplyFilters={setModuleFilter}
                />
            </div>

            {/* ==================== EXPOSURE BANNER ==================== */}
            <div className="bg-pf-blue/5 border border-pf-blue/20 rounded-lg p-5 mt-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pf-blue mb-1">Exposicao Financeira Total</p>
                        <p className="font-mono text-2xl font-bold text-pf-black">{formatCurrency(totalFinancialExposure)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pf-grey mb-1">Horas Pendentes</p>
                        <p className="font-mono text-2xl font-bold text-pf-black">{formatDuration(totalPendingMinutes)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pf-grey mb-1">Itens para Revisao</p>
                        <p className="font-sans text-2xl font-bold text-pf-black">{totalPending}</p>
                    </div>
                </div>
            </div>

            {/* ==================== SECTIONS ==================== */}
            {totalPending === 0 ? (
                <EmptyState title="Nenhuma aprovacao pendente" message="Todas as aprovacoes foram processadas." />
            ) : (
                <div className="space-y-6">

                    {/* ====== CONTAS A PAGAR ====== */}
                    {showSection("payables") && filteredPayables.length > 0 && (
                        <div>
                            <button
                                onClick={() => toggleGroup("payables")}
                                className="w-full flex items-center gap-3 py-2.5 cursor-pointer select-none"
                            >
                                <ChevronRight className={`h-3.5 w-3.5 text-pf-grey/50 shrink-0 transition-transform duration-150 ${openGroups.has("payables") ? "rotate-90" : ""}`} aria-hidden="true" />
                                <CreditCard className="h-4 w-4 text-pf-blue" aria-hidden="true" />
                                <span className="text-xs font-bold uppercase tracking-[0.18em] text-pf-black">Contas a Pagar</span>
                                <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-bold">
                                    {filteredPayables.length}
                                </span>
                                <div className="flex-1 border-t border-pf-grey/20" />
                                <span className="font-mono text-xs font-bold text-pf-black">{formatCurrency(totalPayablesValue)}</span>
                            </button>

                            {openGroups.has("payables") && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left font-sans text-sm">
                                        <thead>
                                            <tr className="border-b border-pf-grey/20">
                                                <th className={thClass}>Fornecedor / Categoria</th>
                                                {col("pay_solicitante") && <th className={thClass}>Solicitado por</th>}
                                                {col("pay_vencimento") && <th className={`${thClass} text-center`}>Vencimento</th>}
                                                {col("pay_valor") && <th className={`${thClass} text-right`}>Valor</th>}
                                                <th className={`${thClass} text-right`}>Acao</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPayables.map((desp) => (
                                                <tr key={desp.id} className="border-b border-pf-grey/10 hover:bg-white transition-colors">
                                                    <td className={dc.cell}>
                                                        <Link href={`/contas-a-pagar/${desp.id}/aprovacao`} className={`font-bold text-pf-black ${dc.text} hover:text-pf-blue transition-colors`}>
                                                            {desp.fornecedor}
                                                        </Link>
                                                        <p className="text-[10px] text-pf-grey mt-0.5">{desp.categoria}</p>
                                                    </td>
                                                    {col("pay_solicitante") && (
                                                        <td className={`${dc.cell} ${dc.text} text-pf-grey`}>{desp.submittedBy ?? "—"}</td>
                                                    )}
                                                    {col("pay_vencimento") && (
                                                        <td className={`${dc.cell} font-mono ${dc.text} text-pf-black text-center`}>{desp.vencimento}</td>
                                                    )}
                                                    {col("pay_valor") && (
                                                        <td className={`${dc.cell} text-right font-mono font-bold text-pf-black ${dc.text}`}>{desp.valor}</td>
                                                    )}
                                                    <td className={`${dc.cell} text-right`}>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleApprovePayable(desp.id); }}
                                                                className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-green-700 transition-colors min-h-[32px]"
                                                            >
                                                                <Check className="h-3 w-3" aria-hidden="true" /> Aprovar
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setRejectTarget({ type: "payables", id: desp.id, label: `${desp.fornecedor} — ${desp.valor}` }); }}
                                                                className="inline-flex items-center gap-1.5 rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pf-grey hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors min-h-[32px]"
                                                            >
                                                                <X className="h-3 w-3" aria-hidden="true" /> Rejeitar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-pf-grey/20">
                                                <td className={`${dc.cell} text-[10px] font-bold uppercase tracking-wider text-pf-grey`} colSpan={col("pay_solicitante") && col("pay_vencimento") ? 3 : col("pay_solicitante") || col("pay_vencimento") ? 2 : 1}>
                                                    {filteredPayables.length} despesa{filteredPayables.length > 1 ? "s" : ""} pendente{filteredPayables.length > 1 ? "s" : ""}
                                                </td>
                                                {col("pay_valor") && (
                                                    <td className={`${dc.cell} text-right font-mono font-bold text-pf-black text-sm`}>
                                                        {formatCurrency(filteredPayables.reduce((s, p) => s + parseValue(p.valor), 0))}
                                                    </td>
                                                )}
                                                <td />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ====== FINANCEIRO (AR) ====== */}
                    {showSection("receivables") && filteredReceivables.length > 0 && (
                        <div>
                            <button
                                onClick={() => toggleGroup("receivables")}
                                className="w-full flex items-center gap-3 py-2.5 cursor-pointer select-none"
                            >
                                <ChevronRight className={`h-3.5 w-3.5 text-pf-grey/50 shrink-0 transition-transform duration-150 ${openGroups.has("receivables") ? "rotate-90" : ""}`} aria-hidden="true" />
                                <Receipt className="h-4 w-4 text-pf-blue" aria-hidden="true" />
                                <span className="text-xs font-bold uppercase tracking-[0.18em] text-pf-black">Financeiro — Descontos & Baixas</span>
                                <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-bold">
                                    {filteredReceivables.length}
                                </span>
                                <div className="flex-1 border-t border-pf-grey/20" />
                                <span className="font-mono text-xs font-bold text-pf-black">{formatCurrency(totalReceivablesValue)}</span>
                            </button>

                            {openGroups.has("receivables") && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left font-sans text-sm">
                                        <thead>
                                            <tr className="border-b border-pf-grey/20">
                                                <th className={thClass}>Cliente / Descricao</th>
                                                {col("rec_tipo") && <th className={`${thClass} text-center`}>Tipo</th>}
                                                {col("rec_vencimento") && <th className={`${thClass} text-center`}>Vencimento</th>}
                                                {col("rec_valor") && <th className={`${thClass} text-right`}>Valor Original</th>}
                                                {col("rec_solicitado") && <th className={`${thClass} text-right`}>Valor Solicitado</th>}
                                                <th className={`${thClass} text-right`}>Acao</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReceivables.map((rec) => {
                                                const isDesconto = rec.requestedAction === "desconto";
                                                return (
                                                    <tr key={rec.id} className="border-b border-pf-grey/10 hover:bg-white transition-colors">
                                                        <td className={dc.cell}>
                                                            <Link href={`/financeiro/${rec.id}/aprovacao`} className={`font-bold text-pf-black ${dc.text} hover:text-pf-blue transition-colors`}>
                                                                {rec.cliente}
                                                            </Link>
                                                            <p className="text-[10px] text-pf-grey mt-0.5 truncate max-w-[240px]">{rec.descricao}</p>
                                                            {rec.requestedReason && (
                                                                <p className="text-[10px] text-amber-700 mt-0.5 truncate max-w-[240px] italic" title={rec.requestedReason}>
                                                                    {rec.requestedReason}
                                                                </p>
                                                            )}
                                                        </td>
                                                        {col("rec_tipo") && (
                                                            <td className={`${dc.cell} text-center`}>
                                                                <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${isDesconto ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}`}>
                                                                    {isDesconto ? "Desconto" : "Baixa"}
                                                                </span>
                                                            </td>
                                                        )}
                                                        {col("rec_vencimento") && (
                                                            <td className={`${dc.cell} font-mono ${dc.text} text-pf-black text-center`}>{rec.vencimento}</td>
                                                        )}
                                                        {col("rec_valor") && (
                                                            <td className={`${dc.cell} text-right font-mono font-bold text-pf-black ${dc.text}`}>{rec.valor}</td>
                                                        )}
                                                        {col("rec_solicitado") && (
                                                            <td className={`${dc.cell} text-right font-mono font-bold text-pf-blue ${dc.text}`}>
                                                                {rec.requestedValue ?? "—"}
                                                            </td>
                                                        )}
                                                        <td className={`${dc.cell} text-right`}>
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleApproveReceivable(rec.id); }}
                                                                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-green-700 transition-colors min-h-[32px]"
                                                                >
                                                                    <Check className="h-3 w-3" aria-hidden="true" /> Aprovar
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setRejectTarget({ type: "receivables", id: rec.id, label: `${rec.cliente} — ${rec.valor}` }); }}
                                                                    className="inline-flex items-center gap-1.5 rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pf-grey hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors min-h-[32px]"
                                                                >
                                                                    <X className="h-3 w-3" aria-hidden="true" /> Rejeitar
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-pf-grey/20">
                                                <td className={`${dc.cell} text-[10px] font-bold uppercase tracking-wider text-pf-grey`} colSpan={1 + (col("rec_tipo") ? 1 : 0) + (col("rec_vencimento") ? 1 : 0)}>
                                                    {filteredReceivables.length} solicitac{filteredReceivables.length > 1 ? "oes" : "ao"} pendente{filteredReceivables.length > 1 ? "s" : ""}
                                                </td>
                                                {col("rec_valor") && (
                                                    <td className={`${dc.cell} text-right font-mono font-bold text-pf-black text-sm`}>
                                                        {formatCurrency(filteredReceivables.reduce((s, r) => s + parseValue(r.valor), 0))}
                                                    </td>
                                                )}
                                                {col("rec_solicitado") && (
                                                    <td className={`${dc.cell} text-right font-mono font-bold text-pf-blue text-sm`}>
                                                        {formatCurrency(filteredReceivables.reduce((s, r) => s + (r.requestedValue ? parseValue(r.requestedValue) : 0), 0))}
                                                    </td>
                                                )}
                                                <td />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ====== TIME TRACKING ====== */}
                    {showSection("timeEntries") && filteredTimeEntries.length > 0 && (
                        <div>
                            <button
                                onClick={() => toggleGroup("timeEntries")}
                                className="w-full flex items-center gap-3 py-2.5 cursor-pointer select-none"
                            >
                                <ChevronRight className={`h-3.5 w-3.5 text-pf-grey/50 shrink-0 transition-transform duration-150 ${openGroups.has("timeEntries") ? "rotate-90" : ""}`} aria-hidden="true" />
                                <Clock className="h-4 w-4 text-pf-blue" aria-hidden="true" />
                                <span className="text-xs font-bold uppercase tracking-[0.18em] text-pf-black">Apontamento de Horas</span>
                                <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-bold">
                                    {filteredTimeEntries.length}
                                </span>
                                <div className="flex-1 border-t border-pf-grey/20" />
                                <span className="font-mono text-xs font-bold text-pf-black">{formatDuration(totalPendingMinutes)}</span>
                            </button>

                            {openGroups.has("timeEntries") && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left font-sans text-sm">
                                        <thead>
                                            <tr className="border-b border-pf-grey/20">
                                                <th className={thClass}>Colaborador / Caso</th>
                                                {col("te_atividade") && <th className={`${thClass} text-center`}>Atividade</th>}
                                                {col("te_data") && <th className={`${thClass} text-center`}>Data</th>}
                                                {col("te_descricao") && <th className={thClass}>Descricao</th>}
                                                {col("te_tipo") && <th className={`${thClass} text-center`}>Tipo</th>}
                                                {col("te_duracao") && <th className={`${thClass} text-right`}>Duracao</th>}
                                                <th className={`${thClass} text-right`}>Acao</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTimeEntries.map((entry) => (
                                                <tr key={entry.id} className="border-b border-pf-grey/10 hover:bg-white transition-colors">
                                                    <td className={dc.cell}>
                                                        <Link href={`/time-tracking/${entry.id}/aprovacao`} className={`font-bold text-pf-black ${dc.text} hover:text-pf-blue transition-colors`}>
                                                            {entry.submittedBy ?? "—"}
                                                        </Link>
                                                        <p className="text-[10px] text-pf-grey mt-0.5">{entry.caseNumber} — {entry.clientName}</p>
                                                    </td>
                                                    {col("te_atividade") && (
                                                        <td className={`${dc.cell} text-center`}>
                                                            <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${ACTIVITY_COLORS[entry.activityType] ?? "bg-pf-grey/10 text-pf-grey"}`}>
                                                                {ACTIVITY_LABELS[entry.activityType] ?? entry.activityType}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {col("te_data") && (
                                                        <td className={`${dc.cell} font-mono ${dc.text} text-pf-black text-center`}>{formatDateISO(entry.date)}</td>
                                                    )}
                                                    {col("te_descricao") && (
                                                        <td className={`${dc.cell} ${dc.text} text-pf-grey max-w-[200px] truncate`} title={entry.description}>{entry.description}</td>
                                                    )}
                                                    {col("te_tipo") && (
                                                        <td className={`${dc.cell} text-center`}>
                                                            <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${entry.isBillable ? "bg-green-100 text-green-700" : "bg-pf-grey/10 text-pf-grey"}`}>
                                                                {entry.isBillable ? "Faturavel" : "Interno"}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {col("te_duracao") && (
                                                        <td className={`${dc.cell} text-right font-mono font-bold text-pf-black ${dc.text}`}>{formatDuration(entry.durationMinutes)}</td>
                                                    )}
                                                    <td className={`${dc.cell} text-right`}>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleApproveTimeEntry(entry.id); }}
                                                                className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-green-700 transition-colors min-h-[32px]"
                                                            >
                                                                <Check className="h-3 w-3" aria-hidden="true" /> Aprovar
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setRejectTarget({ type: "timeEntries", id: entry.id, label: `${entry.submittedBy} — ${entry.caseNumber} (${formatDuration(entry.durationMinutes)})` }); }}
                                                                className="inline-flex items-center gap-1.5 rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pf-grey hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors min-h-[32px]"
                                                            >
                                                                <X className="h-3 w-3" aria-hidden="true" /> Rejeitar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-pf-grey/20">
                                                <td className={`${dc.cell} text-[10px] font-bold uppercase tracking-wider text-pf-grey`} colSpan={1 + (col("te_atividade") ? 1 : 0) + (col("te_data") ? 1 : 0) + (col("te_descricao") ? 1 : 0) + (col("te_tipo") ? 1 : 0)}>
                                                    {filteredTimeEntries.length} apontamento{filteredTimeEntries.length > 1 ? "s" : ""}
                                                    {" · "}
                                                    <span className="text-green-700">{filteredTimeEntries.filter((t) => t.isBillable).length} faturave{filteredTimeEntries.filter((t) => t.isBillable).length === 1 ? "l" : "is"}</span>
                                                </td>
                                                {col("te_duracao") && (
                                                    <td className={`${dc.cell} text-right font-mono font-bold text-pf-black text-sm`}>
                                                        {formatDuration(filteredTimeEntries.reduce((s, t) => s + t.durationMinutes, 0))}
                                                    </td>
                                                )}
                                                <td />
                                            </tr>
                                            <tr>
                                                <td colSpan={99} className="px-4 pb-2 text-[9px] text-pf-grey">
                                                    Faturavel: {formatDuration(filteredTimeEntries.filter((t) => t.isBillable).reduce((s, t) => s + t.durationMinutes, 0))}
                                                    {" / "}
                                                    Interno: {formatDuration(filteredTimeEntries.filter((t) => !t.isBillable).reduce((s, t) => s + t.durationMinutes, 0))}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ====== PROPOSTAS ====== */}
                    {showSection("proposals") && filteredProposals.length > 0 && (
                        <div>
                            <button
                                onClick={() => toggleGroup("proposals")}
                                className="w-full flex items-center gap-3 py-2.5 cursor-pointer select-none"
                            >
                                <ChevronRight className={`h-3.5 w-3.5 text-pf-grey/50 shrink-0 transition-transform duration-150 ${openGroups.has("proposals") ? "rotate-90" : ""}`} aria-hidden="true" />
                                <FileText className="h-4 w-4 text-pf-blue" aria-hidden="true" />
                                <span className="text-xs font-bold uppercase tracking-[0.18em] text-pf-black">Propostas</span>
                                <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-bold">
                                    {filteredProposals.length}
                                </span>
                                <div className="flex-1 border-t border-pf-grey/20" />
                                <span className="font-mono text-xs font-bold text-pf-black">{formatCurrency(totalProposalsValue)}</span>
                            </button>

                            {openGroups.has("proposals") && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left font-sans text-sm">
                                        <thead>
                                            <tr className="border-b border-pf-grey/20">
                                                <th className={thClass}>Cliente / Proposta</th>
                                                <th className={`${thClass} text-center`}>Data</th>
                                                <th className={`${thClass} text-right`}>Valor</th>
                                                <th className={`${thClass} text-right`}>Acao</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProposals.map((prop) => (
                                                <tr key={prop.id} className="border-b border-pf-grey/10 hover:bg-white transition-colors">
                                                    <td className={dc.cell}>
                                                        <Link href={`/propostas/${prop.id}/aprovacao`} className={`font-bold text-pf-black ${dc.text} hover:text-pf-blue transition-colors`}>
                                                            {prop.client}
                                                        </Link>
                                                        <p className="text-[10px] text-pf-grey mt-0.5">{prop.title}</p>
                                                    </td>
                                                    <td className={`${dc.cell} font-mono ${dc.text} text-pf-grey text-center`}>{prop.date}</td>
                                                    <td className={`${dc.cell} text-right font-mono font-bold text-pf-black ${dc.text}`}>{prop.value}</td>
                                                    <td className={`${dc.cell} text-right`}>
                                                        <Link
                                                            href={`/propostas/${prop.id}/aprovacao`}
                                                            className="inline-flex items-center gap-1.5 rounded-md bg-pf-blue/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pf-blue hover:bg-pf-blue hover:text-white transition-all min-h-[32px]"
                                                        >
                                                            <FileText className="h-3 w-3" aria-hidden="true" /> Revisar
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-pf-grey/20">
                                                <td className={`${dc.cell} text-[10px] font-bold uppercase tracking-wider text-pf-grey`} colSpan={2}>
                                                    {filteredProposals.length} proposta{filteredProposals.length > 1 ? "s" : ""} aguardando revisao
                                                </td>
                                                <td className={`${dc.cell} text-right font-mono font-bold text-pf-black text-sm`}>
                                                    {formatCurrency(filteredProposals.reduce((s, p) => s + parseValue(p.value), 0))}
                                                </td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ==================== REJECTION DIALOG ==================== */}
            <ApprovalDialog
                isOpen={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                onConfirm={handleReject}
                entityLabel={rejectTarget?.label ?? ""}
            />
        </div>
    );
}
