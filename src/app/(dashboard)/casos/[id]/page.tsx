"use client"

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Clock, CheckSquare, FileText, User, ArrowLeft, Plus, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export default function CaseDetailsPage({ params }: { params: { id: string } }) {
    const [activeTab, setActiveTab] = useState("tarefas");

    const caseData = {
        number: "CA-2026-001",
        client: "Grupo Sequoia",
        title: "Assessoria Contábil e Fiscal Contínua",
        status: "Ativo",
    };

    const TABS = [
        { id: "visao_geral", label: "Visão Geral", icon: <FileText className="h-4 w-4" /> },
        { id: "tarefas", label: "Tarefas (Kanban)", icon: <CheckSquare className="h-4 w-4" /> },
        { id: "horas", label: "Planilha de Horas", icon: <Clock className="h-4 w-4" /> },
        { id: "equipe", label: "Equipe do Caso", icon: <User className="h-4 w-4" /> },
    ];

    return (
        <div className="space-y-6">
            <div>
                <Link href="/casos" className="inline-flex items-center gap-2 mb-4 text-xs font-bold text-pf-grey hover:text-pf-blue uppercase tracking-widest transition-colors">
                    <ArrowLeft className="h-3 w-3" />
                    Voltar para Casos
                </Link>
                <PageHeader
                    title={caseData.title}
                    subtitle={`Cliente: ${caseData.client} | Processo Interno: ${caseData.number}`}
                    actions={
                        <span className="inline-flex items-center rounded-sm bg-green-100 px-3 py-1 font-sans text-xs font-bold uppercase tracking-widest text-green-700">
                            {caseData.status}
                        </span>
                    }
                />
            </div>

            <div className="flex space-x-1 border-b border-pf-grey/10 overflow-x-auto pb-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-sans text-sm font-semibold transition-all border-b-2 ${activeTab === tab.id
                                ? "border-pf-blue text-pf-blue"
                                : "border-transparent text-pf-grey hover:border-pf-grey/30 hover:text-pf-black"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-6">

                {/* KANBAN TAREFAS */}
                {activeTab === "tarefas" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-end">
                            <button className="flex items-center justify-center gap-2 rounded border border-pf-grey/30 bg-white px-3 py-1.5 text-xs font-bold text-pf-grey hover:border-pf-blue hover:text-pf-blue transition-colors shadow-sm">
                                <Plus className="h-3.5 w-3.5" />
                                Nova Tarefa
                            </button>
                        </div>

                        <div className="flex h-[calc(100vh-20rem)] w-full gap-6 overflow-x-auto pb-4">
                            {/* TODO */}
                            <div className="flex min-w-[320px] max-w-[320px] flex-col rounded-lg bg-gray-50/50 border border-pf-grey/20 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-pf-black">A Fazer <span className="text-pf-grey ml-1 text-xs font-normal">2</span></h3>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="cursor-pointer rounded-lg border border-pf-grey/10 bg-white p-4 shadow-sm hover:border-pf-blue/40">
                                        <p className="font-sans text-sm font-semibold text-pf-black mb-2">Revisão documentos IRPJ Marco</p>
                                        <div className="flex items-center justify-between mt-3 text-xs text-pf-grey">
                                            <div className="rounded bg-red-100 px-2 py-0.5 font-bold text-red-700">Alta</div>
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 05/03</span>
                                        </div>
                                    </div>
                                    <div className="cursor-pointer rounded-lg border border-pf-grey/10 bg-white p-4 shadow-sm hover:border-pf-blue/40">
                                        <p className="font-sans text-sm font-semibold text-pf-black mb-2">Agendar call checkpoint mensal</p>
                                        <div className="flex items-center justify-between mt-3 text-xs text-pf-grey">
                                            <div className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-700">Baixa</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* IN PROGRESS */}
                            <div className="flex min-w-[320px] max-w-[320px] flex-col rounded-lg bg-blue-50/50 border border-pf-blue/20 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-pf-blue">Em Andamento <span className="text-pf-blue/70 ml-1 text-xs font-normal">1</span></h3>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="cursor-pointer rounded-lg border border-pf-blue/30 bg-white p-4 shadow-sm ring-1 ring-pf-blue/10">
                                        <p className="font-sans text-sm font-semibold text-pf-black mb-2">Elaboração planilhas Intercompany</p>
                                        <div className="flex items-center justify-between mt-3 text-xs text-pf-grey">
                                            <div className="rounded bg-orange-100 px-2 py-0.5 font-bold text-orange-700">Média</div>
                                            <div className="flex -space-x-1">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pf-black text-white text-[10px] ring-2 ring-white">CO</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DONE */}
                            <div className="flex min-w-[320px] max-w-[320px] flex-col rounded-lg bg-green-50/50 border border-green-200/50 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-green-800">Concluído <span className="text-green-700/70 ml-1 text-xs font-normal">0</span></h3>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TIME ENTRIES (HORAS) */}
                {activeTab === "horas" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="rounded-lg border border-pf-grey/10 bg-white p-6 shadow-sm">
                            <h3 className="font-sans text-lg font-bold tracking-tight text-pf-blue mb-6">Lançamento de Horas</h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-pf-grey/5 rounded border border-pf-grey/10 items-end">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Profissional</label>
                                    <select className="w-full rounded-md border border-pf-grey/30 p-2 text-sm focus:border-pf-blue outline-none">
                                        <option>Carlos Oliveira</option>
                                        <option>José Rafael Feiteiro</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Data</label>
                                    <input type="date" className="w-full rounded-md border border-pf-grey/30 p-2 text-sm focus:border-pf-blue outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Tempo (hh:mm)</label>
                                    <input type="text" placeholder="ex: 01:30" className="w-full rounded-md border border-pf-grey/30 p-2 text-sm focus:border-pf-blue outline-none" />
                                </div>
                                <div>
                                    <button className="w-full rounded bg-pf-blue p-2 font-bold text-white hover:bg-pf-black transition-colors">Lançar</button>
                                </div>
                                <div className="space-y-2 md:col-span-4 mt-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Descrição da Atividade</label>
                                    <input type="text" placeholder="Qual tarefa foi executada?" className="w-full rounded-md border border-pf-grey/30 p-2 text-sm focus:border-pf-blue outline-none" />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left font-sans text-sm">
                                    <thead>
                                        <tr className="border-b border-pf-grey/10 text-pf-grey text-xs uppercase tracking-wider">
                                            <th className="pb-2 font-semibold">Data</th>
                                            <th className="pb-2 font-semibold">Profissional</th>
                                            <th className="pb-2 font-semibold">Descrição</th>
                                            <th className="pb-2 font-semibold text-right">Tempo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-pf-grey/10">
                                        <tr className="hover:bg-pf-blue/5">
                                            <td className="py-3">25/02/2026</td>
                                            <td className="py-3 font-semibold text-pf-black">Carlos Oliveira</td>
                                            <td className="py-3 text-pf-grey">Setup do projeto e coleta de balancetes mensais.</td>
                                            <td className="py-3 text-right font-mono font-bold text-pf-blue">02:30</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-pf-grey/5">
                                            <td colSpan={3} className="py-3 text-right font-bold text-pf-black">TOTAL APONTADO:</td>
                                            <td className="py-3 text-right font-mono font-bold text-pf-blue">02:30</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
