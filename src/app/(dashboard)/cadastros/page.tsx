"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { Database, Building2, UserCircle, Users, Briefcase, Landmark, Truck, Plus, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Empresa = { id: number; razaoSocial: string; cnpj: string; tipo: string };
type Socio = { id: number; nome: string; cpf: string; participacao: string };
type Colaborador = { id: number; nome: string; email: string; cargo: string };
type CentroCusto = { id: number; codigo: string; nome: string; tipo: string };
type ContaBancaria = { id: number; banco: string; agencia: string; conta: string; tipo: string };
type Fornecedor = { id: number; nome: string; cnpj: string; categoria: string; contato: string };

/* ------------------------------------------------------------------ */
/*  Initial mock data                                                  */
/* ------------------------------------------------------------------ */

const initEmpresas: Empresa[] = [
    { id: 1, razaoSocial: "PF Advogados Associados Ltda", cnpj: "12.345.678/0001-90", tipo: "Matriz" },
    { id: 2, razaoSocial: "PF Consultoria Tributaria Ltda", cnpj: "12.345.678/0002-71", tipo: "Filial" },
    { id: 3, razaoSocial: "PF Participacoes S.A.", cnpj: "98.765.432/0001-10", tipo: "Holding" },
];

const initSocios: Socio[] = [
    { id: 1, nome: "Jose Rafael Feiteiro", cpf: "123.456.789-00", participacao: "50%" },
    { id: 2, nome: "Carlos Oliveira", cpf: "987.654.321-00", participacao: "30%" },
    { id: 3, nome: "Ana Beatriz Sousa", cpf: "456.789.123-00", participacao: "20%" },
];

const initColaboradores: Colaborador[] = [
    { id: 1, nome: "Mariana Silva", email: "mariana@pfadvogados.com.br", cargo: "Analista Contabil" },
    { id: 2, nome: "Pedro Santos", email: "pedro@pfadvogados.com.br", cargo: "Assistente Juridico" },
    { id: 3, nome: "Fernanda Costa", email: "fernanda@pfadvogados.com.br", cargo: "Gerente Financeiro" },
    { id: 4, nome: "Lucas Almeida", email: "lucas@pfadvogados.com.br", cargo: "Estagiario" },
];

const initCentrosCusto: CentroCusto[] = [
    { id: 1, codigo: "CC-001", nome: "Contencioso Civil", tipo: "Caso" },
    { id: 2, codigo: "CC-002", nome: "Consultoria Tributaria", tipo: "Centro de Custo" },
    { id: 3, codigo: "CC-003", nome: "Administrativo", tipo: "Centro de Custo" },
    { id: 4, codigo: "CC-004", nome: "Trabalhista - Grupo Sequoia", tipo: "Caso" },
];

const initContasBancarias: ContaBancaria[] = [
    { id: 1, banco: "Itau", agencia: "0123", conta: "45678-9", tipo: "Corrente" },
    { id: 2, banco: "Bradesco", agencia: "0456", conta: "12345-6", tipo: "Corrente" },
    { id: 3, banco: "BTG Pactual", agencia: "0001", conta: "78901-2", tipo: "Investimento" },
];

const initFornecedores: Fornecedor[] = [
    { id: 1, nome: "Amazon Web Services (AWS)", cnpj: "23.412.247/0001-10", categoria: "Infraestrutura", contato: "aws-billing@amazon.com" },
    { id: 2, nome: "WeWork Coworking", cnpj: "24.884.199/0001-70", categoria: "Aluguel & Condominio", contato: "faturamento@wework.com" },
    { id: 3, nome: "Google Workspace", cnpj: "06.990.590/0001-23", categoria: "Licencas de Software", contato: "billing@google.com" },
    { id: 4, nome: "Thomson Reuters", cnpj: "02.456.829/0001-67", categoria: "Assinaturas & Livros", contato: "assinaturas@tr.com" },
];

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS = [
    { id: "empresas", label: "Empresas", icon: Building2 },
    { id: "socios", label: "Socios", icon: UserCircle },
    { id: "colaboradores", label: "Colaboradores", icon: Users },
    { id: "centros", label: "Centro de Custo / Caso", icon: Briefcase },
    { id: "contas", label: "Contas Bancarias", icon: Landmark },
    { id: "fornecedores", label: "Fornecedores", icon: Truck },
] as const;

type TabId = (typeof TABS)[number]["id"];

