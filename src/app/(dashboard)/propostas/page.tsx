"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { Button, SearchInput } from "@/components/ui";
import { Plus, FileEdit, Download, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { getProposals } from "@/lib/actions";
import type { MockProposal } from "@/lib/mock-data";

type ProposalStatus = "Em Revisao" | "Aprovada";

type Proposal = MockProposal;

const statusStyle: Record<ProposalStatus, string> = {
    "Em Revisao": "bg-orange-100 text-orange-700",
    "Aprovada": "bg-green-100 text-green-700",
};

const StatusIcon = ({ status }: { status: ProposalStatus }) =>
    status === "Aprovada" ? <CheckCircle className="h-3 w-3" aria-hidden="true" /> : <Clock className="h-3 w-3" aria-hidden="true" />;

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "titulo", label: "Título / Cliente", defaultVisible: true },
    { key: "data", label: "Data", defaultVisible: true },
    { key: "valor", label: "Valor Total", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
    { key: "acoes", label: "Ações", defaultVisible: true },
];

const ALL_COLUMN_KEYS = TABLE_COLUMNS.map((c) => c.key);

const FILTER_DEFS: FilterDef[] = [
    { key: "status", label: "Status", options: [
        { value: "Em Revisao", label: "Em Revisao" },
        { value: "Aprovada", label: "Aprovada" },
    ]},
];

function generateProposalBlob(proposal: Proposal): string {
    return [
        "===========================================",
        "        PF ADVOGADOS - PROPOSTA",
        "===========================================",
        "",
        `Proposta #${proposal.id}`,
        `Titulo: ${proposal.title}`,
        `Cliente: ${proposal.client}`,
        `Data: ${proposal.date}`,
        `Valor Total: ${proposal.value}`,
        `Status: ${proposal.status}`,
        "",
        "-------------------------------------------",
        "Escopo dos Servicos:",
        "  - Apuracao de estimativa mensal de IRPJ e CSLL",
        "  - Auxilio no planejamento tributario",
        "  - Equalizacao de resultados entre as empresas",
        "  - Revisao de operacoes intercompany",
        "",
        "-------------------------------------------",
        "Condicoes de Pagamento:",
        "  Parcela Mensal Fixa",
        "  Vencimento: todo dia 10",
        "",
        "===========================================",
        "  Documento gerado automaticamente pelo ERP",
        "         PF Advogados - " + new Date().toLocaleDateString("pt-BR"),
        "===========================================",
    ].join("\n");
}

function downloadBlob(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function ProposalsPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMN_KEYS);
    const [density, setDensity] = useState<Density>("compact");

    const loadData = useCallback(async () => {
        const result = await getProposals();
        setProposals(result);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const densityClasses = getDensityClasses(density);

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setStatusFilter(filters.status || []);
    };

    const handleEdit = (proposalId: string) => {
        toast("Editando proposta...", "info");
        router.push(`/propostas/nova?edit=${proposalId}`);
    };

    const handleDownloadPdf = (proposal: Proposal) => {
        const content = generateProposalBlob(proposal);
        downloadBlob(content, `proposta-${proposal.id}.txt`);
        toast("PDF gerado com sucesso", "success");
    };

    const handleConvertToCaso = (proposal: Proposal) => {
        const params = new URLSearchParams({
            fromProposal: proposal.id,
            client: proposal.client,
            title: proposal.title,
            value: proposal.value,
        });
        router.push(`/casos/novo?${params.toString()}`);
    };

    const filtered = proposals.filter((p) =>
        (search === "" || p.title.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter.length === 0 || statusFilter.includes(p.status))
    );

    return (
        <div>
            {/* PageHeader scrolls with content */}
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Propostas de Honorários"
                    subtitle="Gerenciamento e geração de propostas comerciais no padrão do escritório."
                    actions={
                        <Button icon={<Plus className="h-4 w-4" />} onClick={() => router.push("/propostas/nova")}>
                            Nova Proposta
                        </Button>
                    }
                />
            </div>

            {/* Sticky: only search + ReportToolbar */}
            <div className="sticky top-0 z-20 bg-[#F4F5F7] py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Todas as Propostas</span>
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Buscar proposta..."
                        aria-label="Buscar proposta"
                    />
                </div>

                <ReportToolbar
                    pageId="propostas"
                    columns={TABLE_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    currentFilters={{ status: statusFilter }}
                    filterDefs={FILTER_DEFS}
                    onApplyFilters={handleApplyFilters}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("titulo") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Título / Cliente</th>}
                            {visibleColumns.includes("data") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Data</th>}
                            {visibleColumns.includes("valor") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Valor Total</th>}
                            {visibleColumns.includes("status") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Status</th>}
                            {visibleColumns.includes("acoes") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length}>
                                    <EmptyState
                                        title="Nenhuma proposta encontrada"
                                        message="Limpe os filtros ou crie uma nova proposta."
                                    />
                                </td>
                            </tr>
                        ) : (
                            filtered.map((proposal) => (
                                <tr key={proposal.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer">
                                    {visibleColumns.includes("titulo") && <td className={`${densityClasses.cell}`}>
                                        <p className={`font-bold text-pf-black ${densityClasses.text}`}>{proposal.title}</p>
                                        <p className={`${densityClasses.text} text-pf-grey mt-0.5`}>{proposal.client}</p>
                                    </td>}
                                    {visibleColumns.includes("data") && <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-pf-grey`}>{proposal.date}</td>}
                                    {visibleColumns.includes("valor") && <td className={`${densityClasses.cell} ${densityClasses.text} font-bold text-pf-black font-mono text-right`}>{proposal.value}</td>}
                                    {visibleColumns.includes("status") && <td className={`${densityClasses.cell}`}>
                                        <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle[proposal.status]}`}>
                                            <StatusIcon status={proposal.status} />
                                            {proposal.status}
                                        </span>
                                    </td>}
                                    {visibleColumns.includes("acoes") && <td className={`${densityClasses.cell} text-right`}>
                                        <div className="flex items-center justify-end gap-1">
                                            {proposal.status === "Aprovada" && (
                                                <Button variant="ghost" size="sm" aria-label="Converter em Caso" onClick={() => handleConvertToCaso(proposal)} className="text-green-600 hover:text-green-800">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" aria-label="Editar proposta" onClick={() => handleEdit(proposal.id)}>
                                                <FileEdit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" aria-label="Baixar PDF" onClick={() => handleDownloadPdf(proposal)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
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
