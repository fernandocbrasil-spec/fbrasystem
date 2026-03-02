"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Button, SearchInput } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { Truck, Plus, X } from "lucide-react";

type Fornecedor = { id: number; nome: string; cnpj: string; categoria: string; contato: string };

const initFornecedores: Fornecedor[] = [
    { id: 1, nome: "Amazon Web Services (AWS)", cnpj: "23.412.247/0001-10", categoria: "Infraestrutura", contato: "aws-billing@amazon.com" },
    { id: 2, nome: "WeWork Coworking", cnpj: "24.884.199/0001-70", categoria: "Aluguel & Condominio", contato: "faturamento@wework.com" },
    { id: 3, nome: "Google Workspace", cnpj: "06.990.590/0001-23", categoria: "Licencas de Software", contato: "billing@google.com" },
    { id: 4, nome: "Thomson Reuters", cnpj: "02.456.829/0001-67", categoria: "Assinaturas & Livros", contato: "assinaturas@tr.com" },
    { id: 5, nome: "Algar Telecom", cnpj: "71.208.516/0001-74", categoria: "Telecomunicacoes", contato: "empresarial@algar.com" },
];

const CATEGORIA_OPTIONS = [
    { value: "Infraestrutura", label: "Infraestrutura" },
    { value: "Aluguel & Condominio", label: "Aluguel & Condominio" },
    { value: "Licencas de Software", label: "Licencas de Software" },
    { value: "Assinaturas & Livros", label: "Assinaturas & Livros" },
    { value: "Telecomunicacoes", label: "Telecomunicacoes" },
];

const inputClass =
    "border border-pf-grey/20 bg-pf-grey/5 p-2 text-sm font-sans text-pf-black outline-none focus:border-pf-blue rounded";

export default function FornecedoresPage() {
    const { toast } = useToast();
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>(initFornecedores);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const [filterCategoria, setFilterCategoria] = useState<string[]>([]);

    const resetForm = () => { setShowAdd(false); setEditingId(null); setDraft({}); };
    const nextId = () => Math.max(0, ...fornecedores.map((f) => f.id)) + 1;

    const filtered = useMemo(() => {
        let list = fornecedores;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter((f) => f.nome.toLowerCase().includes(q) || f.cnpj.includes(q) || f.contato.toLowerCase().includes(q));
        }
        if (filterCategoria.length > 0) list = list.filter((f) => filterCategoria.includes(f.categoria));
        return list;
    }, [fornecedores, search, filterCategoria]);

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">Cadastros</span>
                </div>
                <PageHeader
                    title="Fornecedores"
                    subtitle="Fornecedores e prestadores de servico"
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
                    placeholder="Buscar por nome, CNPJ ou contato..."
                    className="flex-1 max-w-sm"
                />
                <FilterDropdown label="Categoria" options={CATEGORIA_OPTIONS} selected={filterCategoria} onChange={setFilterCategoria} />
            </div>

            {/* Table */}
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
                    {filtered.map((f) =>
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
                    {filtered.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-xs text-pf-grey">Nenhum fornecedor encontrado</td></tr>
                    )}
                </tbody>
            </table>

            {showAdd && (
                <div className="flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Nome" className={inputClass} value={draft.newNome ?? ""} onChange={(ev) => setDraft({ ...draft, newNome: ev.target.value })} />
                    <input placeholder="CNPJ" className={inputClass} value={draft.newCnpj ?? ""} onChange={(ev) => setDraft({ ...draft, newCnpj: ev.target.value })} />
                    <input placeholder="Categoria" className={inputClass} value={draft.newCategoria ?? ""} onChange={(ev) => setDraft({ ...draft, newCategoria: ev.target.value })} />
                    <input placeholder="Contato" className={inputClass} value={draft.newContato ?? ""} onChange={(ev) => setDraft({ ...draft, newContato: ev.target.value })} />
                    <button onClick={() => { if (!draft.newNome) return; setFornecedores([...fornecedores, { id: nextId(), nome: draft.newNome, cnpj: draft.newCnpj ?? "", categoria: draft.newCategoria ?? "", contato: draft.newContato ?? "" }]); toast("Fornecedor adicionado", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </div>
    );
}
