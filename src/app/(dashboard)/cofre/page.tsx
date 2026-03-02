"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import {
    Lock,
    Presentation,
    ArrowRight,
    ShieldCheck,
    PieChart,
    Users,
    ArrowUpRight,
    Check,
    Loader2,
    Download,
    Calculator,
} from "lucide-react";

const kpiMetrics = [
    { label: "Faturamento Bruto", value: "R$ 820.000", raw: 820000 },
    { label: "Impostos & Taxas", value: "-R$ 86.100", raw: -86100 },
    { label: "Custos Operacionais", value: "-R$ 247.980", raw: -247980 },
    { label: "Margem Líquida", value: "59.2%", raw: 59.2 },
] as const;

const topRentabilidade = [
    { cliente: "Grupo Sequoia", valor: "R$ 135k", margem: "82%" },
    { cliente: "TechCorp BR", valor: "R$ 98k", margem: "75%" },
    { cliente: "Indústria Metal SP", valor: "R$ 42k", margem: "64%" },
] as const;

const analiseCompletaData = [
    { cliente: "Grupo Sequoia", receita: "R$ 135.000", custos: "R$ 24.300", margem: "82%", horas: "312h" },
    { cliente: "TechCorp BR", receita: "R$ 98.000", custos: "R$ 24.500", margem: "75%", horas: "245h" },
    { cliente: "Indústria Metal SP", receita: "R$ 42.000", custos: "R$ 15.120", margem: "64%", horas: "128h" },
    { cliente: "Construtora Horizonte", receita: "R$ 78.000", custos: "R$ 28.860", margem: "63%", horas: "198h" },
    { cliente: "Logística Express", receita: "R$ 56.000", custos: "R$ 22.400", margem: "60%", horas: "156h" },
    { cliente: "Farmacêutica Vida", receita: "R$ 64.000", custos: "R$ 27.520", margem: "57%", horas: "172h" },
    { cliente: "Auto Peças Nacional", receita: "R$ 38.000", custos: "R$ 17.860", margem: "53%", horas: "104h" },
    { cliente: "Outros (consolidado)", receita: "R$ 309.000", custos: "R$ 87.420", margem: "72%", horas: "685h" },
] as const;

