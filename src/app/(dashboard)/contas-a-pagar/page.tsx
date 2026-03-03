"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { ApprovalBadge } from "@/components/approval/approval-badge";
import { getPayables, createPayable } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Button, SearchInput } from "@/components/ui";
import { Plus, X } from "lucide-react";

import type { MockPayable } from "@/lib/mock-data";

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "fornecedor", label: "Fornecedor", defaultVisible: true },
    { key: "categoria", label: "Categoria", defaultVisible: true },
    { key: "vencimento", label: "Vencimento", defaultVisible: true },
    { key: "valor", label: "Valor", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
];

const CATEGORY_OPTIONS = [
    "Infraestrutura / Servidores",
    "Aluguel & Condominio",
    "Licencas de Software",
    "Assinaturas & Livros",
    "Treinamento & Capacitacao",
];

export default function ContasAPagarPage() {
    const { toast } = useToast();
    const [payables, setPayables] = useState<MockPayable[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["fornecedor", "categoria", "vencimento", "valor", "status"]);
    const [density, setDensity] = useState<Density>("compact");

    // New expense form state
    const [showForm, setShowForm] = useState(false);
    const [newFornecedor, setNewFornecedor] = useState("");
    const [newCategoria, setNewCategoria] = useState(CATEGORY_OPTIONS[0]);
    const [newValor, setNewValor] = useState("");
    const [newVencimento, setNewVencimento] = useState("");

    const loadPayables = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPayables();
            setPayables(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPayables();
    }, [loadPayables]);

    const densityClasses = getDensityClasses(density);

    const categoryOptions = Array.from(new Set(payables.map((d) => d.categoria))).map((cat) => ({
        value: cat,
        label: cat,
    }));

    const FILTER_DEFS: FilterDef[] = [
        { key: "categoria", label: "Categoria", options: categoryOptions },
    ];

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setCatFilter(filters.categoria || []);
    };

    const filtered = payables.filter((d) =>
        (search === "" || d.fornecedor.toLowerCase().includes(search.toLowerCase())) &&
        (catFilter.length === 0 || catFilter.includes(d.categoria))
    );

    // KPIs computed from state
    const totalPagar = payables
        .filter((d) => d.status === "Pendente" || d.status === "Agendado" || d.status === "Atrasado")
        .reduce((acc, d) => {
            const num = parseFloat(d.valor.replace("R$ ", "").replace(/\./g, "").replace(",", "."));
            return acc + (isNaN(num) ? 0 : num);
        }, 0);

    const pendingCount = payables.filter((d) => d.approvalStatus === "pendente").length;

    const atrasadoTotal = payables
        .filter((d) => d.status === "Atrasado")
        .reduce((acc, d) => {
            const num = parseFloat(d.valor.replace("R$ ", "").replace(/\./g, "").replace(",", "."));
            return acc + (isNaN(num) ? 0 : num);
        }, 0);

    const pagoTotal = payables
        .filter((d) => d.status === "Pago")
        .reduce((acc, d) => {
            const num = parseFloat(d.valor.replace("R$ ", "").replace(/\./g, "").replace(",", "."));
            return acc + (isNaN(num) ? 0 : num);
        }, 0);

    const formatBRL = (v: number) => {
        return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const handleAddExpense = async () => {
        if (!newFornecedor.trim()) {
            toast("Informe o nome do fornecedor.", "warning");
            return;
        }
        if (!newValor.trim()) {
            toast("Informe o valor da despesa.", "warning");
            return;
        }
        if (!newVencimento) {
            toast("Informe a data de vencimento.", "warning");
            return;
        }

        // Format date from yyyy-mm-dd to dd/mm/yyyy
        const [y, m, d] = newVencimento.split("-");
        const formattedDate = `${d}/${m}/${y}`;

        // Format value — ensure it starts with R$
        let formattedValue = newValor.trim();
        if (!formattedValue.startsWith("R$")) {
            formattedValue = `R$ ${formattedValue}`;
        }

        const result = await createPayable({
            fornecedor: newFornecedor.trim(),
            categoria: newCategoria,
            valor: formattedValue,
            vencimento: formattedDate,
        });

        if (!result.success) {
            toast(result.error ?? "Erro ao criar despesa.", "warning");
            return;
        }

        setNewFornecedor("");
        setNewValor("");
        setNewVencimento("");
        setNewCategoria(CATEGORY_OPTIONS[0]);
        setShowForm(false);
        toast("Despesa adicionada com sucesso.");
        loadPayables();
    };

    return (
        <div>
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Contas a Pagar (AP)"
                    subtitle="Gestao de despesas, infraestrutura e pagamentos da firma."
                    actions={
                        <Button variant="dark" icon={showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)}>
                            {showForm ? "Cancelar" : "Nova Despesa"}
                        </Button>
                    }
                />

                {/* Inline new expense form */}
                {showForm && (
                    <div className="rounded-lg border border-pf-blue/30 bg-white p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                        <h3 className="font-sans text-sm font-bold text-pf-black mb-4">Nova Despesa</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Fornecedor</label>
                                <input
                                    type="text"
                                    value={newFornecedor}
                                    onChange={(e) => setNewFornecedor(e.target.value)}
                                    placeholder="Nome do fornecedor"
                                    className="w-full border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Categoria</label>
                                <select
                                    value={newCategoria}
                                    onChange={(e) => setNewCategoria(e.target.value)}
                                    className="w-full border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded"
                                >
                                    {CATEGORY_OPTIONS.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Valor</label>
                                <input
                                    type="text"
                                    value={newValor}
                                    onChange={(e) => setNewValor(e.target.value)}
                                    placeholder="R$ 0,00"
                                    className="w-full border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Vencimento</label>
                                <input
                                    type="date"
                                    value={newVencimento}
                                    onChange={(e) => setNewVencimento(e.target.value)}
                                    className="w-full border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={handleAddExpense}>
                                Adicionar Despesa
                            </Button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Total a Pagar (Marco)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{formatBRL(totalPagar)}</p>
                        <p className="text-[9px] text-pf-grey mt-1">+5% vs Fevereiro</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Pend. Aprovacao</p>
                        <p className="font-sans text-xl font-bold text-orange-600 mt-1 leading-none">{pendingCount}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Aguardando socio</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Atrasados</p>
                        <p className="font-sans text-xl font-bold text-red-600 mt-1 leading-none">{formatBRL(atrasadoTotal)}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Requer atencao</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Pagos (Mes Atual)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">{formatBRL(pagoTotal)}</p>
                        <p className="text-[9px] text-pf-grey mt-1">Dentro do previsto</p>
                    </div>
                </div>
            </div>

            <div className="sticky top-0 z-20 bg-[#F4F5F7] py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Despesas do Periodo</span>
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Buscar fornecedor..."
                        aria-label="Buscar fornecedor"
                    />
                </div>

                <ReportToolbar
                    pageId="contas-a-pagar"
                    columns={TABLE_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    currentFilters={{ categoria: catFilter }}
                    filterDefs={FILTER_DEFS}
                    onApplyFilters={handleApplyFilters}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("fornecedor") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Fornecedor</th>}
                            {visibleColumns.includes("categoria") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Categoria</th>}
                            {visibleColumns.includes("vencimento") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Vencimento</th>}
                            {visibleColumns.includes("valor") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Valor</th>}
                            {visibleColumns.includes("status") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider text-right`}>Status</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length}>
                                    <EmptyState title="Nenhuma despesa encontrada" message="Limpe os filtros ou lance uma nova despesa." />
                                </td>
                            </tr>
                        ) : (
                            filtered.map((desp) => (
                                <tr key={desp.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer">
                                    {visibleColumns.includes("fornecedor") && <td className={`${densityClasses.cell} ${densityClasses.text} font-bold text-pf-black`}>{desp.fornecedor}</td>}
                                    {visibleColumns.includes("categoria") && <td className={`${densityClasses.cell}`}>
                                        <span className={`${densityClasses.text} font-bold uppercase tracking-wider text-pf-grey`}>{desp.categoria}</span>
                                    </td>}
                                    {visibleColumns.includes("vencimento") && <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-semibold text-pf-black`}>{desp.vencimento}</td>}
                                    {visibleColumns.includes("valor") && <td className={`${densityClasses.cell} ${densityClasses.text} text-right font-bold text-pf-black font-mono`}>{desp.valor}</td>}
                                    {visibleColumns.includes("status") && <td className={`${densityClasses.cell} text-right`}>
                                        <ApprovalBadge status={desp.approvalStatus} />
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
