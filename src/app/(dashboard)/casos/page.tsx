"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportToolbar, getDensityClasses, type ColumnDef, type Density, type FilterDef } from "@/components/ui/report-toolbar";
import { Search, MapPin, CalendarDays, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";

type CaseStatus = "Ativo" | "Em Pausa";

const cases: {
    id: string;
    number: string;
    client: string;
    title: string;
    area: string;
    responsible: string;
    status: CaseStatus;
    startDate: string;
}[] = [
    { id: "1", number: "CA-2026-001", client: "Grupo Sequoia", title: "Assessoria Contábil e Fiscal Contínua", area: "Tributário / Consultivo", responsible: "José Rafael Feiteiro", status: "Ativo", startDate: "01/03/2026" },
    { id: "2", number: "CA-2026-002", client: "TechCorp BR", title: "Planejamento Tributário 2026", area: "Tributário / Planejamento", responsible: "Carlos Oliveira", status: "Ativo", startDate: "25/02/2026" },
    { id: "3", number: "CA-2025-089", client: "Logística ABC", title: "Revisão de Passivo Trabalhista", area: "Trabalhista", responsible: "Ana Souza", status: "Em Pausa", startDate: "10/11/2025" },
];

const statusStyle: Record<CaseStatus, string> = {
    Ativo: "bg-green-100 text-green-700",
    "Em Pausa": "bg-orange-100 text-orange-700",
};

const TABLE_COLUMNS: ColumnDef[] = [
    { key: "numero", label: "Nº", defaultVisible: true },
    { key: "caso", label: "Caso / Cliente", defaultVisible: true },
    { key: "area", label: "Área", defaultVisible: true },
    { key: "responsavel", label: "Responsável", defaultVisible: true },
    { key: "inicio", label: "Início", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
];

const ALL_COLUMN_KEYS = TABLE_COLUMNS.map((c) => c.key);

export default function CasesPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [areaFilter, setAreaFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMN_KEYS);
    const [density, setDensity] = useState<Density>("compact");

    const densityClasses = getDensityClasses(density);

    const areaOptions = Array.from(new Set(cases.map((c) => c.area))).map((area) => ({
        value: area,
        label: area,
    }));

    const FILTER_DEFS: FilterDef[] = [
        { key: "area", label: "Área", options: areaOptions },
        { key: "status", label: "Status", options: [
            { value: "Ativo", label: "Ativo" },
            { value: "Em Pausa", label: "Em Pausa" },
        ]},
    ];

    const handleApplyFilters = (filters: Record<string, string[]>) => {
        setAreaFilter(filters.area || []);
        setStatusFilter(filters.status || []);
    };

    const filtered = cases.filter((c) =>
        (search === "" || c.title.toLowerCase().includes(search.toLowerCase()) || c.client.toLowerCase().includes(search.toLowerCase())) &&
        (areaFilter.length === 0 || areaFilter.includes(c.area)) &&
        (statusFilter.length === 0 || statusFilter.includes(c.status))
    );

    return (
        <div>
            {/* PageHeader scrolls with content */}
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Gestão de Casos"
                    subtitle="Visualize e acesse todos os projetos e casos ativos do escritório."
                />
            </div>

            {/* Sticky: only search + ReportToolbar */}
            <div className="sticky top-0 z-20 bg-[#F4F5F7] py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-pf-black">Todos os Casos</span>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar caso..."
                            aria-label="Buscar caso"
                            className="h-8 w-48 rounded-md border border-pf-grey/20 pl-10 pr-4 text-sm font-sans outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue bg-white"
                        />
                    </div>
                </div>

                <ReportToolbar
                    pageId="casos"
                    columns={TABLE_COLUMNS}
                    visibleColumns={visibleColumns}
                    onVisibleColumnsChange={setVisibleColumns}
                    density={density}
                    onDensityChange={setDensity}
                    currentFilters={{ area: areaFilter, status: statusFilter }}
                    filterDefs={FILTER_DEFS}
                    onApplyFilters={handleApplyFilters}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="text-pf-grey border-b border-pf-grey/20">
                            {visibleColumns.includes("numero") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Nº</th>}
                            {visibleColumns.includes("caso") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Caso / Cliente</th>}
                            {visibleColumns.includes("area") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Área</th>}
                            {visibleColumns.includes("responsavel") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Responsável</th>}
                            {visibleColumns.includes("inicio") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Início</th>}
                            {visibleColumns.includes("status") && <th className={`${densityClasses.cell} ${densityClasses.text} pb-2 font-semibold uppercase tracking-wider`}>Status</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length}>
                                    <EmptyState
                                        title="Nenhum caso encontrado"
                                        message="Limpe os filtros ou crie um novo caso."
                                    />
                                </td>
                            </tr>
                        ) : (
                            filtered.map((c) => (
                                <tr
                                    key={c.id}
                                    onClick={() => router.push(`/casos/${c.id}`)}
                                    className="border-b border-pf-grey/15 hover:bg-white transition-colors cursor-pointer"
                                >
                                    {visibleColumns.includes("numero") && <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-pf-grey`}>{c.number}</td>}
                                    {visibleColumns.includes("caso") && <td className={`${densityClasses.cell}`}>
                                        <p className={`font-bold text-pf-black ${densityClasses.text}`}>{c.title}</p>
                                        <p className={`${densityClasses.text} text-pf-grey mt-0.5`}>{c.client}</p>
                                    </td>}
                                    {visibleColumns.includes("area") && <td className={`${densityClasses.cell}`}>
                                        <span className={`flex items-center gap-1.5 ${densityClasses.text} text-pf-grey`}>
                                            <MapPin className="h-3.5 w-3.5 text-pf-blue/60 shrink-0" aria-hidden="true" />
                                            {c.area}
                                        </span>
                                    </td>}
                                    {visibleColumns.includes("responsavel") && <td className={`${densityClasses.cell}`}>
                                        <span className={`flex items-center gap-1.5 ${densityClasses.text} text-pf-black`}>
                                            <Briefcase className="h-3.5 w-3.5 text-pf-grey shrink-0" aria-hidden="true" />
                                            {c.responsible}
                                        </span>
                                    </td>}
                                    {visibleColumns.includes("inicio") && <td className={`${densityClasses.cell}`}>
                                        <span className={`flex items-center gap-1.5 ${densityClasses.text} text-pf-grey font-mono`}>
                                            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                            {c.startDate}
                                        </span>
                                    </td>}
                                    {visibleColumns.includes("status") && <td className={`${densityClasses.cell}`}>
                                        <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle[c.status]}`}>{c.status}</span>
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
