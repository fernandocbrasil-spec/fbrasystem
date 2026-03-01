"use client";

import { useState } from "react";
import { Save, Eye, FileText, Upload, Plus } from "lucide-react";

export function ProposalEditor() {
    const [activeTab, setActiveTab] = useState("capa");

    // Mock State
    const [data, setData] = useState({
        title: "Assessoria Contábil e Fiscal",
        clientName: "Grupo Sequoia",
        date: "26 de fevereiro de 2026",
        fees: "11.150,00",
    });

    const TABS = [
        { id: "capa", label: "Capa & Metadados" },
        { id: "escopo", label: "Escopo & Escopo" },
        { id: "honorarios", label: "Honorários & Condições" },
        { id: "equipe", label: "Equipe Alocada" },
    ];

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">

            {/* SIDEBAR TABS */}
            <div className="lg:col-span-1 space-y-2">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border text-left font-sans text-sm transition-all ${activeTab === tab.id
                                ? "border-pf-blue bg-pf-blue/5 font-bold text-pf-blue shadow-sm"
                                : "border-pf-grey/10 bg-white text-pf-grey hover:border-pf-grey/30"
                            }`}
                    >
                        <span>{tab.label}</span>
                    </button>
                ))}

                <div className="pt-6">
                    <button className="w-full flex items-center justify-center gap-2 rounded-md bg-pf-black hover:bg-gray-800 text-white p-3 font-semibold text-sm transition-all">
                        <Eye className="h-4 w-4" />
                        Pré-visualizar PDF
                    </button>
                    <button className="w-full mt-3 flex items-center justify-center gap-2 rounded-md border border-pf-blue text-pf-blue hover:bg-pf-blue hover:text-white p-3 font-semibold text-sm transition-all">
                        <Save className="h-4 w-4" />
                        Salvar Rascunho
                    </button>
                </div>
            </div>

            {/* EDITOR AREA */}
            <div className="lg:col-span-3 rounded-lg border border-pf-grey/10 bg-white p-6 shadow-sm min-h-[500px]">
                {activeTab === "capa" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h3 className="font-sans text-lg font-bold uppercase tracking-tight text-pf-blue mb-4 border-b border-pf-grey/10 pb-2">
                                1. Capa e Metadados
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Nome do Cliente</label>
                                    <input type="text" className="w-full rounded-md border border-pf-grey/30 p-2.5 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue" value={data.clientName} onChange={e => setData({ ...data, clientName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Data da Proposta</label>
                                    <input type="text" className="w-full rounded-md border border-pf-grey/30 p-2.5 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue" value={data.date} onChange={e => setData({ ...data, date: e.target.value })} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold uppercase text-pf-grey">Título / Assunto</label>
                                    <input type="text" className="w-full rounded-md border border-pf-grey/30 p-2.5 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "escopo" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h3 className="font-sans text-lg font-bold uppercase tracking-tight text-pf-blue mb-4 border-b border-pf-grey/10 pb-2">
                                2. Escopo dos Serviços
                            </h3>
                            <div className="space-y-4">
                                <p className="text-xs text-pf-grey mb-2">Descreva os detalhes dos serviços que serão prestados. (Editor Rich Text)</p>
                                <div className="border border-pf-grey/30 rounded-md min-h-[250px] p-4 text-sm font-sans">
                                    <ul className="list-disc pl-5 space-y-2 text-pf-black">
                                        <li>Apuração de estimativa mensal de IRPJ e CSLL</li>
                                        <li>Auxílio no planejamento tributário</li>
                                        <li>Equalização de resultados entre as empresas do Grupo</li>
                                        <li>Revisão de operações intercompany</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "honorarios" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h3 className="font-sans text-lg font-bold uppercase tracking-tight text-pf-blue mb-4 border-b border-pf-grey/10 pb-2">
                                3. Honorários e Condições
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-pf-grey">Valor Livre de Tributos (R$)</label>
                                        <input type="text" className="w-full rounded-md border border-pf-grey/30 p-2.5 text-base font-bold outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue" value={data.fees} onChange={e => setData({ ...data, fees: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-pf-grey">Frequência</label>
                                        <select className="w-full rounded-md border border-pf-grey/30 p-2.5 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue">
                                            <option>Parcela Mensal Fixa</option>
                                            <option>Única Parcela (Pró-Labore)</option>
                                            <option>Horas Trabalhadas</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-pf-blue/5 border border-pf-blue/20 rounded-lg p-5">
                                    <h4 className="font-bold text-sm text-pf-black mb-3">Resumo Financeiro</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-pf-grey">
                                            <span>Carga Tributária (Estimada):</span>
                                            <span className="font-bold">14,53%</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-pf-blue pt-2 border-t border-pf-blue/10">
                                            <span>Valor Total Bruto (com impostos):</span>
                                            <span>R$ 13.045,51</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {activeTab === "equipe" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h3 className="font-sans text-lg font-bold uppercase tracking-tight text-pf-blue mb-4 border-b border-pf-grey/10 pb-2">
                                4. Equipe Alocada
                            </h3>
                            <p className="text-xs text-pf-grey mb-4">Selecione os sócios e profissionais que atuarão no projeto.</p>

                            <div className="flex items-center gap-4 rounded-lg border border-pf-blue/30 bg-pf-blue/5 p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-sans text-pf-blue font-bold ring-2 ring-pf-blue">
                                    RF
                                </div>
                                <div>
                                    <h4 className="font-bold text-pf-black">José Rafael Feiteiro</h4>
                                    <p className="text-xs text-pf-blue uppercase tracking-widest font-bold">Sócio | Tributário</p>
                                </div>
                            </div>

                            <button className="mt-4 flex items-center justify-center gap-2 rounded-md border border-dashed border-pf-grey/40 p-3 text-sm font-semibold text-pf-grey hover:border-pf-blue hover:text-pf-blue transition-all w-full">
                                <Plus className="h-4 w-4" />
                                Adicionar Profissional
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
