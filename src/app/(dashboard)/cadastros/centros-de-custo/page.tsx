"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Button, SearchInput } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { Briefcase, Plus, X } from "lucide-react";

type CentroCusto = { id: number; codigo: string; nome: string; tipo: string; responsavel: string };

const initCentrosCusto: CentroCusto[] = [
    { id: 1, codigo: "CC-001", nome: "Contencioso Civil", tipo: "Caso", responsavel: "Jose Rafael Feiteiro" },
    { id: 2, codigo: "CC-002", nome: "Consultoria Tributaria", tipo: "Centro de Custo", responsavel: "Fernanda Costa" },
    { id: 3, codigo: "CC-003", nome: "Administrativo", tipo: "Centro de Custo", responsavel: "Mariana Silva" },
    { id: 4, codigo: "CC-004", nome: "Trabalhista - Grupo Sequoia", tipo: "Caso", responsavel: "Pedro Santos" },
    { id: 5, codigo: "CC-005", nome: "Societario - Nexus Participacoes", tipo: "Caso", responsavel: "Ana Beatriz Sousa" },
];

const TIPO_OPTIONS = [
    { value: "Caso", label: "Caso" },
    { value: "Centro de Custo", label: "Centro de Custo" },
];

const inputClass =
    "border border-pf-grey/20 bg-pf-grey/5 p-2 text-sm font-sans text-pf-black outline-none focus:border-pf-blue rounded";

export default function CentrosCustoPage() {
    const { toast } = useToast();
    const [centros, setCentros] = useState<CentroCusto[]>(initCentrosCusto);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const [filterTipo, setFilterTipo] = useState<string[]>([]);

    const resetForm = () => { setShowAdd(false); setEditingId(null); setDraft({}); };
    const nextId = () => Math.max(0, ...centros.map((c) => c.id)) + 1;

    const filtered = useMemo(() => {
        let list = centros;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter((c) => c.nome.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q) || c.responsavel.toLowerCase().includes(q));
        }
        if (filterTipo.length > 0) list = list.filter((c) => filterTipo.includes(c.tipo));
        return list;
    }, [centros, search, filterTipo]);

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">Cadastros</span>
                </div>
                <PageHeader
                    title="Centro de Custo / Caso"
                    subtitle="Centros de custo e casos para alocacao de receitas e despesas"
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
                    placeholder="Buscar por codigo, nome ou responsavel..."
                    className="flex-1 max-w-sm"
                />
                <FilterDropdown label="Tipo" options={TIPO_OPTIONS} selected={filterTipo} onChange={setFilterTipo} />
            </div>

            {/* Table */}
            <table className="w-full text-left font-sans text-sm">
                <thead>
                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                        <th className="pb-2 pr-4">Codigo</th>
                        <th className="pb-2 pr-4">Nome</th>
                        <th className="pb-2 pr-4">Tipo</th>
                        <th className="pb-2 pr-4">Responsavel</th>
                        <th className="pb-2 text-right">Acoes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pf-grey/10">
                    {filtered.map((cc) =>
                        editingId === cc.id ? (
                            <tr key={cc.id} className="bg-pf-grey/5">
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.codigo ?? cc.codigo} onChange={(ev) => setDraft({ ...draft, codigo: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.nome ?? cc.nome} onChange={(ev) => setDraft({ ...draft, nome: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.tipo ?? cc.tipo} onChange={(ev) => setDraft({ ...draft, tipo: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.responsavel ?? cc.responsavel} onChange={(ev) => setDraft({ ...draft, responsavel: ev.target.value })} /></td>
                                <td className="py-2 text-right space-x-2">
                                    <button onClick={() => { setCentros(centros.map((x) => x.id === cc.id ? { ...x, codigo: draft.codigo ?? x.codigo, nome: draft.nome ?? x.nome, tipo: draft.tipo ?? x.tipo, responsavel: draft.responsavel ?? x.responsavel } : x)); toast("Centro de custo atualizado", "success"); resetForm(); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Salvar</button>
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
                                <td className="py-3 pr-4 text-xs text-pf-grey">{cc.responsavel}</td>
                                <td className="py-3 text-right space-x-3">
                                    <button onClick={() => { setEditingId(cc.id); setDraft({ codigo: cc.codigo, nome: cc.nome, tipo: cc.tipo, responsavel: cc.responsavel }); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Editar</button>
                                    <button onClick={() => { setCentros(centros.filter((x) => x.id !== cc.id)); toast("Centro de custo removido", "success"); }} className="text-xs font-bold text-red-600 hover:text-red-800">Excluir</button>
                                </td>
                            </tr>
                        )
                    )}
                    {filtered.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-xs text-pf-grey">Nenhum centro de custo encontrado</td></tr>
                    )}
                </tbody>
            </table>

            {showAdd && (
                <div className="flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Codigo" className={inputClass} value={draft.newCodigo ?? ""} onChange={(ev) => setDraft({ ...draft, newCodigo: ev.target.value })} />
                    <input placeholder="Nome" className={inputClass} value={draft.newNome ?? ""} onChange={(ev) => setDraft({ ...draft, newNome: ev.target.value })} />
                    <input placeholder="Tipo" className={inputClass} value={draft.newTipo ?? ""} onChange={(ev) => setDraft({ ...draft, newTipo: ev.target.value })} />
                    <input placeholder="Responsavel" className={inputClass} value={draft.newResp ?? ""} onChange={(ev) => setDraft({ ...draft, newResp: ev.target.value })} />
                    <button onClick={() => { if (!draft.newCodigo) return; setCentros([...centros, { id: nextId(), codigo: draft.newCodigo, nome: draft.newNome ?? "", tipo: draft.newTipo ?? "", responsavel: draft.newResp ?? "" }]); toast("Centro de custo adicionado", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </div>
    );
}