export default function CofrePage() {
    const { toast } = useToast();
    const [reportState, setReportState] = useState<"idle" | "loading" | "done">("idle");
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [showAnalise, setShowAnalise] = useState(false);
    const [simulacaoUnlocked, setSimulacaoUnlocked] = useState(false);
    const [simValorProLabore, setSimValorProLabore] = useState("30000");
    const [simDividendos, setSimDividendos] = useState("40");
    const [simMeses, setSimMeses] = useState("12");
    const [simCalculated, setSimCalculated] = useState(false);

    const handleGenerateReport = () => {
        setReportState("loading");
        setTimeout(() => {
            setReportState("done");

            const csvHeader = "Metrica,Valor\n";
            const csvRows = kpiMetrics
                .map((m) => `"${m.label}","${m.value}"`)
                .join("\n");
            const csvContent = csvHeader + csvRows + "\n\"Resultado Liquido YTD\",\"R$ 485.920\"";

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "relatorio_societario_2026.csv";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast("Relatorio exportado", "success");
        }, 1500);
    };

    const handleSimular = () => {
        setSimCalculated(true);
    };

    const resultadoLiquido = 485920;
    const proLaboreAnual = parseFloat(simValorProLabore || "0") * parseFloat(simMeses || "0");
    const baseDistribuicao = resultadoLiquido - proLaboreAnual;
    const dividendosValor = baseDistribuicao * (parseFloat(simDividendos || "0") / 100);
    const retencao = baseDistribuicao - dividendosValor;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-pf-blue" aria-hidden="true" />
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-pf-blue">
                    Acesso Restrito -- Socios
                </span>
            </div>

            <PageHeader
                title="Cofre & DRE"
                subtitle="Business Intelligence financeiro, rentabilidade por caso e performance do escritorio."
                actions={
                    <button
                        onClick={handleGenerateReport}
                        disabled={reportState === "loading"}
                        className="flex items-center justify-center gap-2 rounded-md bg-pf-black px-3 py-1.5 font-sans text-xs font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm disabled:opacity-60"
                    >
                        {reportState === "loading" ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : reportState === "done" ? (
                            <Download className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Presentation className="h-4 w-4" aria-hidden="true" />
                        )}
                        {reportState === "loading"
                            ? "Gerando..."
                            : reportState === "done"
                              ? "Relatorio Gerado"
                              : "Gerar Relatorio Societario"}
                    </button>
                }
            />

            {/* Resultado Principal */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-pf-grey/20">
                    <div>
                        <h3 className="font-sans text-sm font-bold text-pf-black">Resultado Liquido (YTD)</h3>
                        <p className="text-xs text-pf-grey mt-0.5">Janeiro 2026 -- Presente</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-green-700 flex items-center justify-end gap-1 mb-1">
                            <ArrowUpRight className="h-3 w-3" aria-hidden="true" /> +24% margem vs 2025
                        </p>
                        <p className="font-sans text-4xl font-bold text-pf-blue leading-none">R$ 485.920</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-0 md:grid-cols-4 divide-x divide-pf-grey/10 border-b border-pf-grey/20">
                    {kpiMetrics.map((item) => (
                        <div key={item.label} className="px-0 pr-6 py-4 first:pl-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey mb-1">
                                {item.label}
                            </p>
                            <p
                                className={`font-sans text-xl font-bold ${
                                    item.raw < 0 ? "text-red-600" : "text-pf-black"
                                }`}
                            >
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cards inferiores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rentabilidade */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <span className="text-sm font-bold text-pf-black">Top Rentabilidade</span>
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.05em] text-pf-grey">
                                Casos vs Horas Lancadas
                            </span>
                        </div>
                        <PieChart className="h-4 w-4 text-pf-grey/30" aria-hidden="true" />
                    </div>
                    <div className="divide-y divide-pf-grey/15">
                        {topRentabilidade.map((item) => (
                            <div key={item.cliente}>
                                <div
                                    onClick={() =>
                                        setExpandedClient(expandedClient === item.cliente ? null : item.cliente)
                                    }
                                    className="flex items-center justify-between py-3 hover:bg-white transition-colors cursor-pointer -mx-2 px-2"
                                >
                                    <span className="font-sans text-sm font-bold text-pf-black">{item.cliente}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono text-xs font-bold text-pf-grey">{item.valor}</span>
                                        <span className="inline-flex w-12 justify-center bg-green-100 px-2 py-0.5 font-sans text-[10px] font-bold text-green-700">
                                            {item.margem}
                                        </span>
                                    </div>
                                </div>
                                {expandedClient === item.cliente && (
                                    <div className="bg-pf-grey/5 -mx-2 px-4 py-2 mb-1 text-xs text-pf-grey">
                                        <p>
                                            RAE detalhado: receita {item.valor} | margem {item.margem}
                                        </p>
                                        <p className="mt-1 text-[10px]">
                                            Conecte o banco de dados para ver dados completos.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowAnalise(!showAnalise)}
                        className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-pf-blue hover:text-pf-black transition-colors"
                    >
                        {showAnalise ? "Fechar Analise" : "Analise Completa"}
                    </button>
                </div>

                {/* Distribuicao -- painel escuro */}
                <div className="bg-pf-black rounded border border-pf-black flex flex-col">
                    <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white">Distribuicao</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-pf-grey/50 mt-0.5">
                                Pro-labore e Dividendos
                            </p>
                        </div>
                        <Users className="h-5 w-5 text-pf-blue/40" aria-hidden="true" />
                    </div>

                    {!simulacaoUnlocked ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-center px-5 py-10">
                            <Lock className="h-8 w-8 text-pf-blue/40 mb-4" aria-hidden="true" />
                            <h4 className="font-sans text-lg font-bold text-white mb-2">Painel Fechado</h4>
                            <p className="font-sans text-xs text-pf-grey/60 max-w-xs leading-relaxed">
                                As simulacoes de antecipacao de dividendos so serao liberadas apos o fechamento do
                                trimestre atual.
                            </p>
                            <button
                                onClick={() => {
                                    setSimulacaoUnlocked(true);
                                    toast("Simulacao desbloqueada", "success");
                                }}
                                className="mt-6 flex items-center justify-center gap-2 bg-white/10 px-6 py-2 font-sans text-xs font-bold text-white transition-all hover:bg-pf-blue"
                            >
                                Desbloquear Simulacao{" "}
                                <ArrowRight className="h-3 w-3" aria-hidden="true" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 px-5 py-5 space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey/50 block mb-1">
                                        Valor Pro-labore Mensal (R$)
                                    </label>
                                    <input
                                        type="number"
                                        value={simValorProLabore}
                                        onChange={(e) => {
                                            setSimValorProLabore(e.target.value);
                                            setSimCalculated(false);
                                        }}
                                        className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 font-sans text-sm text-white outline-none focus:border-pf-blue"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey/50 block mb-1">
                                        % Dividendos sobre Resultado
                                    </label>
                                    <input
                                        type="number"
                                        value={simDividendos}
                                        onChange={(e) => {
                                            setSimDividendos(e.target.value);
                                            setSimCalculated(false);
                                        }}
                                        min="0"
                                        max="100"
                                        className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 font-sans text-sm text-white outline-none focus:border-pf-blue"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey/50 block mb-1">
                                        Meses de Simulacao
                                    </label>
                                    <input
                                        type="number"
                                        value={simMeses}
                                        onChange={(e) => {
                                            setSimMeses(e.target.value);
                                            setSimCalculated(false);
                                        }}
                                        min="1"
                                        max="24"
                                        className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 font-sans text-sm text-white outline-none focus:border-pf-blue"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSimular}
                                className="w-full flex items-center justify-center gap-2 rounded bg-pf-blue px-4 py-2 font-sans text-xs font-bold text-white transition-all hover:bg-pf-blue/80"
                            >
                                <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
                                Calcular Simulacao
                            </button>

                            {simCalculated && (
                                <div className="space-y-2 border-t border-white/10 pt-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-pf-grey/60">Resultado Liquido</span>
                                        <span className="font-bold text-white">
                                            R$ {resultadoLiquido.toLocaleString("pt-BR")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-pf-grey/60">
                                            Pro-labore ({simMeses} meses)
                                        </span>
                                        <span className="font-bold text-red-400">
                                            -R$ {proLaboreAnual.toLocaleString("pt-BR")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-pf-grey/60">Base Distribuicao</span>
                                        <span className="font-bold text-white">
                                            R$ {baseDistribuicao.toLocaleString("pt-BR")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs border-t border-white/10 pt-2">
                                        <span className="text-pf-grey/60">
                                            Dividendos ({simDividendos}%)
                                        </span>
                                        <span className="font-bold text-green-400">
                                            R$ {dividendosValor.toLocaleString("pt-BR")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-pf-grey/60">Retencao Societaria</span>
                                        <span className="font-bold text-pf-blue">
                                            R$ {retencao.toLocaleString("pt-BR")}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Analise Completa Panel */}
            {showAnalise && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-bold text-pf-black">Analise Completa de Rentabilidade</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-pf-grey mt-0.5">
                                Todos os clientes -- Receita, Custos, Margem e Horas
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans text-sm">
                            <thead>
                                <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                                    <th className="pb-2 pr-4">Cliente</th>
                                    <th className="pb-2 pr-4 text-right">Receita</th>
                                    <th className="pb-2 pr-4 text-right">Custos</th>
                                    <th className="pb-2 pr-4 text-right">Margem</th>
                                    <th className="pb-2 text-right">Horas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-pf-grey/10">
                                {analiseCompletaData.map((row) => (
                                    <tr key={row.cliente} className="hover:bg-white transition-colors">
                                        <td className="py-3 pr-4 font-bold text-pf-black">{row.cliente}</td>
                                        <td className="py-3 pr-4 text-right font-mono text-xs">{row.receita}</td>
                                        <td className="py-3 pr-4 text-right font-mono text-xs text-red-600">
                                            {row.custos}
                                        </td>
                                        <td className="py-3 pr-4 text-right">
                                            <span className="inline-flex w-12 justify-center bg-green-100 px-2 py-0.5 font-sans text-[10px] font-bold text-green-700">
                                                {row.margem}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right font-mono text-xs text-pf-grey">
                                            {row.horas}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-pf-grey/20">
                                    <td className="py-3 pr-4 font-bold text-pf-black text-xs uppercase tracking-wider">
                                        Total
                                    </td>
                                    <td className="py-3 pr-4 text-right font-mono text-xs font-bold">R$ 820.000</td>
                                    <td className="py-3 pr-4 text-right font-mono text-xs font-bold text-red-600">
                                        R$ 247.980
                                    </td>
                                    <td className="py-3 pr-4 text-right">
                                        <span className="inline-flex w-12 justify-center bg-green-100 px-2 py-0.5 font-sans text-[10px] font-bold text-green-700">
                                            69.8%
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-mono text-xs font-bold text-pf-grey">
                                        2.000h
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
