"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { ApprovalBadge } from "@/components/approval/approval-badge";
import { getReceivables } from "@/lib/actions";
import { Button, SearchInput } from "@/components/ui";
import { Download } from "lucide-react";

import type { MockReceivable } from "@/lib/mock-data";

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "cliente", label: "Cliente / Descricao", defaultVisible: true },
    { key: "vencimento", label: "Vencimento", defaultVisible: true },
    { key: "banco", label: "Banco", defaultVisible: true },
    { key: "valor", label: "Valor Bruto", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
];

export default function FinanceiroPage() {
    const [receivables, setReceivables] = useState<MockReceivable[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["cliente", "vencimento", "banco", "valor", "status"]);
    const [density, setDensity] = useState<Density>("compact");

    const loadReceivables = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getReceivables();
            setReceivables(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReceivables();
    }, [loadReceivables]);

    const densityClasses = getDensityClasses(density);

    const filtered = receivables.filter((r) =>
        search === "" || r.cliente.toLowerCase().includes(search.toLowerCase()) || r.descricao.toLowerCase().includes(search.toLowerCase())
    );

    const pendingApprovalCount = receivables.filter(r => r.approvalStatus === "desconto_solicitado" || r.approvalStatus === "baixa_solicitada").length;

    return (
        <div>
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Financeiro e Cobranca"
                    subtitle="Gestao do Contas a Receber (AR) e Fluxo de Caixa do escritorio."
                    actions={
                        <Button variant="dark" icon={<Download className="h-4 w-4" />}>
                            Importar OFX/CSV
                        </Button>
                    }
                />

                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Saldo Projetado (Marco)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 184.500</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">A Receber (30 dias)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 68.200</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Pend. Aprovacao</p>
                        <p className="font-sans text-xl font-bold text-orange-600 mt-1 leading-none">{pendingApprovalCount}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Descontos/Baixas</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Inadimplencia</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 0,00</p>
                    </div>
                </div>
            </div>

            <div className="sticky top-0 z-20 bg-[#F4F5F7] py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Contas a Receber</span>
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Buscar cliente..."
                        aria-label="Buscar cliente"
                    />
                </div>

                <ReportToolbar
                    pageId="financeiro"
                    columns={TABLE_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    currentFilters={{}}
                    filterDefs={[]}
                    onApplyFilters={() => {}}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("cliente") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Cliente / Descricao</th>}
                            {visibleColumns.includes("vencimento") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Vencimento</th>}
                            {visibleColumns.includes("banco") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Banco</th>}
                            {visibleColumns.includes("valor") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Valor Bruto</th>}
                            {visibleColumns.includes("status") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Status</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length}>
                                    <EmptyState title="Nenhuma receita encontrada" message="Limpe os filtros ou registre uma nova receita." />
                                </td>
                            </tr>
                        ) : (
                            filtered.map((rec) => (
                                <tr key={rec.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer">
                                    {visibleColumns.includes("cliente") && <td className={`${densityClasses.cell}`}>
                                        <p className={`font-bold text-pf-black ${densityClasses.text}`}>{rec.cliente}</p>
                                        <p className={`${densityClasses.text} text-pf-grey mt-0.5 truncate max-w-[250px]`}>{rec.descricao}</p>
                                    </td>}
                                    {visibleColumns.includes("vencimento") && <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-semibold text-pf-black`}>{rec.vencimento}</td>}
                                    {visibleColumns.includes("banco") && <td className={`${densityClasses.cell} text-pf-grey ${densityClasses.text} font-bold`}>{rec.banco}</td>}
                                    {visibleColumns.includes("valor") && <td className={`${densityClasses.cell} ${densityClasses.text} text-right font-bold text-pf-black font-mono`}>{rec.valor}</td>}
                                    {visibleColumns.includes("status") && <td className={`${densityClasses.cell} text-right`}>
                                        <ApprovalBadge status={rec.approvalStatus} />
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
