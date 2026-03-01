"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Settings2, Users, Receipt, Shield, MapPin, Database, Plus, Mail, type LucideIcon } from "lucide-react";

type TabId = "geral" | "usuarios" | "cadastros" | "faturamento" | "seguranca";
type Tab = { id: TabId; title: string; Icon: LucideIcon; desc: string };
type Usuario = { nome: string; role: string; email: string; status: "Ativo" | "Pendente" };
type AuditLog = { acao: string; usuario: string; hora: string; tipo: "WARNING" | "INFO" | "CRITICAL" };

const tabs: Tab[] = [
    { id: "geral", title: "Visão Geral", Icon: Settings2, desc: "Dados matriz, logo e parâmetros." },
    { id: "usuarios", title: "Usuários & Equipe", Icon: Users, desc: "Gerenciar contas e integrações." },
    { id: "cadastros", title: "Cadastros Base", Icon: Database, desc: "Categorias financeiras e Bancos." },
    { id: "faturamento", title: "Faturamento & NF", Icon: Receipt, desc: "Certificação e Alíquotas NFSe." },
    { id: "seguranca", title: "Segurança & Logs", Icon: Shield, desc: "Trilha de auditoria e sessões." },
];

const usuarios: Usuario[] = [
    { nome: "Rafael Feiteiro", role: "Sócio Administrador", email: "rafael@pf.adv.br", status: "Ativo" },
    { nome: "Ana Costa", role: "Advogada Plena", email: "ana@pf.adv.br", status: "Pendente" },
    { nome: "Carlos Souza", role: "Financeiro", email: "financeiro@pf.adv.br", status: "Ativo" },
];

const auditLogs: AuditLog[] = [
    { acao: "Downgrade de proposta 'TechCorp BR'", usuario: "Ana Costa", hora: "Hoje, 10:45", tipo: "WARNING" },
    { acao: "Gerou NFSe Válida #4092", usuario: "Financeiro", hora: "Hoje, 09:12", tipo: "INFO" },
    { acao: "Exclusão do Cliente 'XYZ'", usuario: "Rafael Feiteiro", hora: "Ontem, 16:30", tipo: "CRITICAL" },
];

const centrosDeCusto = ["1. Administrativo", "2. Jurídico SP", "3. Comercial"];
const contasBancarias = ["Itaú (Principal) — 1234-5", "BTG (Invest.) — 555-1"];

const auditDotColor: Record<AuditLog["tipo"], string> = {
    WARNING: "bg-orange-500",
    CRITICAL: "bg-red-500",
    INFO: "bg-blue-500",
};

const statusBadge: Record<Usuario["status"], string> = {
    Ativo: "bg-green-100 text-green-700",
    Pendente: "bg-orange-100 text-orange-700",
};

