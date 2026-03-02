"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Button, SearchInput } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { Building2, Plus, X } from "lucide-react";

type Empresa = { id: number; razaoSocial: string; cnpj: string; tipo: string };

const initEmpresas: Empresa[] = [
    { id: 1, razaoSocial: "PF Advogados Associados Ltda", cnpj: "12.345.678/0001-90", tipo: "Matriz" },
    { id: 2, razaoSocial: "PF Consultoria Tributaria Ltda", cnpj: "12.345.678/0002-71", tipo: "Filial" },
    { id: 3, razaoSocial: "PF Participacoes S.A.", cnpj: "98.765.432/0001-10", tipo: "Holding" },
];

const TIPO_OPTIONS = [
    { value: "Matriz", label: "Matriz" },
    { value: "Filial", label: "Filial" },
    { value: "Holding", label: "Holding" },
];

const inputClass =
    "border border-pf-grey/20 bg-pf-grey/5 p-2 text-sm font-sans text-pf-black outline-none focus:border-pf-blue rounded";

export default function EmpresasPage() {
    const { toast } = useToast();
    const [empresas, setEmpresas] = useState<Empresa[]>(initEmpresas);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const [filterTipo, setFilterTipo] = useState<string[]>([]);

    const resetForm = () => { setShowAdd(false); setEditingId(null); setDraft({}); };
    const nextId = () => Math.max(0, ...empresas.map((e) => e.id)) + 1;

    const filtered = useMemo(() => {
        let list = empresas;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter((e) => e.razaoSocial.toLowerCase().includes(q) || e.cnpj.includes(q));
        }
        if (filterTipo.length > 0) {
            list = list.filter((e) => filterTipo.includes(e.tipo));
        }
        return list;
    }, [empresas, search, filterTipo]);

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">Cadastros</span>
                </div>
                <PageHeader
                    title="Empresas"
                    subtitle="Cadastro de empresas, filiais e holdings do grupo"
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
                    placeholder="Buscar por razao social ou CNPJ..."
                    className="flex-1 max-w-sm"
                />
                <FilterDropdown label="Tipo" options={TIPO_OPTIONS} selected={filterTipo} onChange={setFilterTipo} />
            </div>

            {/* Table */}
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
                    {filtered.map((e) =>
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
                    {filtered.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-xs text-pf-grey">Nenhuma empresa encontrada</td></tr>
                    )}
                </tbody>
            </table>

            {/* Add form */}
            {showAdd && (
                <div className="flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Razao Social" className={inputClass} value={draft.newRazao ?? ""} onChange={(ev) => setDraft({ ...draft, newRazao: ev.target.value })} />
                    <input placeholder="CNPJ" className={inputClass} value={draft.newCnpj ?? ""} onChange={(ev) => setDraft({ ...draft, newCnpj: ev.target.value })} />
                    <input placeholder="Tipo" className={inputClass} value={draft.newTipo ?? ""} onChange={(ev) => setDraft({ ...draft, newTipo: ev.target.value })} />
                    <button onClick={() => { if (!draft.newRazao) return; setEmpresas([...empresas, { id: nextId(), razaoSocial: draft.newRazao, cnpj: draft.newCnpj ?? "", tipo: draft.newTipo ?? "" }]); toast("Empresa adicionada", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </div>
    );
}
