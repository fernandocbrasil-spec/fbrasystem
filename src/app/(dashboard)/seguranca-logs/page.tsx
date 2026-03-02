"use client";

import { PageHeader } from "@/components/ui/page-header";
import { ShieldAlert, Search } from "lucide-react";
import { useState, useMemo } from "react";

type AuditLog = { id: string; acao: string; usuario: string; hora: string; tipo: "WARNING" | "INFO" | "CRITICAL" };

const AUDIT_LOGS: AuditLog[] = [
    { id: "1", acao: "Downgrade de proposta 'TechCorp BR'", usuario: "Ana Costa", hora: "Hoje, 10:45", tipo: "WARNING" },
    { id: "2", acao: "Gerou NFSe Valida #4092", usuario: "Financeiro", hora: "Hoje, 09:12", tipo: "INFO" },
    { id: "3", acao: "Exclusao do Cliente 'XYZ'", usuario: "Rafael Feiteiro", hora: "Ontem, 16:30", tipo: "CRITICAL" },
    { id: "4", acao: "Login via Azure AD", usuario: "Carlos Souza", hora: "Ontem, 08:00", tipo: "INFO" },
    { id: "5", acao: "Alteracao de permissoes — Ana Costa promovida", usuario: "Rafael Feiteiro", hora: "27/02, 14:20", tipo: "WARNING" },
    { id: "6", acao: "Backup automatico concluido", usuario: "Sistema", hora: "27/02, 03:00", tipo: "INFO" },
    { id: "7", acao: "Tentativa de acesso negada — IP 189.x.x.x", usuario: "Desconhecido", hora: "26/02, 22:15", tipo: "CRITICAL" },
    { id: "8", acao: "Aprovacao de despesa AWS — R$ 1.250,00", usuario: "Rafael Feiteiro", hora: "26/02, 11:30", tipo: "INFO" },
];

const DOT_COLOR: Record<AuditLog["tipo"], string> = {
    WARNING: "bg-orange-500",
    CRITICAL: "bg-red-500",
    INFO: "bg-blue-500",
};

const BADGE_STYLE: Record<AuditLog["tipo"], string> = {
    WARNING: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
    INFO: "bg-blue-100 text-blue-700",
};

const FILTER_OPTIONS = [
    { value: "todos", label: "Todos" },
    { value: "CRITICAL", label: "Criticos" },
    { value: "WARNING", label: "Alertas" },
    { value: "INFO", label: "Info" },
];

export default function SegurancaLogsPage() {
    const [search, setSearch] = useState("");
    const [tipoFilter, setTipoFilter] = useState("todos");

    const filtered = useMemo(() => {
        let logs = AUDIT_LOGS;
        if (tipoFilter !== "todos") {
            logs = logs.filter((l) => l.tipo === tipoFilter);
        }
        if (search) {
            const q = search.toLowerCase();
            logs = logs.filter((l) => l.acao.toLowerCase().includes(q) || l.usuario.toLowerCase().includes(q));
        }
        return logs;
    }, [search, tipoFilter]);

    const criticalCount = AUDIT_LOGS.filter((l) => l.tipo === "CRITICAL").length;
    const warningCount = AUDIT_LOGS.filter((l) => l.tipo === "WARNING").length;

    return (
        <div className="space-y-4">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">Configuracoes do Sistema</span>
                </div>
                <PageHeader
                    title="Seguranca & Logs"
                    subtitle="Trilha de auditoria, sessoes ativas e politicas de seguranca"
                />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-pf-blue p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Total de Eventos</p>
                    <p className="font-sans text-xl font-bold text-pf-black mt-1">{AUDIT_LOGS.length}</p>
                </div>
                <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-red-500 p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Criticos</p>
                    <p className="font-sans text-xl font-bold text-red-600 mt-1">{criticalCount}</p>
                </div>
                <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-orange-500 p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Alertas</p>
                    <p className="font-sans text-xl font-bold text-orange-600 mt-1">{warningCount}</p>
                </div>
                <div className="bg-white border border-pf-grey/20 rounded border-l-[3px] border-l-blue-500 p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">Informativos</p>
                    <p className="font-sans text-xl font-bold text-blue-600 mt-1">{AUDIT_LOGS.length - criticalCount - warningCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                    {FILTER_OPTIONS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setTipoFilter(f.value)}
                            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                                tipoFilter === f.value
                                    ? "bg-pf-blue text-white"
                                    : "bg-white border border-pf-grey/20 text-pf-grey hover:text-pf-black hover:border-pf-grey/40"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex items-center ml-auto">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-pf-grey pointer-events-none" />
                    <input
                        type="search"
                        placeholder="Buscar evento ou usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64 bg-white border border-pf-grey/20 pl-8 pr-3 py-1.5 text-xs text-pf-black placeholder:text-pf-grey/60 outline-none rounded-md"
                    />
                </div>
            </div>

            {/* Audit Trail */}
            <div className="bg-pf-black rounded border border-pf-black">
                <div className="px-5 py-3.5 border-b border-white/10">
                    <h3 className="font-sans text-sm font-bold text-white">Trilha de Auditoria</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey/50 mt-0.5">
                        Acoes criticas registradas pelo sistema
                    </p>
                </div>
                <div className="divide-y divide-white/5">
                    {filtered.length === 0 ? (
                        <div className="px-5 py-8 text-center text-xs text-pf-grey/50 italic">
                            Nenhum evento encontrado para os filtros selecionados.
                        </div>
                    ) : (
                        filtered.map((log) => (
                            <div key={log.id} className="flex justify-between items-center px-5 py-4 text-sm hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${DOT_COLOR[log.tipo]}`} aria-hidden="true" />
                                    <span className="text-white/90 text-xs">{log.acao}</span>
                                    <span className={`ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-sm ${BADGE_STYLE[log.tipo]}`}>
                                        {log.tipo}
                                    </span>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                    <span className="text-white/50 text-xs block">{log.usuario}</span>
                                    <span className="text-white/30 text-[10px] font-mono">{log.hora}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
