"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { useToast } from "@/components/ui/toast";
import { Button, SearchInput } from "@/components/ui";
import { Receipt, Calendar, CheckSquare, Loader2 } from "lucide-react";

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "mes", label: "Mes Ref.", defaultVisible: true },
    { key: "cliente", label: "Cliente / Caso", defaultVisible: true },
    { key: "modalidade", label: "Modalidade", defaultVisible: true },
    { key: "valor", label: "Valor Bruto", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
    { key: "acao", label: "Acao", defaultVisible: true },
];

type InvoiceStatus = "Pendente Aprovacao" | "Faturado" | "Rascunho";

type Invoice = {
    id: string;
    month: string;
    client: string;
    case: string;
    value: string;
    status: InvoiceStatus;
    type: string;
};

const INITIAL_INVOICES: Invoice[] = [
    { id: "1", month: "02/2026", client: "Grupo Sequoia", case: "Assessoria Contabil e Fiscal", value: "R$ 13.045,51", status: "Pendente Aprovacao", type: "Fixo Mensal" },
    { id: "2", month: "02/2026", client: "TechCorp BR", case: "Planejamento Tributario 2026", value: "R$ 45.000,00", status: "Faturado", type: "Exito / Unica" },
    { id: "3", month: "02/2026", client: "Industria Metal SP", case: "Consultoria Trabalhista HR", value: "R$ 8.540,00", status: "Rascunho", type: "Horas (Time & Material)" },
];

const statusStyle: Record<InvoiceStatus, string> = {
    "Pendente Aprovacao": "bg-orange-100 text-orange-700",
    Faturado: "bg-green-100 text-green-700",
    Rascunho: "bg-pf-grey/10 text-pf-grey",
};

const FILTER_DEFS: FilterDef[] = [
    { key: "modalidade", label: "Modalidade", options: [
        { value: "Fixo Mensal", label: "Fixo Mensal" },
        { value: "Exito / Unica", label: "Exito / Unica" },
        { value: "Horas (Time & Material)", label: "Horas" },
    ]},
];

const AVAILABLE_PERIODS = ["02/2026", "01/2026", "03/2026"];
const PERIOD_LABELS = ["Fev/2026", "Jan/2026", "Mar/2026"];

// Mock clients for the engine-generated invoice
const ENGINE_MOCK_CLIENTS = [
    { client: "Nexus Participacoes", case: "Consultoria Societaria", value: "R$ 18.500,00", type: "Fixo Mensal" },
    { client: "Grupo Beta S.A.", case: "Assessoria Tributaria", value: "R$ 7.200,00", type: "Fixo Mensal" },
    { client: "Solar Energia LTDA", case: "Compliance Fiscal Q1", value: "R$ 12.800,00", type: "Horas (Time & Material)" },
];

