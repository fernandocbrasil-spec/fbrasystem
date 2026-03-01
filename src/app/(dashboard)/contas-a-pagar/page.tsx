"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { Plus, Search } from "lucide-react";

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "fornecedor", label: "Fornecedor", defaultVisible: true },
    { key: "categoria", label: "Categoria", defaultVisible: true },
    { key: "vencimento", label: "Vencimento", defaultVisible: true },
    { key: "valor", label: "Valor", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
];

type DespesaStatus = "Pendente" | "Agendado" | "Atrasado" | "Pago";

const statusStyle: Record<DespesaStatus, string> = {
    Pago: "bg-green-100 text-green-800",
    Agendado: "bg-blue-100 text-blue-800",
    Atrasado: "bg-red-100 text-red-800",
    Pendente: "bg-orange-100 text-orange-800",
};

const despesas: { id: string; fornecedor: string; categoria: string; valor: string; vencimento: string; status: DespesaStatus }[] = [
    { id: "1", fornecedor: "Amazon Web Services (AWS)", categoria: "Infraestrutura / Servidores", valor: "R$ 1.250,00", vencimento: "05/03/2026", status: "Pendente" },
    { id: "2", fornecedor: "WeWork (Escritório SP)", categoria: "Aluguel & Condomínio", valor: "R$ 8.500,00", vencimento: "10/03/2026", status: "Agendado" },
    { id: "3", fornecedor: "Google Workspace", categoria: "Licenças de Software", valor: "R$ 850,00", vencimento: "01/03/2026", status: "Pago" },
    { id: "4", fornecedor: "Thomson Reuters (RT)", categoria: "Assinaturas & Livros", valor: "R$ 450,00", vencimento: "15/02/2026", status: "Atrasado" },
];

export default function ContasAPagarPage() {
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["fornecedor", "categoria", "vencimento", "valor", "status"]);
    const [density, setDensity] = useState<Density>("compact");

    const categoryOptions = Array.from(new Set(despesas.map((d) => d.categoria))).map((cat) => ({
        value: cat,
        label: cat,
    }));

    const FILTER_DEFS: FilterDef[] = [
        { key: "categoria", label: "Categoria", options: categoryOptions },
    ];

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setCatFilter(filters.categoria || []);
    };

    const filtered = despesas.filter((d) =>
        (search === "" || d.fornecedor.toLowerCase().includes(search.toLowerCase())) &&
        (catFilter.length === 0 || catFilter.includes(d.categoria))
    );

    return (
        <div>
            <div className="sticky top-0 z-20 bg-[#F4F5F7] space-y-2 pb-3">
                <PageHeader
                    title="Contas a Pagar (AP)"
                    subtitle="Gestão de despesas, infraestrutura e pagamentos da firma."
                    actions={
                        <button
                            onClick={() => window.alert("Modal: Formulário para lançar Nova Despesa.")}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-black px-4 py-2 font-sans text-xs font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Nova Despesa
                        </button>
                    }
                />

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Total a Pagar (Março)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 38.450</p>
                        <p className="text-[9px] text-pf-grey mt-1">+5% vs Fevereiro</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Vencendo Hoje</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 850</p>
                        <p className="text-[9px] text-pf-grey mt-1">1 boleto</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Atrasados</p>
                        <p className="font-sans text-xl font-bold text-red-600 mt-1 leading-none">R$ 450</p>
                        <p className="text-[9px] text-pf-grey mt-1">Requer atenção</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Pagos (Mês Atual)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 12.000</p>
                        <p className="text-[9px] text-pf-grey mt-1">Dentro do previsto</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Despesas do Período</span>
                    <div className="flex gap-2">
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
                        <FilterDropdown
                            label="Categorias"
                            options={categoryOptions}
                            selected={catFilter}
                            onChange={setCatFilter}
                        />
                    </div>
                </div>

                {/* Report Toolbar */}
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

            {/* Lista colapsável */}
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("fornecedor") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider`}>Fornecedor</th>}
                            {visibleColumns.includes("categoria") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider`}>Categoria</th>}
                            {visibleColumns.includes("vencimento") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider`}>Vencimento</th>}
                            {visibleColumns.includes("valor") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider text-right`}>Valor</th>}
                            {visibleColumns.includes("status") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider text-right`}>Status</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((desp) => (
                            <tr key={desp.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer">
                                {visibleColumns.includes("fornecedor") && <td className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} font-bold text-pf-black`}>{desp.fornecedor}</td>}
                                {visibleColumns.includes("categoria") && <td className={`${getDensityClasses(density).cell}`}>
                                    <span className={`${getDensityClasses(density).text} font-bold uppercase tracking-wider text-pf-grey`}>{desp.categoria}</span>
                                </td>}
                                {visibleColumns.includes("vencimento") && <td className={`${getDensityClasses(density).cell} font-mono ${getDensityClasses(density).text} font-semibold text-pf-black`}>{desp.vencimento}</td>}
                                {visibleColumns.includes("valor") && <td className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} text-right font-bold text-pf-black font-mono`}>{desp.valor}</td>}
                                {visibleColumns.includes("status") && <td className={`${getDensityClasses(density).cell} text-right`}>
                                    <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle[desp.status]}`}>{desp.status}</span>
                                </td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
