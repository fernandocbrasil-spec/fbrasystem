"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { Settings2, Users, MapPin, Database, Plus, Mail, X, type LucideIcon } from "lucide-react";

type TabId = "geral" | "usuarios" | "cadastros";
type Tab = { id: TabId; title: string; Icon: LucideIcon; desc: string };
type Usuario = { nome: string; role: string; email: string; status: "Ativo" | "Pendente" };

const tabs: Tab[] = [
    { id: "geral", title: "Visao Geral", Icon: Settings2, desc: "Dados matriz, logo e parametros." },
    { id: "usuarios", title: "Usuarios & Equipe", Icon: Users, desc: "Gerenciar contas e integracoes." },
    { id: "cadastros", title: "Cadastros Base", Icon: Database, desc: "Categorias financeiras e bancos." },
];

const initialUsuarios: Usuario[] = [
    { nome: "Rafael Feiteiro", role: "Socio Administrador", email: "rafael@pf.adv.br", status: "Ativo" },
    { nome: "Ana Costa", role: "Advogada Plena", email: "ana@pf.adv.br", status: "Pendente" },
    { nome: "Carlos Souza", role: "Financeiro", email: "financeiro@pf.adv.br", status: "Ativo" },
];

const statusBadge: Record<Usuario["status"], string> = {
    Ativo: "bg-green-100 text-green-700",
    Pendente: "bg-orange-100 text-orange-700",
};

const inputClass =
    "w-full border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded";

