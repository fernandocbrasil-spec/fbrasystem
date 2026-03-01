"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { Download, Search } from "lucide-react";

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "cliente", label: "Cliente / Descrição", defaultVisible: true },
    { key: "vencimento", label: "Vencimento", defaultVisible: true },
    { key: "banco", label: "Banco", defaultVisible: true },
    { key: "valor", label: "Valor Bruto", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
];

type ReceitaStatus = "A Receber" | "Recebido";

const statusStyle: Record<ReceitaStatus, string> = {
    "A Receber": "bg-orange-100 text-orange-800",
    "Recebido": "bg-green-100 text-green-800",
};

const receitas: {
    id: string;
    cliente: string;
    descricao: string;
    valor: string;
    vencimento: string;
    status: ReceitaStatus;
    banco: string;
}[] = [
    { id: "1", cliente: "Grupo Sequoia", descricao: "Honorários Mensais Fevereiro/26", valor: "R$ 13.045,51", vencimento: "10/03/2026", status: "A Receber", banco: "Itaú" },
    { id: "2", cliente: "TechCorp BR", descricao: "Planejamento Tributário - Parcela Única", valor: "R$ 45.000,00", vencimento: "15/03/2026", status: "A Receber", banco: "Itaú" },
    { id: "3", cliente: "Logística ABC", descricao: "Parecer Trabalhista", valor: "R$ 4.500,00", vencimento: "20/02/2026", status: "Recebido", banco: "BTG" },
];

const FILTER_DEFS: FilterDef[] = [
    { key: "status", label: "Status", options: [
        { value: "A Receber", label: "A Receber" },
        { value: "Recebido", label: "Recebido" },
    ]},
];

export default function FinanceiroPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(["cliente", "vencimento", "banco", "valor", "status"]);
    const [density, setDensity] = useState<Density>("compact");

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setStatusFilter(filters.status || []);
    };

    const filtered = receitas.filter((r) =>
        (search === "" || r.cliente.toLowerCase().includes(search.toLowerCase()) || r.descricao.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter.length === 0 || statusFilter.includes(r.status))
    );

    return (
        <div>
            <div className="sticky top-0 z-20 bg-[#F4F5F7] space-y-2 pb-3">
                <PageHeader
                    title="Financeiro e Cobrança"
                    subtitle="Gestão do Contas a Receber (AR) e Fluxo de Caixa do escritório."
                    actions={
                        <button
                            onClick={() => window.alert("Integração Pendente (Fase 6): Upload de Arquivo OFX.")}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-black px-4 py-2 font-sans text-xs font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm"
                        >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            Importar OFX/CSV
                        </button>
                    }
                />

                {/* KPIs */}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Saldo Projetado (Março)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 184.500</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">A Receber (30 dias)</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 68.200</p>
                    </div>
                    <div className="bg-white border border-pf-grey/20 rounded p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Inadimplência</p>
                        <p className="font-sans text-xl font-bold text-pf-black mt-1 leading-none">R$ 0,00</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Contas a Receber</span>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar cliente..."
                                aria-label="Buscar cliente"
                                className="h-8 w-48 rounded-md border border-pf-grey/20 pl-10 pr-4 text-sm font-sans outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                            />
                        </div>
                        <FilterDropdown
                            label="Status"
                            options={[
                                { value: "A Receber", label: "A Receber" },
                                { value: "Recebido", label: "Recebido" },
                            ]}
                            selected={statusFilter}
                            onChange={setStatusFilter}
                        />
                    </div>
                </div>

                {/* Report Toolbar */}
                <ReportToolbar
                    pageId="financeiro"
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

            {/* Lista agrupada */}
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("cliente") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider`}>Cliente / Descrição</th>}
                            {visibleColumns.includes("vencimento") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider`}>Vencimento</th>}
                            {visibleColumns.includes("banco") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider`}>Banco</th>}
                            {visibleColumns.includes("valor") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider text-right`}>Valor Bruto</th>}
                            {visibleColumns.includes("status") && <th className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} pb-2 font-semibold uppercase tracking-wider text-right`}>Status</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((rec) => (
                            <tr key={rec.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer">
                                {visibleColumns.includes("cliente") && <td className={`${getDensityClasses(density).cell}`}>
                                    <p className={`font-bold text-pf-black ${getDensityClasses(density).text}`}>{rec.cliente}</p>
                                    <p className={`${getDensityClasses(density).text} text-pf-grey mt-0.5 truncate max-w-[250px]`}>{rec.descricao}</p>
                                </td>}
                                {visibleColumns.includes("vencimento") && <td className={`${getDensityClasses(density).cell} font-mono ${getDensityClasses(density).text} font-semibold text-pf-black`}>{rec.vencimento}</td>}
                                {visibleColumns.includes("banco") && <td className={`${getDensityClasses(density).cell} text-pf-grey ${getDensityClasses(density).text} font-bold`}>{rec.banco}</td>}
                                {visibleColumns.includes("valor") && <td className={`${getDensityClasses(density).cell} ${getDensityClasses(density).text} text-right font-bold text-pf-black font-mono`}>{rec.valor}</td>}
                                {visibleColumns.includes("status") && <td className={`${getDensityClasses(density).cell} text-right`}>
                                    <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle[rec.status]}`}>{rec.status}</span>
                                </td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
