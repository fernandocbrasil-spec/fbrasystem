"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Button, SearchInput } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { Landmark, Plus, X } from "lucide-react";

type ContaBancaria = { id: number; banco: string; agencia: string; conta: string; tipo: string; empresa: string };

const initContas: ContaBancaria[] = [
    { id: 1, banco: "Itau", agencia: "0123", conta: "45678-9", tipo: "Corrente", empresa: "PF Advogados Associados Ltda" },
    { id: 2, banco: "Bradesco", agencia: "0456", conta: "12345-6", tipo: "Corrente", empresa: "PF Advogados Associados Ltda" },
    { id: 3, banco: "BTG Pactual", agencia: "0001", conta: "78901-2", tipo: "Investimento", empresa: "PF Participacoes S.A." },
    { id: 4, banco: "Santander", agencia: "0789", conta: "33456-0", tipo: "Corrente", empresa: "PF Consultoria Tributaria Ltda" },
];

const TIPO_OPTIONS = [
    { value: "Corrente", label: "Corrente" },
    { value: "Investimento", label: "Investimento" },
    { value: "Poupanca", label: "Poupanca" },
];

const inputClass =
    "border border-pf-grey/20 bg-pf-grey/5 p-2 text-sm font-sans text-pf-black outline-none focus:border-pf-blue rounded";

export default function ContasBancariasPage() {
    const { toast } = useToast();
    const [contas, setContas] = useState<ContaBancaria[]>(initContas);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const [filterTipo, setFilterTipo] = useState<string[]>([]);

    const resetForm = () => { setShowAdd(false); setEditingId(null); setDraft({}); };
    const nextId = () => Math.max(0, ...contas.map((c) => c.id)) + 1;

    const filtered = useMemo(() => {
        let list = contas;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter((c) => c.banco.toLowerCase().includes(q) || c.conta.includes(q) || c.empresa.toLowerCase().includes(q));
        }
        if (filterTipo.length > 0) list = list.filter((c) => filterTipo.includes(c.tipo));
        return list;
    }, [contas, search, filterTipo]);

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">Cadastros</span>
                </div>
                <PageHeader
                    title="Contas Bancarias"
                    subtitle="Contas bancarias vinculadas as empresas do grupo"
                    actions={
                        <Button
                            onClick={() => { resetForm(); setShowAdd(true); }}
                            icon={<Plus className="h-4 w-4" />}
                        >
                            Adicionar
                        </Button>
                    }
                />
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3">
                <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch("")}
                    placeholder="Buscar por banco, conta ou empresa..."
                    className="flex-1 max-w-sm"
                />
                <FilterDropdown label="Tipo" options={TIPO_OPTIONS} selected={filterTipo} onChange={setFilterTipo} />
            </div>

            {/* Table */}
            <table className="w-full text-left font-sans text-sm">
                <thead>
                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                        <th className="pb-2 pr-4">Banco</th>
                        <th className="pb-2 pr-4">Agencia</th>
                        <th className="pb-2 pr-4">Conta</th>
                        <th className="pb-2 pr-4">Tipo</th>
                        <th className="pb-2 pr-4">Empresa</th>
                        <th className="pb-2 text-right">Acoes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pf-grey/10">
                    {filtered.map((cb) =>
                        editingId === cb.id ? (
                            <tr key={cb.id} className="bg-pf-grey/5">
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.banco ?? cb.banco} onChange={(ev) => setDraft({ ...draft, banco: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.agencia ?? cb.agencia} onChange={(ev) => setDraft({ ...draft, agencia: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.conta ?? cb.conta} onChange={(ev) => setDraft({ ...draft, conta: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.tipo ?? cb.tipo} onChange={(ev) => setDraft({ ...draft, tipo: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.empresa ?? cb.empresa} onChange={(ev) => setDraft({ ...draft, empresa: ev.target.value })} /></td>
                                <td className="py-2 text-right space-x-2">
                                    <button onClick={() => { setContas(contas.map((x) => x.id === cb.id ? { ...x, banco: draft.banco ?? x.banco, agencia: draft.agencia ?? x.agencia, conta: draft.conta ?? x.conta, tipo: draft.tipo ?? x.tipo, empresa: draft.empresa ?? x.empresa } : x)); toast("Conta bancaria atualizada", "success"); resetForm(); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Salvar</button>
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
                                <td className="py-3 pr-4 text-xs text-pf-grey">{cb.empresa}</td>
                                <td className="py-3 text-right space-x-3">
                                    <button onClick={() => { setEditingId(cb.id); setDraft({ banco: cb.banco, agencia: cb.agencia, conta: cb.conta, tipo: cb.tipo, empresa: cb.empresa }); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Editar</button>
                                    <button onClick={() => { setContas(contas.filter((x) => x.id !== cb.id)); toast("Conta bancaria removida", "success"); }} className="text-xs font-bold text-red-600 hover:text-red-800">Excluir</button>
                                </td>
                            </tr>
                        )
                    )}
                    {filtered.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-xs text-pf-grey">Nenhuma conta bancaria encontrada</td></tr>
                    )}
                </tbody>
            </table>

            {showAdd && (
                <div className="flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Banco" className={inputClass} value={draft.newBanco ?? ""} onChange={(ev) => setDraft({ ...draft, newBanco: ev.target.value })} />
                    <input placeholder="Agencia" className={inputClass} value={draft.newAgencia ?? ""} onChange={(ev) => setDraft({ ...draft, newAgencia: ev.target.value })} />
                    <input placeholder="Conta" className={inputClass} value={draft.newConta ?? ""} onChange={(ev) => setDraft({ ...draft, newConta: ev.target.value })} />
                    <input placeholder="Tipo" className={inputClass} value={draft.newTipo ?? ""} onChange={(ev) => setDraft({ ...draft, newTipo: ev.target.value })} />
                    <input placeholder="Empresa" className={inputClass} value={draft.newEmpresa ?? ""} onChange={(ev) => setDraft({ ...draft, newEmpresa: ev.target.value })} />
                    <button onClick={() => { if (!draft.newBanco) return; setContas([...contas, { id: nextId(), banco: draft.newBanco, agencia: draft.newAgencia ?? "", conta: draft.newConta ?? "", tipo: draft.newTipo ?? "", empresa: draft.newEmpresa ?? "" }]); toast("Conta bancaria adicionada", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </div>
    );
}
