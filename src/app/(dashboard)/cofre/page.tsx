"use client";

import { useState, useEffect, useCallback } from "react";
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
import { getCofreData, type CofreData, type ClientRentabilidade } from "@/lib/actions/cofre";

function fmtCurrency(v: number): string {
    const abs = Math.abs(v);
    const sign = v < 0 ? "-" : "";
    return `${sign}R$ ${abs.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

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

    const [data, setData] = useState<CofreData | null>(null);

    const loadData = useCallback(async () => {
        const d = await getCofreData();
        setData(d);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const kpis = data?.kpis;
    const rentabilidade = data?.rentabilidade ?? [];
    const topRent = rentabilidade.slice(0, 3);
    const year = data?.year ?? 2026;

    const resultadoLiquido = kpis?.resultadoLiquido ?? 0;

    const handleGenerateReport = () => {
        if (!kpis) return;
        setReportState("loading");
        setTimeout(() => {
            setReportState("done");

            const csvHeader = "Metrica,Valor\n";
            const csvRows = [
                `"Faturamento Bruto","${fmtCurrency(kpis.faturamentoBruto)}"`,
                `"Impostos & Taxas","${fmtCurrency(kpis.impostos)}"`,
                `"Custos Operacionais","${fmtCurrency(kpis.custosOperacionais)}"`,
                `"Margem Liquida","${kpis.margemLiquida}%"`,
                `"Resultado Liquido YTD","${fmtCurrency(kpis.resultadoLiquido)}"`,
            ].join("\n");
            const csvContent = csvHeader + csvRows;

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `relatorio_societario_${year}.csv`;
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

    const proLaboreAnual = parseFloat(simValorProLabore || "0") * parseFloat(simMeses || "0");
    const baseDistribuicao = resultadoLiquido - proLaboreAnual;
    const dividendosValor = baseDistribuicao * (parseFloat(simDividendos || "0") / 100);
    const retencao = baseDistribuicao - dividendosValor;

    const kpiMetrics = kpis
        ? [
              { label: "Faturamento Bruto", value: fmtCurrency(kpis.faturamentoBruto), raw: kpis.faturamentoBruto },
              { label: "Impostos & Taxas", value: fmtCurrency(kpis.impostos), raw: kpis.impostos },
              { label: "Custos Operacionais", value: fmtCurrency(kpis.custosOperacionais), raw: kpis.custosOperacionais },
              { label: "Margem Liquida", value: `${kpis.margemLiquida}%`, raw: kpis.margemLiquida },
          ]
        : [];

    if (!data) {
        return (
            <div className="flex items-center justify-center py-20 text-pf-grey">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Carregando Cofre...</span>
            </div>
        );
    }

    // Totals for rentabilidade table
    const totalReceita = rentabilidade.reduce((s, r) => s + r.receita, 0);
    const totalCustos = rentabilidade.reduce((s, r) => s + r.custos, 0);
    const totalHoras = rentabilidade.reduce((s, r) => s + r.horas, 0);
    const totalMargem = totalReceita > 0 ? Math.round(((totalReceita - totalCustos) / totalReceita) * 1000) / 10 : 0;

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
                        <p className="text-xs text-pf-grey mt-0.5">Janeiro {year} -- Presente</p>
                    </div>
                    <div className="text-right">
                        <p className="font-sans text-4xl font-bold text-pf-blue leading-none">{fmtCurrency(resultadoLiquido)}</p>
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
                        {topRent.map((item) => (
                            <div key={item.clientId}>
                                <div
                                    onClick={() =>
                                        setExpandedClient(expandedClient === item.clientId ? null : item.clientId)
                                    }
                                    className="flex items-center justify-between py-3 hover:bg-white transition-colors cursor-pointer -mx-2 px-2"
                                >
                                    <span className="font-sans text-sm font-bold text-pf-black">{item.clientName}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono text-xs font-bold text-pf-grey">{fmtCurrency(item.receita)}</span>
                                        <span className="inline-flex w-12 justify-center bg-green-100 px-2 py-0.5 font-sans text-[10px] font-bold text-green-700">
                                            {item.margem}%
                                        </span>
                                    </div>
                                </div>
                                {expandedClient === item.clientId && (
                                    <div className="bg-pf-grey/5 -mx-2 px-4 py-2 mb-1 text-xs text-pf-grey">
                                        <p>
                                            Receita {fmtCurrency(item.receita)} | Custos {fmtCurrency(item.custos)} | Margem {item.margem}% | {item.horas}h
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
                            {data.partners.length > 0 && (
                                <div className="space-y-1 border-b border-white/10 pb-3 mb-2">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey/50">Socios</p>
                                    {data.partners.map((p) => (
                                        <div key={p.id} className="flex justify-between text-xs">
                                            <span className="text-pf-grey/60">{p.name} ({p.sharePercentage}%)</span>
                                            <span className="font-bold text-white font-mono">
                                                {p.ledgerBalance !== 0 ? fmtCurrency(p.ledgerBalance) : "—"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

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
                                            {fmtCurrency(resultadoLiquido)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-pf-grey/60">
                                            Pro-labore ({simMeses} meses)
                                        </span>
                                        <span className="font-bold text-red-400">
                                            -{fmtCurrency(proLaboreAnual)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-pf-grey/60">Base Distribuicao</span>
                                        <span className="font-bold text-white">
                                            {fmtCurrency(baseDistribuicao)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs border-t border-white/10 pt-2">
                                        <span className="text-pf-grey/60">
                                            Dividendos ({simDividendos}%)
                                        </span>
                                        <span className="font-bold text-green-400">
                                            {fmtCurrency(dividendosValor)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-pf-grey/60">Retencao Societaria</span>
                                        <span className="font-bold text-pf-blue">
                                            {fmtCurrency(retencao)}
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
                                {rentabilidade.map((row) => (
                                    <tr key={row.clientId} className="hover:bg-white transition-colors">
                                        <td className="py-3 pr-4 font-bold text-pf-black">{row.clientName}</td>
                                        <td className="py-3 pr-4 text-right font-mono text-xs">{fmtCurrency(row.receita)}</td>
                                        <td className="py-3 pr-4 text-right font-mono text-xs text-red-600">
                                            {fmtCurrency(row.custos)}
                                        </td>
                                        <td className="py-3 pr-4 text-right">
                                            <span className="inline-flex w-12 justify-center bg-green-100 px-2 py-0.5 font-sans text-[10px] font-bold text-green-700">
                                                {row.margem}%
                                            </span>
                                        </td>
                                        <td className="py-3 text-right font-mono text-xs text-pf-grey">
                                            {row.horas}h
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-pf-grey/20">
                                    <td className="py-3 pr-4 font-bold text-pf-black text-xs uppercase tracking-wider">
                                        Total
                                    </td>
                                    <td className="py-3 pr-4 text-right font-mono text-xs font-bold">{fmtCurrency(totalReceita)}</td>
                                    <td className="py-3 pr-4 text-right font-mono text-xs font-bold text-red-600">
                                        {fmtCurrency(totalCustos)}
                                    </td>
                                    <td className="py-3 pr-4 text-right">
                                        <span className="inline-flex w-12 justify-center bg-green-100 px-2 py-0.5 font-sans text-[10px] font-bold text-green-700">
                                            {totalMargem}%
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-mono text-xs font-bold text-pf-grey">
                                        {totalHoras}h
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