const STORAGE_KEY = "pf-settings-general";
const CC_KEY = "pf-settings-cc";
const BANK_KEY = "pf-settings-banks";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabId>("geral");
    const { toast } = useToast();

    // General settings with persistence
    const [razaoSocial, setRazaoSocial] = useState("Peixoto Feiteiro Sociedade de Advogados");
    const [cnpj, setCnpj] = useState("12.345.678/0001-90");
    const [endereco, setEndereco] = useState("Av. Faria Lima, 3000 - Itaim Bibi, Sao Paulo - SP");
    const [savedGeneral, setSavedGeneral] = useState({ razaoSocial: "", cnpj: "", endereco: "" });

    // Users
    const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("Advogado(a)");

    // Cadastros
    const [centrosDeCusto, setCentrosDeCusto] = useState(["1. Administrativo", "2. Juridico SP", "3. Comercial"]);
    const [contasBancarias, setContasBancarias] = useState(["Itau (Principal) — 1234-5", "BTG (Invest.) — 555-1"]);
    const [editingCC, setEditingCC] = useState<number | null>(null);
    const [editingBank, setEditingBank] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const [showAddCC, setShowAddCC] = useState(false);
    const [showAddBank, setShowAddBank] = useState(false);
    const [newValue, setNewValue] = useState("");

    // Load saved settings
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                setRazaoSocial(data.razaoSocial);
                setCnpj(data.cnpj);
                setEndereco(data.endereco);
                setSavedGeneral(data);
            } else {
                setSavedGeneral({ razaoSocial, cnpj, endereco });
            }
            const cc = localStorage.getItem(CC_KEY);
            if (cc) setCentrosDeCusto(JSON.parse(cc));
            const banks = localStorage.getItem(BANK_KEY);
            if (banks) setContasBancarias(JSON.parse(banks));
        } catch { /* noop */ }
    }, []);

    const handleSaveGeneral = () => {
        const data = { razaoSocial, cnpj, endereco };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSavedGeneral(data);
        toast("Configuracoes salvas com sucesso", "success");
    };

    const handleDiscardGeneral = () => {
        setRazaoSocial(savedGeneral.razaoSocial);
        setCnpj(savedGeneral.cnpj);
        setEndereco(savedGeneral.endereco);
        toast("Alteracoes descartadas", "info");
    };

    const handleInvite = () => {
        if (!inviteEmail.includes("@")) { toast("Email invalido", "error"); return; }
        setUsuarios([...usuarios, { nome: inviteEmail.split("@")[0], role: inviteRole, email: inviteEmail, status: "Pendente" }]);
        setShowInvite(false);
        setInviteEmail("");
        toast(`Convite enviado para ${inviteEmail}`, "success");
    };

    const handleSaveCC = (idx: number) => {
        const next = [...centrosDeCusto];
        next[idx] = editValue;
        setCentrosDeCusto(next);
        localStorage.setItem(CC_KEY, JSON.stringify(next));
        setEditingCC(null);
        toast("Centro de custo atualizado", "success");
    };

    const handleAddCC = () => {
        if (!newValue.trim()) return;
        const next = [...centrosDeCusto, `${centrosDeCusto.length + 1}. ${newValue.trim()}`];
        setCentrosDeCusto(next);
        localStorage.setItem(CC_KEY, JSON.stringify(next));
        setNewValue("");
        setShowAddCC(false);
        toast("Centro de custo adicionado", "success");
    };

    const handleSaveBank = (idx: number) => {
        const next = [...contasBancarias];
        next[idx] = editValue;
        setContasBancarias(next);
        localStorage.setItem(BANK_KEY, JSON.stringify(next));
        setEditingBank(null);
        toast("Conta bancaria atualizada", "success");
    };

    const handleAddBank = () => {
        if (!newValue.trim()) return;
        const next = [...contasBancarias, newValue.trim()];
        setContasBancarias(next);
        localStorage.setItem(BANK_KEY, JSON.stringify(next));
        setNewValue("");
        setShowAddBank(false);
        toast("Conta bancaria adicionada", "success");
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">Configuracoes do Sistema</span>
                </div>
                <PageHeader
                    title="Configuracoes"
                    subtitle="Administracao central do ERP Peixoto Feiteiro Advogados."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Nav lateral */}
                <div className="lg:col-span-1 bg-white border border-pf-grey/20 rounded">
                    {tabs.map((t, i) => {
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                aria-current={isActive ? "page" : undefined}
                                className={`w-full text-left px-4 py-3 flex items-start gap-3 border-l-2 transition-colors ${i > 0 ? "border-t border-pf-grey/10" : ""} ${isActive ? "border-l-pf-blue bg-pf-blue/5" : "border-l-transparent hover:bg-pf-grey/5"}`}
                            >
                                <t.Icon className={`mt-0.5 h-4 w-4 ${isActive ? "text-pf-blue" : "text-pf-grey"}`} aria-hidden="true" />
                                <div>
                                    <p className={`font-sans text-sm font-bold ${isActive ? "text-pf-blue" : "text-pf-black"}`}>
                                        {t.title}
                                    </p>
                                    <p className="text-[10px] text-pf-grey mt-0.5 uppercase tracking-wider">{t.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Conteudo */}
                <div className="lg:col-span-3">

                    {/* GERAL */}
                    {activeTab === "geral" && (
                        <div>
                            <div className="pb-3 mb-5 border-b border-pf-grey/20">
                                <h3 className="font-sans text-sm font-bold text-pf-black">Informacoes da Firma</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey mt-0.5">Dados matriz e dados base</p>
                            </div>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="razao-social" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Razao Social</label>
                                        <input id="razao-social" type="text" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="cnpj" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">CNPJ</label>
                                        <input id="cnpj" type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className={`${inputClass} font-mono`} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="endereco" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Endereco (Matriz)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                                        <input id="endereco" type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className={`${inputClass} pl-10`} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 border-t border-pf-grey/10 pt-4">
                                    <button onClick={handleDiscardGeneral} className="rounded-md border border-pf-grey/20 bg-white px-6 py-2.5 font-sans text-sm font-bold text-pf-grey hover:bg-pf-grey/5 transition-all">
                                        Descartar
                                    </button>
                                    <button onClick={handleSaveGeneral} className="rounded-md bg-pf-blue px-6 py-2.5 font-sans text-sm font-bold text-white hover:bg-blue-800 transition-all shadow-sm">
                                        Salvar Alteracoes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USUARIOS */}
                    {activeTab === "usuarios" && (
                        <div>
                            <div className="pb-3 mb-1 border-b border-pf-grey/20 flex items-center justify-between">
                                <div>
                                    <h3 className="font-sans text-sm font-bold text-pf-black">Equipe e Permissoes</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey mt-0.5">
                                        Autenticados via Entra ID (Azure)
                                    </p>
                                </div>
                                <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 rounded-md bg-pf-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-gray-800 transition-colors">
                                    <Plus className="h-3 w-3" aria-hidden="true" /> Convidar Membro
                                </button>
                            </div>

                            {/* Invite form */}
                            {showInvite && (
                                <div className="border border-pf-blue/20 bg-pf-blue/5 p-4 my-3 rounded space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-pf-black">Novo Convite</span>
                                        <button onClick={() => setShowInvite(false)}><X className="h-4 w-4 text-pf-grey" /></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" className={inputClass} />
                                        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={inputClass}>
                                            <option>Advogado(a)</option>
                                            <option>Estagiario(a)</option>
                                            <option>Financeiro</option>
                                            <option>Administrador</option>
                                        </select>
                                        <button onClick={handleInvite} className="rounded-md bg-pf-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 transition-all">
                                            Enviar Convite
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="divide-y divide-pf-grey/15">
                                {usuarios.map((usr) => (
                                    <div key={usr.email} className="flex items-center justify-between py-4 hover:bg-white transition-colors -mx-2 px-2">
                                        <div className="flex items-center gap-4">
                                            <div className="h-9 w-9 flex items-center justify-center bg-pf-blue/10 text-pf-blue font-bold text-sm" aria-hidden="true">
                                                {usr.nome.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-sans font-bold text-sm text-pf-black">{usr.nome}</p>
                                                <p className="text-xs text-pf-grey flex items-center gap-1 mt-0.5">
                                                    <Mail className="h-3 w-3" aria-hidden="true" /> {usr.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-pf-grey">{usr.role}</span>
                                            <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest rounded-sm ${statusBadge[usr.status]}`}>
                                                {usr.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CADASTROS */}
                    {activeTab === "cadastros" && (
                        <div>
                            <div className="pb-3 mb-5 border-b border-pf-grey/20">
                                <h3 className="font-sans text-sm font-bold text-pf-black">Cadastros Estruturais</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey mt-0.5">
                                    Listas suspensas usadas no ERP
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Centros de Custo */}
                                <div>
                                    <h4 className="font-sans text-sm font-bold text-pf-black mb-3">Centros de Custo</h4>
                                    <div className="divide-y divide-pf-grey/15">
                                        {centrosDeCusto.map((cc, i) => (
                                            <div key={i} className="flex justify-between items-center py-2.5 text-xs text-pf-grey">
                                                {editingCC === i ? (
                                                    <div className="flex gap-2 flex-1">
                                                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 border border-pf-blue/30 px-2 py-1 text-xs rounded outline-none" autoFocus />
                                                        <button onClick={() => handleSaveCC(i)} className="text-pf-blue font-bold text-[10px]">Salvar</button>
                                                        <button onClick={() => setEditingCC(null)} className="text-pf-grey font-bold text-[10px]">Cancelar</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span>{cc}</span>
                                                        <button onClick={() => { setEditingCC(i); setEditValue(cc); }} className="text-pf-blue font-bold text-[10px] uppercase tracking-widest hover:text-pf-black transition-colors">Editar</button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {showAddCC ? (
                                        <div className="flex gap-2 mt-3">
                                            <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Nome do centro de custo" className="flex-1 border border-pf-blue/30 px-2 py-1.5 text-xs rounded outline-none" autoFocus />
                                            <button onClick={handleAddCC} className="text-pf-blue font-bold text-[10px]">Salvar</button>
                                            <button onClick={() => { setShowAddCC(false); setNewValue(""); }} className="text-pf-grey font-bold text-[10px]">Cancelar</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowAddCC(true)} className="mt-3 text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors">
                                            + Adicionar CC
                                        </button>
                                    )}
                                </div>

                                {/* Contas Bancarias */}
                                <div>
                                    <h4 className="font-sans text-sm font-bold text-pf-black mb-3">Contas Bancarias</h4>
                                    <div className="divide-y divide-pf-grey/15">
                                        {contasBancarias.map((ct, i) => (
                                            <div key={i} className="flex justify-between items-center py-2.5 text-xs text-pf-grey">
                                                {editingBank === i ? (
                                                    <div className="flex gap-2 flex-1">
                                                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 border border-pf-blue/30 px-2 py-1 text-xs rounded outline-none" autoFocus />
                                                        <button onClick={() => handleSaveBank(i)} className="text-pf-blue font-bold text-[10px]">Salvar</button>
                                                        <button onClick={() => setEditingBank(null)} className="text-pf-grey font-bold text-[10px]">Cancelar</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span>{ct}</span>
                                                        <button onClick={() => { setEditingBank(i); setEditValue(ct); }} className="text-pf-blue font-bold text-[10px] uppercase tracking-widest hover:text-pf-black transition-colors">Editar</button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {showAddBank ? (
                                        <div className="flex gap-2 mt-3">
                                            <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Banco (Tipo) — Agencia-Conta" className="flex-1 border border-pf-blue/30 px-2 py-1.5 text-xs rounded outline-none" autoFocus />
                                            <button onClick={handleAddBank} className="text-pf-blue font-bold text-[10px]">Salvar</button>
                                            <button onClick={() => { setShowAddBank(false); setNewValue(""); }} className="text-pf-grey font-bold text-[10px]">Cancelar</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowAddBank(true)} className="mt-3 text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors">
                                            + Adicionar Conta
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
