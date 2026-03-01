"use client";

import { useState } from "react";
import {
    Receipt,
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    Plus,
    ArrowUpRight,
    FileText,
    Vault,
    TrendingUp,
    TrendingDown,
    Filter,
    MoreHorizontal,
    Eye
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

// ==================== REUSABLE COMPONENTS FROM PROTOTYPE ====================

function KpiCard({ label, value, trend, trendUp, icon: Icon, color = "#212EC6" }: any) {
    return (
        <div className="bg-white rounded-xl border border-[#BDBDBD]/20 p-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-1.5">
                <p className="text-[10px] text-black/40 uppercase tracking-wider font-bold font-sans">
                    {label}
                </p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "10" }}>
                    <Icon size={14} style={{ color }} />
                </div>
            </div>
            <p className="text-xl font-bold text-black font-sans">
                {value}
            </p>
            {trend && (
                <div className="flex items-center gap-1 mt-1">
                    {trendUp ? (
                        <TrendingUp size={12} className="text-green-500" />
                    ) : (
                        <TrendingDown size={12} className="text-red-500" />
                    )}
                    <span className={`text-[9px] font-bold ${trendUp ? "text-green-600" : "text-red-600"} font-sans`}>
                        {trend}
                    </span>
                    <span className="text-[9px] text-black/30 ml-1 font-sans">vs mês anterior</span>
                </div>
            )}
        </div>
    );
}

