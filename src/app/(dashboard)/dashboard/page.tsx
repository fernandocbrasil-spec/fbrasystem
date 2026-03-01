import { auth } from "@/auth";
import { CheckCircle, ChevronRight, AlertCircle } from "lucide-react";

const kpis = [
    { label: "Leads Ativos", value: "12", trend: "+2 essa semana", accent: true },
    { label: "Casos em Andamento", value: "48", trend: "Normal", accent: false },
    { label: "Faturado (Mês)", value: "R$ 125k", trend: "85% da meta", accent: false },
    { label: "Horas Lançadas", value: "164h", trend: "-10% vs anterior", accent: false },
];

const pendencias = [
    { tipo: "Proposta", descricao: "Aprovação pendente — Grupo Sequoia", prazo: "Hoje" },
    { tipo: "Pré-fatura", descricao: "Revisão necessária — TechCorp BR", prazo: "Amanhã" },
];

export default async function DashboardPage() {
    const session = await auth();
    const userName = session?.user?.name?.split(" ")[0] || "Doutor(a)";

    return (
        <div className="space-y-6">
            {/* Cabeçalho da página */}
            <div>
                <h1 className="font-sans text-xl font-bold tracking-tight text-pf-black">
                    Visão Geral
                </h1>
                <p className="text-sm text-pf-grey mt-1">
                    Bom dia, {userName}. Março 2026.
                </p>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.label}
                        className={`bg-white rounded border border-pf-grey/20 p-4 ${kpi.accent ? "border-l-[3px] border-l-pf-blue" : ""}`}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            {kpi.label}
                        </p>
                        <p className="font-sans text-3xl font-bold text-pf-black mt-2 leading-none">
                            {kpi.value}
                        </p>
                        <p className="text-[11px] text-pf-grey mt-2">{kpi.trend}</p>
                    </div>
                ))}
            </div>

            {/* Linha principal */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Atividades Recentes */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-pf-black">Atividades Recentes</span>
                        <button className="text-[10px] font-bold text-pf-blue uppercase tracking-widest flex items-center gap-1 hover:text-pf-black transition-colors">
                            Ver todas <ChevronRight className="h-3 w-3" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="border-t border-pf-grey/20 py-10 text-center text-pf-grey/50 text-sm">
                        Nenhuma mudança identificada nas últimas 24h.
                    </div>
                </div>

                {/* Coluna direita */}
                <div className="space-y-6">

                    {/* Aprovações */}
                    <div className="bg-pf-black rounded">
                        <div className="px-5 py-3.5 border-b border-white/10">
                            <h2 className="text-sm font-bold text-white">Aprovações</h2>
                            <p className="text-[10px] text-pf-grey/50 uppercase tracking-widest mt-0.5">
                                Aguardando revisão
                            </p>
                        </div>
                        <div className="px-5 py-6 flex flex-col items-center text-white/30 gap-2">
                            <CheckCircle className="h-7 w-7 opacity-20" aria-hidden="true" />
                            <span className="text-xs">Workspace limpo</span>
                        </div>
                    </div>

                    {/* Pendências */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-pf-grey/70 whitespace-nowrap">Pendências</span>
                            <div className="flex-1 border-t border-pf-grey/20" />
                            <span className="text-[9px] font-mono text-pf-grey/50">{pendencias.length}</span>
                        </div>
                        <div className="divide-y divide-pf-grey/15">
                            {pendencias.map((p) => (
                                <div key={p.descricao} className="py-3 flex items-start gap-3 hover:bg-white transition-colors cursor-pointer -mx-2 px-2 rounded">
                                    <AlertCircle className="h-4 w-4 text-pf-blue mt-0.5 shrink-0" aria-hidden="true" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-pf-blue">{p.tipo}</p>
                                        <p className="text-xs text-pf-black truncate mt-0.5">{p.descricao}</p>
                                    </div>
                                    <span className="text-[10px] text-pf-grey shrink-0">{p.prazo}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
