"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Lock, Presentation, ArrowRight, ShieldCheck, PieChart, Users, ArrowUpRight } from "lucide-react";

const kpiMetrics = [
    { label: "Faturamento Bruto", value: "R$ 820.000", color: "text-pf-black" },
    { label: "Impostos & Taxas", value: "-R$ 86.100", color: "text-red-600" },
    { label: "Custos Operacionais", value: "-R$ 247.980", color: "text-red-600" },
    { label: "Margem Líquida", value: "59.2%", color: "text-pf-black" },
] as const;

const topRentabilidade = [
    { cliente: "Grupo Sequoia", valor: "R$ 135k", margem: "82%" },
    { cliente: "TechCorp BR", valor: "R$ 98k", margem: "75%" },
    { cliente: "Indústria Metal SP", valor: "R$ 42k", margem: "64%" },
] as const;

export default function CofrePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-pf-blue" aria-hidden="true" />
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-pf-blue">
                    Acesso Restrito — Sócios
                </span>
            </div>

            <PageHeader
                title="Cofre & DRE"
                subtitle="Business Intelligence financeiro, rentabilidade por caso e performance do escritório."
                actions={
                    <button
                        onClick={() => window.alert("Gerando Relatório de Performance (P&L Detalhado) para apresentação societária.")}
                        className="flex items-center justify-center gap-2 rounded-md bg-pf-black px-5 py-2.5 font-sans text-sm font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm"
                    >
                        <Presentation className="h-4 w-4" aria-hidden="true" />
                        Gerar Relatório Societário
                    </button>
                }
            />

            {/* Resultado Principal */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-pf-grey/20">
                    <div>
                        <h3 className="font-sans text-sm font-bold text-pf-black">Resultado Líquido (YTD)</h3>
                        <p className="text-xs text-pf-grey mt-0.5">Janeiro 2026 — Presente</p>
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
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey mb-1">{item.label}</p>
                            <p className={`font-sans text-xl font-bold ${item.color}`}>{item.value}</p>
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
                                Casos vs Horas Lançadas
                            </span>
                        </div>
                        <PieChart className="h-4 w-4 text-pf-grey/30" aria-hidden="true" />
                    </div>
                    <div className="divide-y divide-pf-grey/15">
                        {topRentabilidade.map((item) => (
                            <div
                                key={item.cliente}
                                onClick={() => window.alert(`Detalhando RAE do cliente ${item.cliente}.`)}
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
                        ))}
                    </div>
                    <button
                        onClick={() => window.alert("Abrindo painel de BI com filtros granulares.")}
                        className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-pf-blue hover:text-pf-black transition-colors"
                    >
                        Análise Completa
                    </button>
                </div>

                {/* Distribuição — painel escuro intencional */}
                <div className="bg-pf-black rounded border border-pf-black flex flex-col">
                    <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white">Distribuição</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-pf-grey/50 mt-0.5">
                                Pró-labore e Dividendos
                            </p>
                        </div>
                        <Users className="h-5 w-5 text-pf-blue/40" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col items-center justify-center flex-1 text-center px-5 py-10">
                        <Lock className="h-8 w-8 text-pf-blue/40 mb-4" aria-hidden="true" />
                        <h4 className="font-sans text-lg font-bold text-white mb-2">Painel Fechado</h4>
                        <p className="font-sans text-xs text-pf-grey/60 max-w-xs leading-relaxed">
                            As simulações de antecipação de dividendos só serão liberadas após o fechamento do trimestre atual.
                        </p>
                        <button
                            onClick={() => window.alert("Segurança: Requer autenticação Azure AD de Sócio-Administrador.")}
                            className="mt-6 flex items-center justify-center gap-2 bg-white/10 px-6 py-2 font-sans text-xs font-bold text-white transition-all hover:bg-pf-blue"
                        >
                            Desbloquear Simulação <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