export default function BillingPage() {
    const { toast } = useToast();
    const [invoices, setInvoices] = useState<Invoice[]>([...INITIAL_INVOICES]);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["mes", "cliente", "modalidade", "valor", "status", "acao"]);
    const [density, setDensity] = useState<Density>("compact");
    const [periodIndex, setPeriodIndex] = useState(0);
    const [engineLoading, setEngineLoading] = useState(false);
    const [engineMockIndex, setEngineMockIndex] = useState(0);

    const densityClasses = getDensityClasses(density);

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setTypeFilter(filters.modalidade || []);
    };

    const filtered = invoices.filter((inv) =>
        (search === "" || inv.client.toLowerCase().includes(search.toLowerCase()) || inv.case.toLowerCase().includes(search.toLowerCase())) &&
        (typeFilter.length === 0 || typeFilter.includes(inv.type))
    );

    // KPIs computed from state
    const totalFaturar = invoices.reduce((acc, inv) => {
        const num = parseFloat(inv.value.replace("R$ ", "").replace(/\./g, "").replace(",", "."));
        return acc + (isNaN(num) ? 0 : num);
    }, 0);

    const preFaturasAbertas = invoices.filter((inv) => inv.status !== "Faturado").length;

    const ticketMedio = invoices.length > 0 ? totalFaturar / invoices.length : 0;

    const formatBRL = (v: number) => {
        return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Handlers
    const handleCyclePeriod = () => {
        setPeriodIndex((prev) => (prev + 1) % AVAILABLE_PERIODS.length);
    };

    const handleRunEngine = useCallback(() => {
        if (engineLoading) return;
        setEngineLoading(true);

        setTimeout(() => {
            const mockData = ENGINE_MOCK_CLIENTS[engineMockIndex % ENGINE_MOCK_CLIENTS.length];
            const newInvoice: Invoice = {
                id: `eng-${Date.now()}`,
                month: AVAILABLE_PERIODS[periodIndex],
                client: mockData.client,
                case: mockData.case,
                value: mockData.value,
                status: "Rascunho",
                type: mockData.type,
            };
            setInvoices((prev) => [...prev, newInvoice]);
            setEngineMockIndex((prev) => prev + 1);
            setEngineLoading(false);
            toast(`Pre-fatura gerada para ${mockData.client}.`);
        }, 1500);
    }, [engineLoading, engineMockIndex, periodIndex, toast]);

    const handleDownloadNFSE = (inv: Invoice) => {
        const content = [
            `NFS-e Simulada — PF Advogados`,
            `========================================`,
            `ID: ${inv.id}`,
            `Cliente: ${inv.client}`,
            `Caso: ${inv.case}`,
            `Competencia: ${inv.month}`,
            `Valor: ${inv.value}`,
            `Modalidade: ${inv.type}`,
            `Status: ${inv.status}`,
            `Data emissao: ${new Date().toLocaleDateString("pt-BR")}`,
            `========================================`,
            `Documento gerado para fins de demonstracao.`,
        ].join("\n");

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nfse-${inv.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast("NFS-e baixada com sucesso.");
    };

    const handleRevisar = (invId: string) => {
        setInvoices((prev) =>
            prev.map((inv) => {
                if (inv.id === invId && (inv.status === "Rascunho" || inv.status === "Pendente Aprovacao")) {
                    return { ...inv, status: "Faturado" as InvoiceStatus };
                }
                return inv;
            })
        );
        toast("Pre-fatura aprovada e marcada como Faturado.");
    };

    return (
        <div>
            {/* PageHeader + KPIs scroll with content */}
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Faturamento (Pre-Faturas)"
                    subtitle="Modulo de geracao e aprovacao de cobrancas baseadas nos contratos (Plans) ou Horas."
                    actions={
                        <Button variant="dark" icon={engineLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />} onClick={handleRunEngine} disabled={engineLoading}>
                            {engineLoading ? "Processando..." : `Rodar Engine de Fechamento (${PERIOD_LABELS[periodIndex].slice(0, 6)})`}
                        </Button>
                    }
                />

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Total a Faturar</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{formatBRL(totalFaturar)}</p>
                        <p className="text-[9px] text-green-600 font-semibold mt-1">+12% vs mes anterior</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Horas Apontadas</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">124h 30m</p>
                        <p className="text-[9px] text-orange-500 font-semibold mt-1">18h pendentes aprovacao</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Pre-Faturas Abertas</p>
                        <p className="font-sans text-xl font-bold text-pf-blue mt-1 leading-none">{preFaturasAbertas}</p>
                        <p className="text-[9px] text-pf-grey mt-1">{PERIOD_LABELS[periodIndex]}</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Ticket Medio</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{formatBRL(ticketMedio)}</p>
                    </div>
                </div>
            </div>

            {/* Sticky: only search + ReportToolbar */}
            <div className="sticky top-0 z-20 bg-[#F4F5F7] py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Pre-Faturas do Periodo</span>
                    <div className="flex gap-2">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClear={() => setSearch("")}
                            placeholder="Buscar cliente ou caso..."
                            aria-label="Buscar cliente ou caso"
                        />
                        <Button variant="secondary" icon={<Calendar className="h-4 w-4" />} onClick={handleCyclePeriod} className="h-8">
                            {PERIOD_LABELS[periodIndex]}
                        </Button>
                    </div>
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
                                        message="Limpe os filtros ou rode a engine de fechamento."
                                    />
                                </td>
                            </tr>
                        ) : (
                            filtered.map((inv) => (
                                <tr key={inv.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer">
                                    {visibleColumns.includes("mes") && <td className={`${densityClasses.cell} text-pf-grey font-mono ${densityClasses.text}`}>{inv.month}</td>}
                                    {visibleColumns.includes("cliente") && <td className={`${densityClasses.cell}`}>
                                        <p className={`font-bold text-pf-black ${densityClasses.text}`}>{inv.client}</p>
                                        <p className={`${densityClasses.text} text-pf-grey truncate max-w-[200px] mt-0.5`}>{inv.case}</p>
                                    </td>}
                                    {visibleColumns.includes("modalidade") && <td className={`${densityClasses.cell} text-pf-grey ${densityClasses.text} uppercase font-bold`}>{inv.type}</td>}
                                    {visibleColumns.includes("valor") && <td className={`${densityClasses.cell} ${densityClasses.text} text-right font-bold text-pf-black font-mono`}>{inv.value}</td>}
                                    {visibleColumns.includes("status") && <td className={`${densityClasses.cell}`}>
                                        <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle[inv.status]}`}>{inv.status}</span>
                                    </td>}
                                    {visibleColumns.includes("acao") && <td className={`${densityClasses.cell} text-right`}>
                                        {inv.status === "Faturado" ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownloadNFSE(inv); }}
                                                aria-label="Baixar NFS-e"
                                                className="rounded p-2 text-pf-blue hover:bg-pf-blue/10 transition-all font-bold text-xs"
                                            >
                                                NFS-E
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRevisar(inv.id); }}
                                                aria-label={`Revisar pre-fatura ${inv.client}`}
                                                className="flex items-center gap-1 rounded bg-pf-blue/10 px-2 py-1.5 text-xs font-bold text-pf-blue hover:bg-pf-blue hover:text-white transition-all"
                                            >
                                                <CheckSquare className="h-3 w-3" aria-hidden="true" />
                                                Revisar
                                            </button>
                                        )}
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