const inputClass =
    "border border-pf-grey/20 bg-pf-grey/5 p-2 text-sm font-sans text-pf-black outline-none focus:border-pf-blue rounded";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CadastrosPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabId>("empresas");

    /* State for each entity */
    const [empresas, setEmpresas] = useState<Empresa[]>(initEmpresas);
    const [socios, setSocios] = useState<Socio[]>(initSocios);
    const [colaboradores, setColaboradores] = useState<Colaborador[]>(initColaboradores);
    const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>(initCentrosCusto);
    const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>(initContasBancarias);
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>(initFornecedores);

    /* Add-form visibility */
    const [showAdd, setShowAdd] = useState(false);

    /* Edit state: which row id is being edited */
    const [editingId, setEditingId] = useState<number | null>(null);

    /* Draft state for add/edit forms */
    const [draft, setDraft] = useState<Record<string, string>>({});

    const resetForm = () => {
        setShowAdd(false);
        setEditingId(null);
        setDraft({});
    };

    const nextId = (arr: { id: number }[]) => Math.max(0, ...arr.map((a) => a.id)) + 1;

    /* ------------------------------------------------------------ */
    /*  EMPRESAS                                                     */
    /* ------------------------------------------------------------ */

    const renderEmpresas = () => (
        <>
            <table className="w-full text-left font-sans text-sm">
                <thead>
                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                        <th className="pb-2 pr-4">Razao Social</th>
                        <th className="pb-2 pr-4">CNPJ</th>
                        <th className="pb-2 pr-4">Tipo</th>
                        <th className="pb-2 text-right">Acoes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pf-grey/10">
                    {empresas.map((e) =>
                        editingId === e.id ? (
                            <tr key={e.id} className="bg-pf-grey/5">
                                <td className="py-2 pr-2">
                                    <input className={inputClass + " w-full"} value={draft.razaoSocial ?? e.razaoSocial} onChange={(ev) => setDraft({ ...draft, razaoSocial: ev.target.value })} />
                                </td>
                                <td className="py-2 pr-2">
                                    <input className={inputClass + " w-full"} value={draft.cnpj ?? e.cnpj} onChange={(ev) => setDraft({ ...draft, cnpj: ev.target.value })} />
                                </td>
                                <td className="py-2 pr-2">
                                    <input className={inputClass + " w-full"} value={draft.tipo ?? e.tipo} onChange={(ev) => setDraft({ ...draft, tipo: ev.target.value })} />
                                </td>
                                <td className="py-2 text-right space-x-2">
                                    <button onClick={() => { setEmpresas(empresas.map((x) => x.id === e.id ? { ...x, razaoSocial: draft.razaoSocial ?? x.razaoSocial, cnpj: draft.cnpj ?? x.cnpj, tipo: draft.tipo ?? x.tipo } : x)); toast("Empresa atualizada", "success"); resetForm(); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Salvar</button>
                                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black">Cancelar</button>
                                </td>
                            </tr>
                        ) : (
                            <tr key={e.id} className="hover:bg-white transition-colors">
                                <td className="py-3 pr-4 font-bold text-pf-black">{e.razaoSocial}</td>
                                <td className="py-3 pr-4 font-mono text-xs text-pf-grey">{e.cnpj}</td>
                                <td className="py-3 pr-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-pf-grey">{e.tipo}</span>
                                </td>
                                <td className="py-3 text-right space-x-3">
                                    <button onClick={() => { setEditingId(e.id); setDraft({ razaoSocial: e.razaoSocial, cnpj: e.cnpj, tipo: e.tipo }); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Editar</button>
                                    <button onClick={() => { setEmpresas(empresas.filter((x) => x.id !== e.id)); toast("Empresa removida", "success"); }} className="text-xs font-bold text-red-600 hover:text-red-800">Excluir</button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
            {showAdd && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Razao Social" className={inputClass} value={draft.newRazao ?? ""} onChange={(ev) => setDraft({ ...draft, newRazao: ev.target.value })} />
                    <input placeholder="CNPJ" className={inputClass} value={draft.newCnpj ?? ""} onChange={(ev) => setDraft({ ...draft, newCnpj: ev.target.value })} />
                    <input placeholder="Tipo" className={inputClass} value={draft.newTipo ?? ""} onChange={(ev) => setDraft({ ...draft, newTipo: ev.target.value })} />
                    <button onClick={() => { if (!draft.newRazao) return; setEmpresas([...empresas, { id: nextId(empresas), razaoSocial: draft.newRazao, cnpj: draft.newCnpj ?? "", tipo: draft.newTipo ?? "" }]); toast("Empresa adicionada", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </>
    );

    /* ------------------------------------------------------------ */
    /*  SOCIOS                                                       */
    /* ------------------------------------------------------------ */

    const renderSocios = () => (
        <>
            <table className="w-full text-left font-sans text-sm">
                <thead>
                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                        <th className="pb-2 pr-4">Nome</th>
                        <th className="pb-2 pr-4">CPF</th>
                        <th className="pb-2 pr-4">Participacao %</th>
                        <th className="pb-2 text-right">Acoes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pf-grey/10">
                    {socios.map((s) =>
                        editingId === s.id ? (
                            <tr key={s.id} className="bg-pf-grey/5">
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.nome ?? s.nome} onChange={(ev) => setDraft({ ...draft, nome: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.cpf ?? s.cpf} onChange={(ev) => setDraft({ ...draft, cpf: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.participacao ?? s.participacao} onChange={(ev) => setDraft({ ...draft, participacao: ev.target.value })} /></td>
                                <td className="py-2 text-right space-x-2">
                                    <button onClick={() => { setSocios(socios.map((x) => x.id === s.id ? { ...x, nome: draft.nome ?? x.nome, cpf: draft.cpf ?? x.cpf, participacao: draft.participacao ?? x.participacao } : x)); toast("Socio atualizado", "success"); resetForm(); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Salvar</button>
                                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black">Cancelar</button>
                                </td>
                            </tr>
                        ) : (
                            <tr key={s.id} className="hover:bg-white transition-colors">
                                <td className="py-3 pr-4 font-bold text-pf-black">{s.nome}</td>
                                <td className="py-3 pr-4 font-mono text-xs text-pf-grey">{s.cpf}</td>
                                <td className="py-3 pr-4 font-mono text-xs text-pf-black">{s.participacao}</td>
                                <td className="py-3 text-right space-x-3">
                                    <button onClick={() => { setEditingId(s.id); setDraft({ nome: s.nome, cpf: s.cpf, participacao: s.participacao }); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Editar</button>
                                    <button onClick={() => { setSocios(socios.filter((x) => x.id !== s.id)); toast("Socio removido", "success"); }} className="text-xs font-bold text-red-600 hover:text-red-800">Excluir</button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
            {showAdd && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Nome" className={inputClass} value={draft.newNome ?? ""} onChange={(ev) => setDraft({ ...draft, newNome: ev.target.value })} />
                    <input placeholder="CPF" className={inputClass} value={draft.newCpf ?? ""} onChange={(ev) => setDraft({ ...draft, newCpf: ev.target.value })} />
                    <input placeholder="Participacao %" className={inputClass} value={draft.newParticipacao ?? ""} onChange={(ev) => setDraft({ ...draft, newParticipacao: ev.target.value })} />
                    <button onClick={() => { if (!draft.newNome) return; setSocios([...socios, { id: nextId(socios), nome: draft.newNome, cpf: draft.newCpf ?? "", participacao: draft.newParticipacao ?? "" }]); toast("Socio adicionado", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </>
    );

    /* ------------------------------------------------------------ */
    /*  COLABORADORES                                                */
    /* ------------------------------------------------------------ */

    const renderColaboradores = () => (
        <>
            <table className="w-full text-left font-sans text-sm">
                <thead>
                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                        <th className="pb-2 pr-4">Nome</th>
                        <th className="pb-2 pr-4">Email</th>
                        <th className="pb-2 pr-4">Cargo</th>
                        <th className="pb-2 text-right">Acoes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pf-grey/10">
                    {colaboradores.map((c) =>
                        editingId === c.id ? (
                            <tr key={c.id} className="bg-pf-grey/5">
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.nome ?? c.nome} onChange={(ev) => setDraft({ ...draft, nome: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.email ?? c.email} onChange={(ev) => setDraft({ ...draft, email: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.cargo ?? c.cargo} onChange={(ev) => setDraft({ ...draft, cargo: ev.target.value })} /></td>
                                <td className="py-2 text-right space-x-2">
                                    <button onClick={() => { setColaboradores(colaboradores.map((x) => x.id === c.id ? { ...x, nome: draft.nome ?? x.nome, email: draft.email ?? x.email, cargo: draft.cargo ?? x.cargo } : x)); toast("Colaborador atualizado", "success"); resetForm(); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Salvar</button>
                                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black">Cancelar</button>
                                </td>
                            </tr>
                        ) : (
                            <tr key={c.id} className="hover:bg-white transition-colors">
                                <td className="py-3 pr-4 font-bold text-pf-black">{c.nome}</td>
                                <td className="py-3 pr-4 text-xs text-pf-grey">{c.email}</td>
                                <td className="py-3 pr-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-pf-grey">{c.cargo}</span>
                                </td>
                                <td className="py-3 text-right space-x-3">
                                    <button onClick={() => { setEditingId(c.id); setDraft({ nome: c.nome, email: c.email, cargo: c.cargo }); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Editar</button>
                                    <button onClick={() => { setColaboradores(colaboradores.filter((x) => x.id !== c.id)); toast("Colaborador removido", "success"); }} className="text-xs font-bold text-red-600 hover:text-red-800">Excluir</button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
            {showAdd && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Nome" className={inputClass} value={draft.newNome ?? ""} onChange={(ev) => setDraft({ ...draft, newNome: ev.target.value })} />
                    <input placeholder="Email" className={inputClass} value={draft.newEmail ?? ""} onChange={(ev) => setDraft({ ...draft, newEmail: ev.target.value })} />
                    <input placeholder="Cargo" className={inputClass} value={draft.newCargo ?? ""} onChange={(ev) => setDraft({ ...draft, newCargo: ev.target.value })} />
                    <button onClick={() => { if (!draft.newNome) return; setColaboradores([...colaboradores, { id: nextId(colaboradores), nome: draft.newNome, email: draft.newEmail ?? "", cargo: draft.newCargo ?? "" }]); toast("Colaborador adicionado", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </>
    );

    /* ------------------------------------------------------------ */
    /*  CENTROS DE CUSTO                                             */
    /* ------------------------------------------------------------ */

    const renderCentrosCusto = () => (
        <>
            <table className="w-full text-left font-sans text-sm">
                <thead>
                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                        <th className="pb-2 pr-4">Codigo</th>
                        <th className="pb-2 pr-4">Nome</th>
                        <th className="pb-2 pr-4">Tipo</th>
                        <th className="pb-2 text-right">Acoes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pf-grey/10">
                    {centrosCusto.map((cc) =>
                        editingId === cc.id ? (
                            <tr key={cc.id} className="bg-pf-grey/5">
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.codigo ?? cc.codigo} onChange={(ev) => setDraft({ ...draft, codigo: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.nome ?? cc.nome} onChange={(ev) => setDraft({ ...draft, nome: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.tipo ?? cc.tipo} onChange={(ev) => setDraft({ ...draft, tipo: ev.target.value })} /></td>
                                <td className="py-2 text-right space-x-2">
                                    <button onClick={() => { setCentrosCusto(centrosCusto.map((x) => x.id === cc.id ? { ...x, codigo: draft.codigo ?? x.codigo, nome: draft.nome ?? x.nome, tipo: draft.tipo ?? x.tipo } : x)); toast("Centro de custo atualizado", "success"); resetForm(); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Salvar</button>
                                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black">Cancelar</button>
                                </td>
                            </tr>
                        ) : (
                            <tr key={cc.id} className="hover:bg-white transition-colors">
                                <td className="py-3 pr-4 font-mono text-xs font-bold text-pf-blue">{cc.codigo}</td>
                                <td className="py-3 pr-4 font-bold text-pf-black">{cc.nome}</td>
                                <td className="py-3 pr-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-pf-grey">{cc.tipo}</span>
                                </td>
                                <td className="py-3 text-right space-x-3">
                                    <button onClick={() => { setEditingId(cc.id); setDraft({ codigo: cc.codigo, nome: cc.nome, tipo: cc.tipo }); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Editar</button>
                                    <button onClick={() => { setCentrosCusto(centrosCusto.filter((x) => x.id !== cc.id)); toast("Centro de custo removido", "success"); }} className="text-xs font-bold text-red-600 hover:text-red-800">Excluir</button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
            {showAdd && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Codigo" className={inputClass} value={draft.newCodigo ?? ""} onChange={(ev) => setDraft({ ...draft, newCodigo: ev.target.value })} />
                    <input placeholder="Nome" className={inputClass} value={draft.newNome ?? ""} onChange={(ev) => setDraft({ ...draft, newNome: ev.target.value })} />
                    <input placeholder="Tipo" className={inputClass} value={draft.newTipo ?? ""} onChange={(ev) => setDraft({ ...draft, newTipo: ev.target.value })} />
                    <button onClick={() => { if (!draft.newCodigo) return; setCentrosCusto([...centrosCusto, { id: nextId(centrosCusto), codigo: draft.newCodigo, nome: draft.newNome ?? "", tipo: draft.newTipo ?? "" }]); toast("Centro de custo adicionado", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </>
    );

    /* ------------------------------------------------------------ */
    /*  CONTAS BANCARIAS                                             */
    /* ------------------------------------------------------------ */

    const renderContasBancarias = () => (
        <>
            <table className="w-full text-left font-sans text-sm">
                <thead>
                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                        <th className="pb-2 pr-4">Banco</th>
                        <th className="pb-2 pr-4">Agencia</th>
                        <th className="pb-2 pr-4">Conta</th>
                        <th className="pb-2 pr-4">Tipo</th>
                        <th className="pb-2 text-right">Acoes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pf-grey/10">
                    {contasBancarias.map((cb) =>
                        editingId === cb.id ? (
                            <tr key={cb.id} className="bg-pf-grey/5">
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.banco ?? cb.banco} onChange={(ev) => setDraft({ ...draft, banco: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.agencia ?? cb.agencia} onChange={(ev) => setDraft({ ...draft, agencia: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.conta ?? cb.conta} onChange={(ev) => setDraft({ ...draft, conta: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.tipo ?? cb.tipo} onChange={(ev) => setDraft({ ...draft, tipo: ev.target.value })} /></td>
                                <td className="py-2 text-right space-x-2">
                                    <button onClick={() => { setContasBancarias(contasBancarias.map((x) => x.id === cb.id ? { ...x, banco: draft.banco ?? x.banco, agencia: draft.agencia ?? x.agencia, conta: draft.conta ?? x.conta, tipo: draft.tipo ?? x.tipo } : x)); toast("Conta bancaria atualizada", "success"); resetForm(); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Salvar</button>
                                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black">Cancelar</button>
                                </td>
                            </tr>
                        ) : (
                            <tr key={cb.id} className="hover:bg-white transition-colors">
                                <td className="py-3 pr-4 font-bold text-pf-black">{cb.banco}</td>
                                <td className="py-3 pr-4 font-mono text-xs text-pf-grey">{cb.agencia}</td>
                                <td className="py-3 pr-4 font-mono text-xs text-pf-grey">{cb.conta}</td>
                                <td className="py-3 pr-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-pf-grey">{cb.tipo}</span>
                                </td>
                                <td className="py-3 text-right space-x-3">
                                    <button onClick={() => { setEditingId(cb.id); setDraft({ banco: cb.banco, agencia: cb.agencia, conta: cb.conta, tipo: cb.tipo }); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Editar</button>
                                    <button onClick={() => { setContasBancarias(contasBancarias.filter((x) => x.id !== cb.id)); toast("Conta bancaria removida", "success"); }} className="text-xs font-bold text-red-600 hover:text-red-800">Excluir</button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
            {showAdd && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Banco" className={inputClass} value={draft.newBanco ?? ""} onChange={(ev) => setDraft({ ...draft, newBanco: ev.target.value })} />
                    <input placeholder="Agencia" className={inputClass} value={draft.newAgencia ?? ""} onChange={(ev) => setDraft({ ...draft, newAgencia: ev.target.value })} />
                    <input placeholder="Conta" className={inputClass} value={draft.newConta ?? ""} onChange={(ev) => setDraft({ ...draft, newConta: ev.target.value })} />
                    <input placeholder="Tipo" className={inputClass} value={draft.newTipo ?? ""} onChange={(ev) => setDraft({ ...draft, newTipo: ev.target.value })} />
                    <button onClick={() => { if (!draft.newBanco) return; setContasBancarias([...contasBancarias, { id: nextId(contasBancarias), banco: draft.newBanco, agencia: draft.newAgencia ?? "", conta: draft.newConta ?? "", tipo: draft.newTipo ?? "" }]); toast("Conta bancaria adicionada", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </>
    );

    /* ------------------------------------------------------------ */
    /*  FORNECEDORES                                                 */
    /* ------------------------------------------------------------ */

    const renderFornecedores = () => (
        <>
            <table className="w-full text-left font-sans text-sm">
                <thead>
                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                        <th className="pb-2 pr-4">Nome</th>
                        <th className="pb-2 pr-4">CNPJ</th>
                        <th className="pb-2 pr-4">Categoria</th>
                        <th className="pb-2 pr-4">Contato</th>
                        <th className="pb-2 text-right">Acoes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pf-grey/10">
                    {fornecedores.map((f) =>
                        editingId === f.id ? (
                            <tr key={f.id} className="bg-pf-grey/5">
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.nome ?? f.nome} onChange={(ev) => setDraft({ ...draft, nome: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.cnpj ?? f.cnpj} onChange={(ev) => setDraft({ ...draft, cnpj: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.categoria ?? f.categoria} onChange={(ev) => setDraft({ ...draft, categoria: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.contato ?? f.contato} onChange={(ev) => setDraft({ ...draft, contato: ev.target.value })} /></td>
                                <td className="py-2 text-right space-x-2">
                                    <button onClick={() => { setFornecedores(fornecedores.map((x) => x.id === f.id ? { ...x, nome: draft.nome ?? x.nome, cnpj: draft.cnpj ?? x.cnpj, categoria: draft.categoria ?? x.categoria, contato: draft.contato ?? x.contato } : x)); toast("Fornecedor atualizado", "success"); resetForm(); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Salvar</button>
                                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black">Cancelar</button>
                                </td>
                            </tr>
                        ) : (
                            <tr key={f.id} className="hover:bg-white transition-colors">
                                <td className="py-3 pr-4 font-bold text-pf-black">{f.nome}</td>
                                <td className="py-3 pr-4 font-mono text-xs text-pf-grey">{f.cnpj}</td>
                                <td className="py-3 pr-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-pf-grey">{f.categoria}</span>
                                </td>
                                <td className="py-3 pr-4 text-xs text-pf-grey">{f.contato}</td>
                                <td className="py-3 text-right space-x-3">
                                    <button onClick={() => { setEditingId(f.id); setDraft({ nome: f.nome, cnpj: f.cnpj, categoria: f.categoria, contato: f.contato }); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Editar</button>
                                    <button onClick={() => { setFornecedores(fornecedores.filter((x) => x.id !== f.id)); toast("Fornecedor removido", "success"); }} className="text-xs font-bold text-red-600 hover:text-red-800">Excluir</button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
            {showAdd && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Nome" className={inputClass} value={draft.newNome ?? ""} onChange={(ev) => setDraft({ ...draft, newNome: ev.target.value })} />
                    <input placeholder="CNPJ" className={inputClass} value={draft.newCnpj ?? ""} onChange={(ev) => setDraft({ ...draft, newCnpj: ev.target.value })} />
                    <input placeholder="Categoria" className={inputClass} value={draft.newCategoria ?? ""} onChange={(ev) => setDraft({ ...draft, newCategoria: ev.target.value })} />
                    <input placeholder="Contato" className={inputClass} value={draft.newContato ?? ""} onChange={(ev) => setDraft({ ...draft, newContato: ev.target.value })} />
                    <button onClick={() => { if (!draft.newNome) return; setFornecedores([...fornecedores, { id: nextId(fornecedores), nome: draft.newNome, cnpj: draft.newCnpj ?? "", categoria: draft.newCategoria ?? "", contato: draft.newContato ?? "" }]); toast("Fornecedor adicionado", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </>
    );

    /* ------------------------------------------------------------ */
    /*  Tab content map                                              */
    /* ------------------------------------------------------------ */

    const tabContent: Record<TabId, () => React.ReactNode> = {
        empresas: renderEmpresas,
        socios: renderSocios,
        colaboradores: renderColaboradores,
        centros: renderCentrosCusto,
        contas: renderContasBancarias,
        fornecedores: renderFornecedores,
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">Cadastros</span>
                </div>
                <PageHeader
                    title="Cadastros Gerais"
                    subtitle="Empresas, socios, colaboradores, centros de custo, contas bancarias e fornecedores"
                    actions={
                        <button
                            onClick={() => { resetForm(); setShowAdd(true); }}
                            className="flex items-center justify-center gap-2 rounded-md bg-pf-blue px-3 py-1.5 font-sans text-xs font-bold text-white transition-all hover:bg-pf-black active:scale-95 shadow-sm"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Adicionar
                        </button>
                    }
                />
            </div>

            {/* Tab bar */}
            <div className="flex space-x-1 border-b border-pf-grey/10 overflow-x-auto pb-1">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); resetForm(); }}
                            className={`flex items-center gap-2 px-4 py-3 font-sans text-sm font-semibold transition-all border-b-2 ${
                                activeTab === tab.id
                                    ? "border-pf-blue text-pf-blue"
                                    : "border-transparent text-pf-grey hover:border-pf-grey/30 hover:text-pf-black"
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {tabContent[activeTab]()}
            </div>
        </div>
    );
}
