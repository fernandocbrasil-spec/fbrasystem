"use client";

import { PageHeader } from "@/components/ui/page-header";
import { TrendingUp, CalendarDays, Filter } from "lucide-react";

type RowTipo = "header" | "item" | "deducao" | "subtotal" | "destaque" | "margem" | "spacer";
type ModelagemRow = { linha: string; m1: string; m2: string; m3: string; total: string; tipo: RowTipo };

const modelagem: ModelagemRow[] = [
    { linha: "1. Receita Bruta (Faturamento Real + Projetado)", m1: "R$ 138.045", m2: "R$ 145.200", m3: "R$ 152.000", total: "R$ 435.245", tipo: "header" },
    { linha: "1.1. Planos Fixos Ativos", m1: "R$ 80.000", m2: "R$ 80.000", m3: "R$ 85.000", total: "R$ 245.000", tipo: "item" },
    { linha: "1.2. Faturamento Variável (Horas/Êxito)", m1: "R$ 58.045", m2: "R$ 65.200", m3: "R$ 67.000", total: "R$ 190.245", tipo: "item" },
    { linha: "Deduções (Impostos SN - 14,53%)", m1: "-R$ 20.057", m2: "-R$ 21.097", m3: "-R$ 22.085", total: "-R$ 63.239", tipo: "deducao" },
    { linha: "2. Receita Líquida", m1: "R$ 117.988", m2: "R$ 124.103", m3: "R$ 129.915", total: "R$ 372.006", tipo: "subtotal" },
    { linha: "spacer-1", m1: "", m2: "", m3: "", total: "", tipo: "spacer" },
    { linha: "3. Despesas Operacionais (AP)", m1: "-R$ 72.500", m2: "-R$ 75.000", m3: "-R$ 76.200", total: "-R$ 223.700", tipo: "header" },
    { linha: "3.1. Folha de Pagamento & Encargos", m1: "-R$ 45.000", m2: "-R$ 45.000", m3: "-R$ 45.000", total: "-R$ 135.000", tipo: "item" },
    { linha: "3.2. Infraestrutura (Aluguel, Software, TI)", m1: "-R$ 15.500", m2: "-R$ 16.000", m3: "-R$ 16.200", total: "-R$ 47.700", tipo: "item" },
    { linha: "3.3. Marketing & Comercial", m1: "-R$ 12.000", m2: "-R$ 14.000", m3: "-R$ 15.000", total: "-R$ 41.000", tipo: "item" },
    { linha: "4. EBITDA (Resultado Operacional)", m1: "R$ 45.488", m2: "R$ 49.103", m3: "R$ 53.715", total: "R$ 148.306", tipo: "subtotal" },
    { linha: "spacer-2", m1: "", m2: "", m3: "", total: "", tipo: "spacer" },
    { linha: "5. Caixa Livre Gerado (FCF)", m1: "R$ 45.488", m2: "R$ 49.103", m3: "R$ 53.715", total: "R$ 148.306", tipo: "destaque" },
    { linha: "Margem FCF (%)", m1: "32.9%", m2: "33.8%", m3: "35.3%", total: "34.0%", tipo: "margem" },
];

function getRowStyles(tipo: RowTipo) {
    switch (tipo) {
        case "header":
            return {
                row: "hover:bg-pf-blue/5 transition-colors",
                cell1: "py-2.5 text-xs font-bold text-pf-black uppercase tracking-widest pt-4",
                val: "text-right font-mono text-sm py-2.5 font-bold text-pf-black pt-4",
                total: "text-right font-mono text-sm font-bold bg-pf-grey/5 pl-6 py-2.5 pt-4",
            };
        case "item":
            return {
                row: "hover:bg-pf-blue/5 transition-colors",
                cell1: "py-2.5 text-xs pl-5 text-pf-grey",
                val: "text-right font-mono text-sm py-2.5 text-pf-grey",
                total: "text-right font-mono text-sm font-bold bg-pf-grey/5 pl-6 py-2.5",
            };
        case "deducao":
            return {
                row: "hover:bg-pf-blue/5 transition-colors",
                cell1: "py-2.5 text-xs pl-5 text-red-500",
                val: "text-right font-mono text-sm py-2.5 text-red-500",
                total: "text-right font-mono text-sm font-bold bg-pf-grey/5 pl-6 py-2.5 text-red-600",
            };
        case "subtotal":
            return {
                row: "bg-pf-grey/5 border-t border-pf-grey/20",
                cell1: "py-2.5 text-xs font-bold text-pf-black uppercase tracking-widest",
                val: "text-right font-mono text-sm py-2.5 font-bold text-pf-black",
                total: "text-right font-mono text-sm font-bold bg-pf-grey/10 pl-6 py-2.5",
            };
        case "destaque":
            return {
                row: "bg-pf-blue/5 border-y border-pf-blue/15",
                cell1: "py-3 text-xs font-bold text-pf-blue uppercase tracking-widest",
                val: "text-right font-mono font-bold text-pf-blue py-3 text-sm",
                total: "text-right font-mono font-bold bg-pf-blue/10 text-pf-blue pl-6 py-3 text-sm",
            };
        case "margem":
            return {
                row: "hover:bg-pf-blue/5 transition-colors",
                cell1: "py-2 text-[10px] font-bold text-pf-grey uppercase tracking-widest text-right",
                val: "text-right font-mono font-bold text-green-600 py-2 text-[10px]",
                total: "text-right font-mono font-bold bg-pf-grey/5 text-green-700 pl-6 py-2 text-[10px]",
            };
        default:
            return { row: "", cell1: "", val: "", total: "" };
    }
}

