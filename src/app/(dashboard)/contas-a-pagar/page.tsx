"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { ApprovalBadge } from "@/components/approval/approval-badge";
import { MOCK_PAYABLES } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast";
import { Plus, Search, X } from "lucide-react";

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
    const [payables, setPayables] = useState<MockPayable[]>([...MOCK_PAYABLES]);
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

    const handleAddExpense = () => {
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

        const newPayable: MockPayable = {
            id: `new-${Date.now()}`,
            fornecedor: newFornecedor.trim(),
            categoria: newCategoria,
            valor: formattedValue,
            vencimento: formattedDate,
            status: "Pendente",
            approvalStatus: "pendente",
            submittedBy: "Financeiro",
        };

        setPayables((prev) => [newPayable, ...prev]);
        setNewFornecedor("");
        setNewValor("");
        setNewVencimento("");
        setNewCategoria(CATEGORY_OPTIONS[0]);
        setShowForm(false);
        toast("Despesa adicionada com sucesso.");
    };

    return (
        <div>
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Contas a Pagar (AP)"
                    subtitle="Gestao de despesas, infraestrutura e pagamentos da firma."
                    actions={
                        <button
                            onClick={() => setShowForm((v) => !v)}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-black px-3 py-1.5 font-sans text-xs font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm"
                        >
                            {showForm ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                            {showForm ? "Cancelar" : "Nova Despesa"}
                        </button>
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
                            <button
                                onClick={handleAddExpense}
                                className="rounded-md bg-pf-blue px-6 py-2.5 font-sans text-sm font-bold text-white hover:bg-pf-black transition-all shadow-sm"
                            >
                                Adicionar Despesa
                            </button>
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
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar fornecedor..."
                            aria-label="Buscar fornecedor"
                            className="h-8 w-48 rounded-md border border-pf-grey/20 pl-10 pr-4 text-sm font-sans outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                        />
                    </div>
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