function MiniPipeline() {
    const stages = [
        { name: "Novo", count: 3, color: "#212EC6" },
        { name: "Avaliação", count: 5, color: "#7C3AED" },
        { name: "Proposta", count: 4, color: "#2563EB" },
        { name: "Negociação", count: 2, color: "#F59E0B" },
        { name: "Ganho", count: 8, color: "#10B981" },
    ];
    const total = stages.reduce((s, st) => s + st.count, 0);

    return (
        <div className="bg-white rounded-xl border border-[#BDBDBD]/20 p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-black font-sans uppercase tracking-wider">
                    Pipeline CRM
                </h3>
                <button className="text-[10px] text-[#212EC6] font-bold hover:underline flex items-center gap-1 uppercase tracking-widest">
                    Ver todos <ArrowUpRight size={12} />
                </button>
            </div>
            <div className="flex rounded-full overflow-hidden h-2.5 mb-6">
                {stages.map((s) => (
                    <div
                        key={s.name}
                        style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
                        className="transition-all duration-300"
                        title={`${s.name}: ${s.count}`}
                    />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {stages.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] text-black/50 font-bold uppercase tracking-tight">{s.name}</span>
                        <span className="text-[10px] font-bold text-pf-black ml-auto">{s.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CashflowChart() {
    const months = ["Set", "Out", "Nov", "Dez", "Jan", "Fev"];
    const received = [180, 220, 195, 280, 245, 310];
    const projected = [200, 200, 210, 250, 260, 300];
    const maxVal = Math.max(...received, ...projected);

    return (
        <div className="bg-white rounded-xl border border-[#BDBDBD]/20 p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-black font-sans uppercase tracking-wider">
                    Fluxo de Caixa
                </h3>
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#212EC6]" />
                        <span className="text-black/50">Real</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#BDBDBD]" />
                        <span className="text-black/50">Proj.</span>
                    </div>
                </div>
            </div>
            <div className="flex items-end gap-3 h-32 mt-4">
                {months.map((m, i) => (
                    <div key={m} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex gap-1 items-end h-24">
                            <div
                                className="flex-1 bg-[#212EC6] rounded-t-sm transition-all duration-500"
                                style={{ height: `${(received[i] / maxVal) * 100}%` }}
                            />
                            <div
                                className="flex-1 bg-[#BDBDBD]/40 rounded-t-sm transition-all duration-500"
                                style={{ height: `${(projected[i] / maxVal) * 100}%` }}
                            />
                        </div>
                        <span className="text-[9px] text-pf-grey font-bold uppercase">{m}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PendingApprovals() {
    const items = [
        { type: "Proposta", client: "Tech Solutions Ltda", value: "R$ 45.000", date: "27/02/2026" },
        { type: "Pré-Fatura", client: "Nexus Participações", value: "R$ 18.500", date: "26/02/2026" },
        { type: "Distribuição", client: "Cofre dos Sócios", value: "R$ 80.000", date: "24/02/2026" },
    ];

    return (
        <div className="bg-white rounded-xl border border-[#BDBDBD]/20 p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-bold text-black font-sans uppercase tracking-wider">
                    Pendências
                </h3>
                <span className="w-5 h-5 rounded-full bg-pf-blue text-white text-[10px] font-bold flex items-center justify-center">
                    {items.length}
                </span>
            </div>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-pf-blue/5 transition-colors group cursor-pointer border border-transparent hover:border-pf-blue/10">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === "Proposta" ? "bg-[#212EC6]/10 text-pf-blue" :
                                item.type === "Pré-Fatura" ? "bg-orange-100 text-orange-600" :
                                    "bg-purple-100 text-purple-600"
                                }`}>
                                {item.type === "Proposta" ? <FileText size={14} /> :
                                    item.type === "Pré-Fatura" ? <Receipt size={14} /> :
                                        <Vault size={14} />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-black truncate">{item.client}</p>
                                <p className="text-[9px] text-pf-grey font-medium uppercase">{item.type} · {item.date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-pf-black whitespace-nowrap">{item.value}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); window.alert(`Ação Rápida: Abrindo ${item.type}`); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-pf-blue hover:text-white rounded">
                                <ArrowUpRight size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================== MAIN PAGE ====================

export default function DashboardPage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            {/* Sticky header */}
            <div className="sticky top-0 z-20 bg-[#F4F5F7] space-y-2 pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                        <h1 className="text-base font-bold text-pf-black font-sans tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-[11px] text-pf-grey font-sans font-semibold uppercase tracking-[0.15em] mt-0.5">
                            Visão Geral · Fevereiro 2026
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex h-8 items-center gap-2 rounded-lg border-2 border-pf-blue px-3 text-[11px] font-bold text-pf-blue hover:bg-pf-blue/5 transition-all">
                            <Calendar className="h-3.5 w-3.5" /> Fev 2026
                        </button>
                        <button
                            onClick={() => window.alert("Modal: Novo Registro de Lead/Oportunidade.")}
                            className="flex h-8 items-center gap-2 rounded-lg bg-pf-blue px-3 text-[11px] font-bold text-white shadow-[0_4px_15px_rgba(33,46,198,0.3)] hover:scale-[1.02] transition-all active:scale-95">
                            <Plus className="h-3.5 w-3.5" /> Novo Lead
                        </button>
                    </div>
                </div>

                {/* KPI Rows */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Faturado (Mês)"
                    value="R$ 287k"
                    trend="+12,4%"
                    trendUp={true}
                    icon={Receipt}
                    color="#212EC6"
                />
                <KpiCard
                    label="Recebido (Mês)"
                    value="R$ 218k"
                    trend="+8,2%"
                    trendUp={true}
                    icon={CheckCircle2}
                    color="#10B981"
                />
                <KpiCard
                    label="Em Aberto"
                    value="R$ 105k"
                    trend="-3,1%"
                    trendUp={true}
                    icon={Clock}
                    color="#F59E0B"
                />
                <KpiCard
                    label="Vencido"
                    value="R$ 55k"
                    trend="+18%"
                    trendUp={false}
                    icon={AlertCircle}
                    color="#EF4444"
                />
            </div>
            </div>

            {/* Matrix BI Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
                <MiniPipeline />
                <CashflowChart />
                <PendingApprovals />
            </div>

            {/* Recent Items Table */}
            <div className="bg-white rounded-xl border border-pf-grey/10 shadow-sm overflow-hidden mt-3">
                <div className="px-5 py-3 border-b border-pf-grey/5 flex justify-between items-center">
                    <h3 className="text-xs font-bold font-sans uppercase tracking-widest text-pf-black">Contas a Receber Recentes</h3>
                    <button className="text-[10px] font-bold text-pf-blue hover:underline uppercase tracking-widest">Ver Todos</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                        <thead className="bg-pf-black text-white uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-3 font-bold">Cliente</th>
                                <th className="px-6 py-3 font-bold">Vencimento</th>
                                <th className="px-6 py-3 font-bold">Valor</th>
                                <th className="px-6 py-3 font-bold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-pf-grey/10 font-bold">
                            {[
                                { c: "Nexus Participações", d: "15/03/2026", v: "R$ 18.500", s: "A Receber", sc: "bg-orange-100 text-orange-700" },
                                { c: "Tech Solutions Ltda", d: "10/03/2026", v: "R$ 32.000", s: "A Receber", sc: "bg-orange-100 text-orange-700" },
                                { c: "Constru-X S.A.", d: "28/02/2026", v: "R$ 55.000", s: "Vencido", sc: "bg-red-100 text-red-700" },
                                { c: "Grupo Alfa S.A.", d: "20/02/2026", v: "R$ 12.800", s: "Recebido", sc: "bg-green-100 text-green-700" },
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-pf-blue/5 transition-colors cursor-pointer">
                                    <td className="px-6 py-4 text-pf-black">{row.c}</td>
                                    <td className="px-6 py-4 text-pf-grey font-mono">{row.d}</td>
                                    <td className="px-6 py-4 font-mono text-pf-black">{row.v}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${row.sc}`}>{row.s}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
