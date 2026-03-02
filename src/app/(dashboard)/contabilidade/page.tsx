"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { BookOpen, FileSpreadsheet, List, TrendingUp, ChevronDown } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  KPIs                                                               */
/* ------------------------------------------------------------------ */

const kpis = [
    { label: "Ativo Total", value: "R$ 1.245.000" },
    { label: "Passivo Total", value: "R$ 387.000" },
    { label: "Patrimonio Liquido", value: "R$ 858.000" },
    { label: "Resultado Acumulado", value: "R$ 485.920" },
] as const;

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

const TABS = [
    { id: "balancete", label: "Balancete", icon: FileSpreadsheet },
    { id: "razao", label: "Razao Contabil", icon: List },
    { id: "dre", label: "DRE", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ------------------------------------------------------------------ */
/*  Mock data — Balancete                                              */
/* ------------------------------------------------------------------ */

const balanceteData = [
    { codigo: "1.1.01", conta: "Caixa e Equivalentes", debito: "R$ 245.000", credito: "R$ 0", saldo: "R$ 245.000" },
    { codigo: "1.1.02", conta: "Contas a Receber", debito: "R$ 380.000", credito: "R$ 52.000", saldo: "R$ 328.000" },
    { codigo: "1.2.01", conta: "Imobilizado", debito: "R$ 672.000", credito: "R$ 0", saldo: "R$ 672.000" },
    { codigo: "2.1.01", conta: "Fornecedores", debito: "R$ 0", credito: "R$ 124.000", saldo: "-R$ 124.000" },
    { codigo: "2.1.02", conta: "Obrigacoes Trabalhistas", debito: "R$ 0", credito: "R$ 187.000", saldo: "-R$ 187.000" },
    { codigo: "2.1.03", conta: "Impostos a Recolher", debito: "R$ 0", credito: "R$ 76.000", saldo: "-R$ 76.000" },
] as const;

/* ------------------------------------------------------------------ */
/*  Mock data — Razao Contabil                                         */
/* ------------------------------------------------------------------ */

type RazaoEntry = {
    data: string;
    conta: string;
    descricao: string;
    debito: string;
    credito: string;
};

const razaoDataByPeriod: Record<string, RazaoEntry[]> = {
    "2026-01": [
        { data: "02/01/2026", conta: "1.1.01 Caixa", descricao: "Recebimento honorarios - Grupo Sequoia", debito: "R$ 45.000", credito: "" },
        { data: "05/01/2026", conta: "2.1.01 Fornecedores", descricao: "Pagamento aluguel escritorio", debito: "", credito: "R$ 12.500" },
        { data: "10/01/2026", conta: "1.1.02 Contas a Receber", descricao: "Faturamento TechCorp BR", debito: "R$ 32.000", credito: "" },
        { data: "15/01/2026", conta: "2.1.02 Obrig. Trabalhistas", descricao: "Folha de pagamento Jan/26", debito: "", credito: "R$ 67.800" },
        { data: "20/01/2026", conta: "1.1.01 Caixa", descricao: "Recebimento Industria Metal SP", debito: "R$ 14.000", credito: "" },
        { data: "31/01/2026", conta: "2.1.03 Impostos", descricao: "ISS + PIS/COFINS competencia Jan/26", debito: "", credito: "R$ 28.700" },
    ],
    "2026-02": [
        { data: "03/02/2026", conta: "1.1.01 Caixa", descricao: "Recebimento honorarios - Construtora Horizonte", debito: "R$ 26.000", credito: "" },
        { data: "07/02/2026", conta: "2.1.01 Fornecedores", descricao: "Pagamento software juridico", debito: "", credito: "R$ 4.200" },
        { data: "12/02/2026", conta: "1.1.02 Contas a Receber", descricao: "Faturamento Logistica Express", debito: "R$ 18.700", credito: "" },
        { data: "15/02/2026", conta: "2.1.02 Obrig. Trabalhistas", descricao: "Folha de pagamento Fev/26", debito: "", credito: "R$ 67.800" },
        { data: "22/02/2026", conta: "1.1.01 Caixa", descricao: "Recebimento Farmaceutica Vida", debito: "R$ 21.300", credito: "" },
        { data: "28/02/2026", conta: "2.1.03 Impostos", descricao: "ISS + PIS/COFINS competencia Fev/26", debito: "", credito: "R$ 29.100" },
    ],
    "2026-03": [
        { data: "02/03/2026", conta: "1.1.01 Caixa", descricao: "Recebimento honorarios - Grupo Sequoia", debito: "R$ 45.000", credito: "" },
        { data: "05/03/2026", conta: "2.1.01 Fornecedores", descricao: "Pagamento aluguel escritorio", debito: "", credito: "R$ 12.500" },
        { data: "10/03/2026", conta: "1.1.02 Contas a Receber", descricao: "Faturamento TechCorp BR", debito: "R$ 33.500", credito: "" },
        { data: "15/03/2026", conta: "2.1.02 Obrig. Trabalhistas", descricao: "Folha de pagamento Mar/26", debito: "", credito: "R$ 68.200" },
        { data: "20/03/2026", conta: "1.1.01 Caixa", descricao: "Recebimento Auto Pecas Nacional", debito: "R$ 12.700", credito: "" },
        { data: "31/03/2026", conta: "2.1.03 Impostos", descricao: "ISS + PIS/COFINS competencia Mar/26", debito: "", credito: "R$ 28.200" },
    ],
};

/* ------------------------------------------------------------------ */
/*  Mock data — DRE                                                    */
/* ------------------------------------------------------------------ */

type DreRow = {
    label: string;
    value: string;
    level: number;
    bold?: boolean;
    negative?: boolean;
    highlight?: boolean;
};

const dreData: DreRow[] = [
    { label: "Receita Bruta de Servicos", value: "R$ 820.000", level: 0, bold: true },
    { label: "(-) Deducoes sobre Receita", value: "-R$ 86.100", level: 1, negative: true },
    { label: "ISS", value: "-R$ 41.000", level: 2, negative: true },
    { label: "PIS/COFINS", value: "-R$ 30.100", level: 2, negative: true },
    { label: "Outras Deducoes", value: "-R$ 15.000", level: 2, negative: true },
    { label: "(=) Receita Liquida", value: "R$ 733.900", level: 0, bold: true, highlight: true },
    { label: "(-) Custos dos Servicos Prestados", value: "-R$ 247.980", level: 1, negative: true },
    { label: "Salarios e Encargos", value: "-R$ 178.000", level: 2, negative: true },
    { label: "Servicos de Terceiros", value: "-R$ 42.980", level: 2, negative: true },
    { label: "Outros Custos Diretos", value: "-R$ 27.000", level: 2, negative: true },
    { label: "(=) Lucro Bruto", value: "R$ 485.920", level: 0, bold: true, highlight: true },
    { label: "(-) Despesas Operacionais", value: "-R$ 128.400", level: 1, negative: true },
    { label: "Despesas Administrativas", value: "-R$ 62.000", level: 2, negative: true },
    { label: "Despesas com Marketing", value: "-R$ 18.400", level: 2, negative: true },
    { label: "Depreciacoes e Amortizacoes", value: "-R$ 32.000", level: 2, negative: true },
    { label: "Outras Despesas", value: "-R$ 16.000", level: 2, negative: true },
    { label: "(=) Resultado Operacional", value: "R$ 357.520", level: 0, bold: true, highlight: true },
    { label: "(+/-) Resultado Financeiro", value: "R$ 14.200", level: 1 },
    { label: "Receitas Financeiras", value: "R$ 22.800", level: 2 },
    { label: "Despesas Financeiras", value: "-R$ 8.600", level: 2, negative: true },
    { label: "(=) Resultado Antes do IR/CS", value: "R$ 371.720", level: 0, bold: true, highlight: true },
    { label: "(-) IR e Contribuicao Social", value: "-R$ 55.758", level: 1, negative: true },
    { label: "(=) Resultado Liquido do Exercicio", value: "R$ 315.962", level: 0, bold: true, highlight: true },
];

/* ------------------------------------------------------------------ */
/*  Period options                                                     */
/* ------------------------------------------------------------------ */

const periods = [
    { value: "2026-01", label: "Jan/2026" },
    { value: "2026-02", label: "Fev/2026" },
    { value: "2026-03", label: "Mar/2026" },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ContabilidadePage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabId>("balancete");
    const [period, setPeriod] = useState("2026-03");

    const handlePeriodChange = (newPeriod: string) => {
        setPeriod(newPeriod);
        const label = periods.find((p) => p.value === newPeriod)?.label ?? newPeriod;
        toast(`Periodo alterado para ${label}`, "info");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">
                        Fiscal e Contabilidade
                    </span>
                </div>
                <PageHeader
                    title="Contabilidade"
                    subtitle="Balancetes, razao contabil e demonstracoes financeiras"
                    actions={
                        <div className="relative">
                            <select
                                value={period}
                                onChange={(e) => handlePeriodChange(e.target.value)}
                                className="appearance-none rounded border border-pf-grey/20 bg-white px-4 py-1.5 pr-8 font-sans text-xs font-bold text-pf-black outline-none focus:border-pf-blue cursor-pointer"
                            >
                                {periods.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pf-grey" />
                        </div>
                    }
                />
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 gap-0 md:grid-cols-4 divide-x divide-pf-grey/10 border-b border-pf-grey/20">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="px-0 pr-6 py-4 first:pl-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey mb-1">
                            {kpi.label}
                        </p>
                        <p className="font-sans text-xl font-bold text-pf-black">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Tab bar */}
            <div className="flex space-x-1 border-b border-pf-grey/10 overflow-x-auto pb-1">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 font-sans text-sm font-semibold transition-all border-b-2 ${
                                activeTab === tab.id
                                    ? "border-pf-blue text-pf-blue"
                                    : "border-transparent text-pf-grey hover:border-pf-grey/30 hover:text-pf-black"
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* ---- BALANCETE ---- */}
                {activeTab === "balancete" && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-bold text-pf-black">Balancete de Verificacao</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-pf-grey mt-0.5">
                                    Competencia: {periods.find((p) => p.value === period)?.label}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans text-sm">
                                <thead>
                                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                                        <th className="pb-2 pr-4">Codigo</th>
                                        <th className="pb-2 pr-4">Conta</th>
                                        <th className="pb-2 pr-4 text-right">Debito</th>
                                        <th className="pb-2 pr-4 text-right">Credito</th>
                                        <th className="pb-2 text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-pf-grey/10">
                                    {balanceteData.map((row) => (
                                        <tr key={row.codigo} className="hover:bg-white transition-colors">
                                            <td className="py-3 pr-4 font-mono text-xs font-bold text-pf-blue">
                                                {row.codigo}
                                            </td>
                                            <td className="py-3 pr-4 font-bold text-pf-black">{row.conta}</td>
                                            <td className="py-3 pr-4 text-right font-mono text-xs">
                                                {row.debito !== "R$ 0" ? row.debito : <span className="text-pf-grey/30">--</span>}
                                            </td>
                                            <td className="py-3 pr-4 text-right font-mono text-xs">
                                                {row.credito !== "R$ 0" ? row.credito : <span className="text-pf-grey/30">--</span>}
                                            </td>
                                            <td
                                                className={`py-3 text-right font-mono text-xs font-bold ${
                                                    row.saldo.startsWith("-") ? "text-red-600" : "text-pf-black"
                                                }`}
                                            >
                                                {row.saldo}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-pf-grey/20">
                                        <td colSpan={2} className="py-3 pr-4 font-bold text-pf-black text-xs uppercase tracking-wider">
                                            Total
                                        </td>
                                        <td className="py-3 pr-4 text-right font-mono text-xs font-bold">R$ 1.297.000</td>
                                        <td className="py-3 pr-4 text-right font-mono text-xs font-bold">R$ 439.000</td>
                                        <td className="py-3 text-right font-mono text-xs font-bold text-pf-black">R$ 858.000</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* ---- RAZAO CONTABIL ---- */}
                {activeTab === "razao" && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-bold text-pf-black">Razao Contabil</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-pf-grey mt-0.5">
                                    Lancamentos do periodo: {periods.find((p) => p.value === period)?.label}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans text-sm">
                                <thead>
                                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                                        <th className="pb-2 pr-4">Data</th>
                                        <th className="pb-2 pr-4">Conta</th>
                                        <th className="pb-2 pr-4">Descricao</th>
                                        <th className="pb-2 pr-4 text-right">Debito</th>
                                        <th className="pb-2 text-right">Credito</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-pf-grey/10">
                                    {(razaoDataByPeriod[period] ?? razaoDataByPeriod["2026-03"]).map((row, i) => (
                                        <tr key={i} className="hover:bg-white transition-colors">
                                            <td className="py-3 pr-4 font-mono text-xs text-pf-grey">{row.data}</td>
                                            <td className="py-3 pr-4 font-bold text-pf-black text-xs">{row.conta}</td>
                                            <td className="py-3 pr-4 text-pf-grey text-xs">{row.descricao}</td>
                                            <td className="py-3 pr-4 text-right font-mono text-xs font-bold">
                                                {row.debito || <span className="text-pf-grey/30">--</span>}
                                            </td>
                                            <td className="py-3 text-right font-mono text-xs font-bold text-red-600">
                                                {row.credito || <span className="text-pf-grey/30">--</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ---- DRE ---- */}
                {activeTab === "dre" && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-bold text-pf-black">Demonstracao do Resultado do Exercicio</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-pf-grey mt-0.5">
                                    Acumulado ate {periods.find((p) => p.value === period)?.label}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full font-sans text-sm">
                                <thead>
                                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                                        <th className="pb-2 pr-4 text-left">Descricao</th>
                                        <th className="pb-2 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dreData.map((row, i) => (
                                        <tr
                                            key={i}
                                            className={`${
                                                row.highlight
                                                    ? "bg-pf-grey/5 border-t border-b border-pf-grey/20"
                                                    : "hover:bg-white"
                                            } transition-colors`}
                                        >
                                            <td
                                                className={`py-2.5 pr-4 ${row.bold ? "font-bold text-pf-black" : "text-pf-grey"}`}
                                                style={{ paddingLeft: `${row.level * 24 + 4}px` }}
                                            >
                                                {row.label}
                                            </td>
                                            <td
                                                className={`py-2.5 text-right font-mono text-xs ${
                                                    row.bold ? "font-bold" : ""
                                                } ${
                                                    row.negative
                                                        ? "text-red-600"
                                                        : row.highlight
                                                          ? "text-pf-blue font-bold"
                                                          : "text-pf-black"
                                                }`}
                                            >
                                                {row.value}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
