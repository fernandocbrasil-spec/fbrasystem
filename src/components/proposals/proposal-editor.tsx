"use client";

import { useState, useEffect } from "react";
import { Save, Eye, Plus, X, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const DRAFT_KEY = "pf-proposal-draft";

type EditorData = {
    title: string;
    clientName: string;
    date: string;
    fees: string;
};

type Professional = {
    id: string;
    name: string;
    role: string;
};

const DEFAULT_DATA: EditorData = {
    title: "Assessoria Contábil e Fiscal",
    clientName: "Grupo Sequoia",
    date: "26 de fevereiro de 2026",
    fees: "11.150,00",
};

const DEFAULT_PROFESSIONALS: Professional[] = [
    { id: "1", name: "José Rafael Feiteiro", role: "Sócio | Tributário" },
];

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type ProposalEditorProps = {
    initialClient?: string;
    initialContact?: string;
    initialValue?: string;
    fromLeadId?: string;
};

export function ProposalEditor({ initialClient, initialContact, initialValue, fromLeadId }: ProposalEditorProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("capa");
    const [data, setData] = useState<EditorData>(() => {
        if (initialClient) {
            return {
                ...DEFAULT_DATA,
                clientName: initialClient,
                fees: initialValue?.replace(/R\$\s?/, "").trim() || DEFAULT_DATA.fees,
            };
        }
        return DEFAULT_DATA;
    });
    const [professionals, setProfessionals] = useState<Professional[]>(DEFAULT_PROFESSIONALS);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProfName, setNewProfName] = useState("");
    const [newProfRole, setNewProfRole] = useState("");

    // Load draft from localStorage on mount (only if not pre-filled from lead)
    useEffect(() => {
        if (fromLeadId) return; // Skip draft loading when converting from lead
        try {
            const stored = localStorage.getItem(DRAFT_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.data) setData(parsed.data);
                if (parsed.professionals && Array.isArray(parsed.professionals)) {
                    setProfessionals(parsed.professionals);
                }
            }
        } catch {
            // ignore parse errors, use defaults
        }
    }, [fromLeadId]);

    const handlePreviewPdf = () => {
        toast("Abrindo pré-visualização para impressão...", "info");
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleSaveDraft = () => {
        try {
            const draft = { data, professionals, savedAt: new Date().toISOString() };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            toast("Rascunho salvo com sucesso", "success");
        } catch {
            toast("Erro ao salvar rascunho", "error");
        }
    };

    const handleAddProfessional = () => {
        const name = newProfName.trim();
        const role = newProfRole.trim();
        if (!name) {
            toast("Informe o nome do profissional", "warning");
            return;
        }
        const newProf: Professional = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name,
            role: role || "Advogado(a)",
        };
        setProfessionals((prev) => [...prev, newProf]);
        setNewProfName("");
        setNewProfRole("");
        setShowAddForm(false);
        toast(`${name} adicionado(a) à equipe`, "success");
    };

    const handleRemoveProfessional = (id: string) => {
        setProfessionals((prev) => prev.filter((p) => p.id !== id));
        toast("Profissional removido da equipe", "info");
    };

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
                    <button
                        onClick={handlePreviewPdf}
                        className="w-full flex items-center justify-center gap-2 rounded-md bg-pf-black hover:bg-gray-800 text-white p-3 font-semibold text-sm transition-all"
                    >
                        <Eye className="h-4 w-4" />
                        Pré-visualizar PDF
                    </button>
                    <button
                        onClick={handleSaveDraft}
                        className="w-full mt-3 flex items-center justify-center gap-2 rounded-md border border-pf-blue text-pf-blue hover:bg-pf-blue hover:text-white p-3 font-semibold text-sm transition-all"
                    >
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

                            <div className="space-y-3">
                                {professionals.map((prof) => (
                                    <div key={prof.id} className="flex items-center gap-4 rounded-lg border border-pf-blue/30 bg-pf-blue/5 p-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-sans text-pf-blue font-bold ring-2 ring-pf-blue">
                                            {getInitials(prof.name)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-pf-black">{prof.name}</h4>
                                            <p className="text-xs text-pf-blue uppercase tracking-widest font-bold">{prof.role}</p>
                                        </div>
                                        {professionals.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveProfessional(prof.id)}
                                                className="p-1.5 text-pf-grey hover:text-red-500 transition-colors"
                                                aria-label={`Remover ${prof.name}`}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {showAddForm ? (
                                <div className="mt-4 rounded-lg border border-pf-blue/30 bg-white p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-xs font-bold uppercase text-pf-grey">Novo Profissional</h4>
                                        <button
                                            onClick={() => { setShowAddForm(false); setNewProfName(""); setNewProfRole(""); }}
                                            className="p-1 text-pf-grey hover:text-pf-black transition-colors"
                                            aria-label="Cancelar"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-pf-grey">Nome completo</label>
                                            <input
                                                type="text"
                                                value={newProfName}
                                                onChange={(e) => setNewProfName(e.target.value)}
                                                placeholder="Ex: Maria Silva"
                                                className="w-full rounded-md border border-pf-grey/30 p-2 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue"
                                                autoFocus
                                                onKeyDown={(e) => { if (e.key === "Enter") handleAddProfessional(); }}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-pf-grey">Cargo / Área</label>
                                            <input
                                                type="text"
                                                value={newProfRole}
                                                onChange={(e) => setNewProfRole(e.target.value)}
                                                placeholder="Ex: Sócio | Trabalhista"
                                                className="w-full rounded-md border border-pf-grey/30 p-2 text-sm outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue"
                                                onKeyDown={(e) => { if (e.key === "Enter") handleAddProfessional(); }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddProfessional}
                                        className="flex items-center justify-center gap-2 rounded-md bg-pf-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Confirmar
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="mt-4 flex items-center justify-center gap-2 rounded-md border border-dashed border-pf-grey/40 p-3 text-sm font-semibold text-pf-grey hover:border-pf-blue hover:text-pf-blue transition-all w-full"
                                >
                                    <Plus className="h-4 w-4" />
                                    Adicionar Profissional
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
