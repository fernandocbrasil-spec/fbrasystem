"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { useToast } from "@/components/ui/toast";
import { Button, SearchInput } from "@/components/ui";
import { Receipt, Calendar, CheckSquare, Loader2, Send, X, Ban, FileText, ExternalLink, DollarSign, Hash } from "lucide-react";
import { getInvoices, generatePreInvoice, submitPreInvoice, approvePreInvoice, rejectPreInvoice, cancelPreInvoice, emitNFSeFromApprovedPreInvoice } from "@/lib/actions";
import { MOCK_CASE_OPTIONS, type MockInvoice } from "@/lib/mock-data";

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "mes", label: "Mes Ref.", defaultVisible: true },
    { key: "cliente", label: "Cliente / Caso", defaultVisible: true },
    { key: "modalidade", label: "Modalidade", defaultVisible: true },
    { key: "valor", label: "Valor Bruto", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
    { key: "acao", label: "Acao", defaultVisible: true },
];

const FILTER_DEFS: FilterDef[] = [
    { key: "modalidade", label: "Modalidade", options: [
        { value: "Fixo Mensal", label: "Fixo Mensal" },
        { value: "Exito", label: "Exito" },
        { value: "Hora Trabalhada", label: "Hora Trabalhada" },
        { value: "Hibrido", label: "Hibrido" },
    ]},
];

function getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatPeriodLabel(period: string): string {
    const [y, m] = period.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(m) - 1]}/${y}`;
}

export default function BillingPage() {
    const { toast } = useToast();
    const [invoices, setInvoices] = useState<MockInvoice[]>([]);
    const [search, setSearch] = useState("");

    const loadData = useCallback(async () => {
        const result = await getInvoices();
        setInvoices(result);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["mes", "cliente", "modalidade", "valor", "status", "acao"]);
    const [density, setDensity] = useState<Density>("compact");
    const [engineLoading, setEngineLoading] = useState(false);

    // Engine form state
    const [selectedCaseId, setSelectedCaseId] = useState(MOCK_CASE_OPTIONS[0]?.id ?? "");
    const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());

    // Reject modal state
    const [rejectModalId, setRejectModalId] = useState<string | null>(null);
    const [rejectComment, setRejectComment] = useState("");

    // NFSe emission state
    const [emittingId, setEmittingId] = useState<string | null>(null);
    const [nfseError, setNfseError] = useState<string | null>(null);

    const densityClasses = getDensityClasses(density);

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setTypeFilter(filters.modalidade || []);
    };

    const filtered = invoices.filter((inv) =>
        (search === "" || inv.client.toLowerCase().includes(search.toLowerCase()) || inv.caseName.toLowerCase().includes(search.toLowerCase())) &&
        (typeFilter.length === 0 || typeFilter.includes(inv.type))
    );

    // KPIs
    const totalFaturar = invoices.reduce((acc, inv) => {
        const num = parseFloat(inv.value.replace("R$ ", "").replace(/\./g, "").replace(",", "."));
        return acc + (isNaN(num) ? 0 : num);
    }, 0);

    const preFaturasAbertas = invoices.filter((inv) => inv.status !== "Faturado" && inv.status !== "Cancelado").length;
    const ticketMedio = invoices.length > 0 ? totalFaturar / invoices.length : 0;

    const formatBRL = (v: number) => {
        return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // ── Engine: generate pre-invoice via server action ──
    const handleRunEngine = async () => {
        if (engineLoading || !selectedCaseId) return;
        setEngineLoading(true);

        const result = await generatePreInvoice({
            caseId: selectedCaseId,
            period: selectedPeriod,
        });

        setEngineLoading(false);

        if (result.success) {
            toast(`Pre-fatura gerada: ${result.totalValue} (${result.entryCount} apontamentos).`);
            loadData();
        } else {
            toast(result.error ?? "Erro ao gerar pre-fatura", "warning");
        }
    };

    // ── Lifecycle actions ──
    const handleSubmit = async (id: string) => {
        const result = await submitPreInvoice(id);
        if (result.success) {
            toast("Pre-fatura enviada para aprovacao.");
            loadData();
        } else {
            toast(result.error ?? "Erro", "warning");
        }
    };

    const handleApprove = async (id: string) => {
        const result = await approvePreInvoice(id);
        if (result.success) {
            toast("Pre-fatura aprovada.");
            loadData();
        } else {
            toast(result.error ?? "Erro", "warning");
        }
    };

    const handleReject = async () => {
        if (!rejectModalId || !rejectComment.trim()) return;
        const result = await rejectPreInvoice(rejectModalId, rejectComment.trim());
        if (result.success) {
            toast("Pre-fatura rejeitada. Apontamentos desbloqueados.");
            setRejectModalId(null);
            setRejectComment("");
            loadData();
        } else {
            toast(result.error ?? "Erro", "warning");
        }
    };

    const handleCancel = async (id: string) => {
        const result = await cancelPreInvoice(id);
        if (result.success) {
            toast("Pre-fatura cancelada. Apontamentos desbloqueados.");
            loadData();
        } else {
            toast(result.error ?? "Erro", "warning");
        }
    };

    const handleEmitNFSe = async (id: string) => {
        setEmittingId(id);
        setNfseError(null);
        const result = await emitNFSeFromApprovedPreInvoice(id);
        setEmittingId(null);
        if (result.success) {
            toast(`NFS-e emitida: ${result.nfseNumber}`);
            loadData();
        } else {
            setNfseError(result.error ?? "Erro ao emitir NFS-e");
            toast(result.error ?? "Erro ao emitir NFS-e", "warning");
        }
    };

    return (
        <PageShell>
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Faturamento (Pre-Faturas)"
                    subtitle="Modulo de geracao e aprovacao de cobrancas baseadas nos contratos (Plans) ou Horas."
                />

                {/* Engine Controls */}
                <div className="bg-white border border-pf-grey/20 rounded p-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Caso</label>
                        <select
                            value={selectedCaseId}
                            onChange={(e) => setSelectedCaseId(e.target.value)}
                            className="w-full h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                        >
                            {MOCK_CASE_OPTIONS.map((c) => (
                                <option key={c.id} value={c.id}>{c.number} -- {c.client}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-40">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Periodo</label>
                        <input
                            type="month"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="w-full h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                        />
                    </div>
                    <Button
                        variant="dark"
                        icon={engineLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                        onClick={handleRunEngine}
                        disabled={engineLoading}
                        className="h-8"
                    >
                        {engineLoading ? "Gerando..." : `Gerar Pre-Fatura (${formatPeriodLabel(selectedPeriod)})`}
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <KpiCard
                        label="Total a Faturar"
                        value={formatBRL(totalFaturar)}
                        icon={DollarSign}
                        accentColor="border-l-pf-blue"
                    />
                    <KpiCard
                        label="Pre-Faturas Abertas"
                        value={String(preFaturasAbertas)}
                        icon={FileText}
                        iconColor="text-pf-blue"
                    />
                    <KpiCard
                        label="Ticket Medio"
                        value={formatBRL(ticketMedio)}
                        icon={Receipt}
                    />
                    <KpiCard
                        label="Pre-Faturas Total"
                        value={String(invoices.length)}
                        icon={Hash}
                    />
                </div>
            </div>

            {/* Reject Modal */}
            <Modal
                isOpen={!!rejectModalId}
                onClose={() => { setRejectModalId(null); setRejectComment(""); }}
                title="Rejeitar Pre-Fatura"
                footer={
                    <>
                        <Button variant="secondary" size="sm" onClick={() => { setRejectModalId(null); setRejectComment(""); }}>Cancelar</Button>
                        <button
                            onClick={handleReject}
                            disabled={!rejectComment.trim()}
                            className="rounded bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            Rejeitar
                        </button>
                    </>
                }
            >
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Motivo da Rejeicao</label>
                    <textarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        placeholder="Informe o motivo..."
                        className="w-full border border-pf-grey/20 rounded p-3 text-sm outline-none focus:border-pf-blue h-24 resize-none"
                    />
                </div>
            </Modal>

            {/* NFSe Error Banner */}
            {nfseError && (
                <ErrorBanner message={nfseError} onDismiss={() => setNfseError(null)} />
            )}

            {/* Sticky: search + ReportToolbar */}
            <div className="sticky top-0 z-20 bg-background py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Pre-Faturas</span>
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Buscar cliente ou caso..."
                        aria-label="Buscar cliente ou caso"
                    />
                </div>

                <ReportToolbar
                    pageId="faturamento"
                    columns={TABLE_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    currentFilters={{ modalidade: typeFilter }}
                    filterDefs={FILTER_DEFS}
                    onApplyFilters={handleApplyFilters}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("mes") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Mes Ref.</th>}
                            {visibleColumns.includes("cliente") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Cliente / Caso</th>}
                            {visibleColumns.includes("modalidade") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Modalidade</th>}
                            {visibleColumns.includes("valor") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Valor Bruto</th>}
                            {visibleColumns.includes("status") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Status</th>}
                            {visibleColumns.includes("acao") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Acao</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length}>
                                    <EmptyState
                                        title="Nenhuma pre-fatura encontrada"
                                        message="Limpe os filtros ou gere uma pre-fatura acima."
                                    />
                                </td>
                            </tr>
                        ) : (
                            filtered.map((inv) => (
                                <tr key={inv.id} className="border-b border-pf-grey/10 hover:bg-white transition-colors">
                                    {visibleColumns.includes("mes") && <td className={`${densityClasses.cell} text-pf-grey font-mono ${densityClasses.text}`}>{inv.month}</td>}
                                    {visibleColumns.includes("cliente") && <td className={`${densityClasses.cell}`}>
                                        <p className={`font-bold text-pf-black ${densityClasses.text}`}>{inv.client}</p>
                                        <p className={`${densityClasses.text} text-pf-grey truncate max-w-[200px] mt-0.5`}>{inv.caseName}</p>
                                    </td>}
                                    {visibleColumns.includes("modalidade") && <td className={`${densityClasses.cell} text-pf-grey ${densityClasses.text} uppercase font-bold`}>{inv.type}</td>}
                                    {visibleColumns.includes("valor") && <td className={`${densityClasses.cell} ${densityClasses.text} text-right font-bold text-pf-black font-mono`}>{inv.value}</td>}
                                    {visibleColumns.includes("status") && <td className={`${densityClasses.cell}`}>
                                        <StatusBadge status={inv.status} />
                                    </td>}
                                    {visibleColumns.includes("acao") && <td className={`${densityClasses.cell} text-right`}>
                                        <div className="flex items-center justify-end gap-1">
                                            {inv.status === "Rascunho" && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSubmit(inv.id); }}
                                                        title="Enviar para Aprovacao"
                                                        className="flex items-center gap-1 rounded bg-pf-blue/10 px-2 py-1.5 text-xs font-bold text-pf-blue hover:bg-pf-blue hover:text-white transition-all"
                                                    >
                                                        <Send className="h-3 w-3" />
                                                        Enviar
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCancel(inv.id); }}
                                                        title="Cancelar"
                                                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                                                    >
                                                        <Ban size={12} className="text-red-400" />
                                                    </button>
                                                </>
                                            )}
                                            {inv.status === "Pendente Aprovacao" && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleApprove(inv.id); }}
                                                        title="Aprovar"
                                                        className="flex items-center gap-1 rounded bg-green-100 px-2 py-1.5 text-xs font-bold text-green-700 hover:bg-green-600 hover:text-white transition-all"
                                                    >
                                                        <CheckSquare className="h-3 w-3" />
                                                        Aprovar
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setRejectModalId(inv.id); }}
                                                        title="Rejeitar"
                                                        className="flex items-center gap-1 rounded bg-red-100 px-2 py-1.5 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white transition-all"
                                                    >
                                                        <X className="h-3 w-3" />
                                                        Rejeitar
                                                    </button>
                                                </>
                                            )}
                                            {inv.status === "Aprovado" && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEmitNFSe(inv.id); }}
                                                    disabled={emittingId === inv.id}
                                                    title="Emitir NFS-e"
                                                    className="flex items-center gap-1 rounded bg-indigo-100 px-2 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                                                >
                                                    {emittingId === inv.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <FileText className="h-3 w-3" />
                                                    )}
                                                    Emitir NFS-e
                                                </button>
                                            )}
                                            {inv.status === "Faturado" && (
                                                <div className="flex items-center gap-2">
                                                    {inv.nfseNumber && (
                                                        <span className="inline-flex items-center rounded-sm bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 font-mono">
                                                            {inv.nfseNumber}
                                                        </span>
                                                    )}
                                                    {inv.nfsePdfUrl && (
                                                        <a
                                                            href={inv.nfsePdfUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center gap-1 rounded text-xs font-bold text-pf-blue hover:underline"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            PDF
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </PageShell>
    );
}