const inputClass =
    "w-full border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabId>("geral");

    return (
        <div className="space-y-6">
            <PageHeader
                title="Configurações do Sistema"
                subtitle="Administração central do ERP Peixoto Feiteiro Advogados."
            />

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

                {/* Conteúdo */}
                <div className="lg:col-span-3">

                    {/* GERAL */}
                    {activeTab === "geral" && (
                        <div>
                            <div className="pb-3 mb-5 border-b border-pf-grey/20">
                                <h3 className="font-sans text-sm font-bold text-pf-black">Informações da Firma</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey mt-0.5">Dados matriz e dados base</p>
                            </div>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="razao-social" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Razão Social</label>
                                        <input id="razao-social" type="text" defaultValue="Peixoto Feiteiro Sociedade de Advogados" className={inputClass} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="cnpj" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">CNPJ</label>
                                        <input id="cnpj" type="text" defaultValue="12.345.678/0001-90" className={`${inputClass} font-mono`} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="endereco" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Endereço (Matriz)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                                        <input id="endereco" type="text" defaultValue="Av. Faria Lima, 3000 - Itaim Bibi, São Paulo - SP" className={`${inputClass} pl-10`} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 border-t border-pf-grey/10 pt-4">
                                    <button className="rounded-md border border-pf-grey/20 bg-white px-6 py-2.5 font-sans text-sm font-bold text-pf-grey hover:bg-pf-grey/5 transition-all">
                                        Descartar
                                    </button>
                                    <button className="rounded-md bg-pf-blue px-6 py-2.5 font-sans text-sm font-bold text-white hover:bg-blue-800 transition-all shadow-sm">
                                        Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USUÁRIOS */}
                    {activeTab === "usuarios" && (
                        <div>
                            <div className="pb-3 mb-1 border-b border-pf-grey/20 flex items-center justify-between">
                                <div>
                                    <h3 className="font-sans text-sm font-bold text-pf-black">Equipe e Permissões</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey mt-0.5">
                                        Autenticados via Entra ID (Azure)
                                    </p>
                                </div>
                                <button className="flex items-center gap-2 rounded-md bg-pf-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-gray-800 transition-colors">
                                    <Plus className="h-3 w-3" aria-hidden="true" /> Convidar Membro
                                </button>
                            </div>
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
                                <div>
                                    <h4 className="font-sans text-sm font-bold text-pf-black mb-3">Centros de Custo</h4>
                                    <div className="divide-y divide-pf-grey/15">
                                        {centrosDeCusto.map((cc) => (
                                            <div key={cc} className="flex justify-between py-2.5 text-xs text-pf-grey">
                                                <span>{cc}</span>
                                                <button className="text-pf-blue font-bold text-[10px] uppercase tracking-widest hover:text-pf-black transition-colors">Editar</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-3 text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors">
                                        + Adicionar CC
                                    </button>
                                </div>
                                <div>
                                    <h4 className="font-sans text-sm font-bold text-pf-black mb-3">Contas Bancárias</h4>
                                    <div className="divide-y divide-pf-grey/15">
                                        {contasBancarias.map((ct) => (
                                            <div key={ct} className="flex justify-between py-2.5 text-xs text-pf-grey">
                                                <span>{ct}</span>
                                                <button className="text-pf-blue font-bold text-[10px] uppercase tracking-widest hover:text-pf-black transition-colors">Editar</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-3 text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors">
                                        + Adicionar Conta
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FATURAMENTO */}
                    {activeTab === "faturamento" && (
                        <div>
                            <div className="pb-3 mb-5 border-b border-pf-grey/20">
                                <h3 className="font-sans text-sm font-bold text-pf-black">Certificado Digital (A1) e NFS-e</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey mt-0.5">
                                    Integração Prefeitura de São Paulo — SP
                                </p>
                            </div>
                            <div className="space-y-5">
                                <div className="flex items-center justify-between p-4 border border-dashed border-pf-grey/30 bg-pf-grey/5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 flex items-center justify-center bg-green-100 text-green-700">
                                            <Shield className="h-5 w-5" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="font-sans text-sm font-bold text-pf-black">Certificado Ativo</p>
                                            <p className="font-mono text-[10px] text-pf-grey mt-0.5">Vencimento: 15/10/2026</p>
                                        </div>
                                    </div>
                                    <button className="font-sans text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors">
                                        Renovar Upload
                                    </button>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="cod-servico" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Código de Serviço Padrão</label>
                                    <input id="cod-servico" type="text" defaultValue="017.014 - Advocacia" className={`${inputClass} max-w-md`} />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="aliquota" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Alíquota (Simples Nacional %)</label>
                                    <input id="aliquota" type="text" defaultValue="14.53" className={`${inputClass} font-mono max-w-[120px]`} />
                                </div>
                                <button className="rounded-md bg-pf-blue px-6 py-2.5 font-sans text-sm font-bold text-white hover:bg-blue-800 transition-all shadow-sm">
                                    Salvar Parâmetros Fiscais
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SEGURANÇA */}
                    {activeTab === "seguranca" && (
                        <div className="bg-pf-black rounded border border-pf-black">
                            <div className="px-5 py-3.5 border-b border-white/10">
                                <h3 className="font-sans text-sm font-bold text-white">Trilha de Auditoria</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey/50 mt-0.5">
                                    Ações críticas registradas pelo sistema
                                </p>
                            </div>
                            <div className="divide-y divide-white/5">
                                {auditLogs.map((log) => (
                                    <div key={`${log.usuario}-${log.hora}`} className="flex justify-between items-center px-5 py-4 text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${auditDotColor[log.tipo]}`} aria-hidden="true" />
                                            <span className="text-white/90 text-xs">{log.acao}</span>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <span className="text-white/50 text-xs block">{log.usuario}</span>
                                            <span className="text-white/30 text-[10px] font-mono">{log.hora}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