export default function FluxoDeCaixaPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Fluxo de Caixa Modelado"
                subtitle="DRE Gerencial projetada (Pipeline + Contratos Ativos vs Despesas Operacionais)."
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.alert("Visualização alterada: Trimestral / Semestral / Anual.")}
                            className="flex items-center justify-center gap-2 rounded-md border border-pf-grey/20 bg-white px-4 py-2.5 text-sm font-semibold text-pf-black hover:bg-pf-blue/5 hover:border-pf-blue transition-colors"
                        >
                            <CalendarDays className="h-4 w-4" />
                            Visualização: Trimestral
                        </button>
                        <button
                            onClick={() => window.alert("Filtro: Centro de Custo, Unidade, Regime Caixa/Competência.")}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-black px-5 py-2.5 font-sans text-sm font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm"
                        >
                            <Filter className="h-4 w-4" />
                            Filtrar Projeção
                        </button>
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Receita Global (Tri 1)</p>
                    <div className="flex items-end gap-2 mt-2">
                        <p className="font-sans text-3xl font-bold text-pf-black leading-none">R$ 435k</p>
                        <span className="flex items-center text-[10px] font-bold text-green-700 mb-0.5">
                            <TrendingUp className="h-3 w-3 mr-0.5" aria-hidden="true" /> +12%
                        </span>
                    </div>
                </div>
                <div className="bg-white border border-pf-grey/20 rounded p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Despesas Totais (Tri 1)</p>
                    <p className="font-sans text-3xl font-bold text-red-600 mt-2 leading-none">R$ 223k</p>
                    <p className="text-[11px] text-pf-grey mt-2">+4% vs anterior</p>
                </div>
                <div className="bg-white border border-pf-grey/20 rounded p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Caixa Livre (FCF)</p>
                    <p className="font-sans text-3xl font-bold text-pf-blue mt-2 leading-none">R$ 148k</p>
                    <p className="text-[11px] text-pf-grey mt-2">Margem saudável de 34%</p>
                </div>
            </div>

            {/* DRE Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-pf-grey/20 text-pf-grey">
                            <th className="pb-2 font-semibold uppercase tracking-wider text-[10px] w-1/3">Estrutura DRE</th>
                            <th className="pb-2 font-semibold uppercase tracking-wider text-[10px] text-right">Fev/26 (Realizado)</th>
                            <th className="pb-2 font-semibold uppercase tracking-wider text-[10px] text-right">Mar/26 (Previsão)</th>
                            <th className="pb-2 font-semibold uppercase tracking-wider text-[10px] text-right">Abr/26 (Previsão)</th>
                            <th className="pb-2 font-semibold uppercase tracking-wider text-[10px] text-right pl-6 bg-pf-grey/5">Acumulado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-pf-grey/10">
                        {modelagem.map((row) => {
                            if (row.tipo === "spacer") {
                                return <tr key={row.linha} className="h-3"><td colSpan={5}></td></tr>;
                            }
                            const s = getRowStyles(row.tipo);
                            return (
                                <tr key={row.linha} className={s.row}>
                                    <td className={s.cell1}>{row.linha}</td>
                                    <td className={s.val}>{row.m1}</td>
                                    <td className={s.val}>{row.m2}</td>
                                    <td className={s.val}>{row.m3}</td>
                                    <td className={s.total}>{row.total}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
