"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Button, SearchInput } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { Users, Plus, X } from "lucide-react";

type Colaborador = { id: number; nome: string; email: string; cargo: string; departamento: string; status: string };

const initColaboradores: Colaborador[] = [
    { id: 1, nome: "Mariana Silva", email: "mariana@pfadvogados.com.br", cargo: "Analista Contabil", departamento: "Financeiro", status: "Ativo" },
    { id: 2, nome: "Pedro Santos", email: "pedro@pfadvogados.com.br", cargo: "Assistente Juridico", departamento: "Juridico", status: "Ativo" },
    { id: 3, nome: "Fernanda Costa", email: "fernanda@pfadvogados.com.br", cargo: "Gerente Financeiro", departamento: "Financeiro", status: "Ativo" },
    { id: 4, nome: "Lucas Almeida", email: "lucas@pfadvogados.com.br", cargo: "Estagiario", departamento: "Juridico", status: "Ativo" },
    { id: 5, nome: "Juliana Ramos", email: "juliana@pfadvogados.com.br", cargo: "Advogada Senior", departamento: "Juridico", status: "Ferias" },
    { id: 6, nome: "Roberto Nunes", email: "roberto@pfadvogados.com.br", cargo: "Auxiliar Administrativo", departamento: "Administrativo", status: "Desligado" },
];

const DEPTO_OPTIONS = [
    { value: "Juridico", label: "Juridico" },
    { value: "Financeiro", label: "Financeiro" },
    { value: "Administrativo", label: "Administrativo" },
];

const STATUS_OPTIONS = [
    { value: "Ativo", label: "Ativo" },
    { value: "Ferias", label: "Ferias" },
    { value: "Desligado", label: "Desligado" },
];

const inputClass =
    "border border-pf-grey/20 bg-pf-grey/5 p-2 text-sm font-sans text-pf-black outline-none focus:border-pf-blue rounded";

const statusColor: Record<string, string> = {
    Ativo: "text-emerald-600",
    Ferias: "text-amber-600",
    Desligado: "text-pf-grey",
};

export default function ColaboradoresPage() {
    const { toast } = useToast();
    const [colaboradores, setColaboradores] = useState<Colaborador[]>(initColaboradores);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const [filterDepto, setFilterDepto] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);

    const resetForm = () => { setShowAdd(false); setEditingId(null); setDraft({}); };
    const nextId = () => Math.max(0, ...colaboradores.map((c) => c.id)) + 1;

    const filtered = useMemo(() => {
        let list = colaboradores;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter((c) => c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.cargo.toLowerCase().includes(q));
        }
        if (filterDepto.length > 0) list = list.filter((c) => filterDepto.includes(c.departamento));
        if (filterStatus.length > 0) list = list.filter((c) => filterStatus.includes(c.status));
        return list;
    }, [colaboradores, search, filterDepto, filterStatus]);

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">Cadastros</span>
                </div>
                <PageHeader
                    title="Colaboradores"
                    subtitle="Equipe, cargos e departamentos"
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
                    placeholder="Buscar por nome, email ou cargo..."
                    className="flex-1 max-w-sm"
                />
                <FilterDropdown label="Departamento" options={DEPTO_OPTIONS} selected={filterDepto} onChange={setFilterDepto} />
                <FilterDropdown label="Status" options={STATUS_OPTIONS} selected={filterStatus} onChange={setFilterStatus} />
            </div>

            {/* Table */}
            <table className="w-full text-left font-sans text-sm">
                <thead>
                    <tr className="border-b border-pf-grey/20 text-pf-grey text-[10px] font-bold uppercase tracking-[0.1em]">
                        <th className="pb-2 pr-4">Nome</th>
                        <th className="pb-2 pr-4">Email</th>
                        <th className="pb-2 pr-4">Cargo</th>
                        <th className="pb-2 pr-4">Departamento</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2 text-right">Acoes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pf-grey/10">
                    {filtered.map((c) =>
                        editingId === c.id ? (
                            <tr key={c.id} className="bg-pf-grey/5">
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.nome ?? c.nome} onChange={(ev) => setDraft({ ...draft, nome: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.email ?? c.email} onChange={(ev) => setDraft({ ...draft, email: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.cargo ?? c.cargo} onChange={(ev) => setDraft({ ...draft, cargo: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.departamento ?? c.departamento} onChange={(ev) => setDraft({ ...draft, departamento: ev.target.value })} /></td>
                                <td className="py-2 pr-2"><input className={inputClass + " w-full"} value={draft.status ?? c.status} onChange={(ev) => setDraft({ ...draft, status: ev.target.value })} /></td>
                                <td className="py-2 text-right space-x-2">
                                    <button onClick={() => { setColaboradores(colaboradores.map((x) => x.id === c.id ? { ...x, nome: draft.nome ?? x.nome, email: draft.email ?? x.email, cargo: draft.cargo ?? x.cargo, departamento: draft.departamento ?? x.departamento, status: draft.status ?? x.status } : x)); toast("Colaborador atualizado", "success"); resetForm(); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Salvar</button>
                                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black">Cancelar</button>
                                </td>
                            </tr>
                        ) : (
                            <tr key={c.id} className="hover:bg-white transition-colors">
                                <td className="py-3 pr-4 font-bold text-pf-black">{c.nome}</td>
                                <td className="py-3 pr-4 text-xs text-pf-grey">{c.email}</td>
                                <td className="py-3 pr-4 text-xs text-pf-black">{c.cargo}</td>
                                <td className="py-3 pr-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-pf-grey">{c.departamento}</span>
                                </td>
                                <td className="py-3 pr-4">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColor[c.status] ?? "text-pf-grey"}`}>{c.status}</span>
                                </td>
                                <td className="py-3 text-right space-x-3">
                                    <button onClick={() => { setEditingId(c.id); setDraft({ nome: c.nome, email: c.email, cargo: c.cargo, departamento: c.departamento, status: c.status }); }} className="text-xs font-bold text-pf-blue hover:text-pf-black">Editar</button>
                                    <button onClick={() => { setColaboradores(colaboradores.filter((x) => x.id !== c.id)); toast("Colaborador removido", "success"); }} className="text-xs font-bold text-red-600 hover:text-red-800">Excluir</button>
                                </td>
                            </tr>
                        )
                    )}
                    {filtered.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-xs text-pf-grey">Nenhum colaborador encontrado</td></tr>
                    )}
                </tbody>
            </table>

            {showAdd && (
                <div className="flex flex-wrap items-end gap-2 border-t border-pf-grey/10 pt-3">
                    <input placeholder="Nome" className={inputClass} value={draft.newNome ?? ""} onChange={(ev) => setDraft({ ...draft, newNome: ev.target.value })} />
                    <input placeholder="Email" className={inputClass} value={draft.newEmail ?? ""} onChange={(ev) => setDraft({ ...draft, newEmail: ev.target.value })} />
                    <input placeholder="Cargo" className={inputClass} value={draft.newCargo ?? ""} onChange={(ev) => setDraft({ ...draft, newCargo: ev.target.value })} />
                    <input placeholder="Departamento" className={inputClass} value={draft.newDepto ?? ""} onChange={(ev) => setDraft({ ...draft, newDepto: ev.target.value })} />
                    <button onClick={() => { if (!draft.newNome) return; setColaboradores([...colaboradores, { id: nextId(), nome: draft.newNome, email: draft.newEmail ?? "", cargo: draft.newCargo ?? "", departamento: draft.newDepto ?? "", status: "Ativo" }]); toast("Colaborador adicionado", "success"); resetForm(); }} className="rounded bg-pf-blue px-3 py-2 text-xs font-bold text-white hover:bg-pf-black transition-colors">Salvar</button>
                    <button onClick={resetForm} className="text-xs font-bold text-pf-grey hover:text-pf-black"><X className="h-4 w-4" /></button>
                </div>
            )}
        </div>
    );
}
