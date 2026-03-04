"use client";

import { ApprovalBadge } from "@/components/approval/approval-badge";
import { Send, Trash2, Undo2 } from "lucide-react";
import type { MockTimeEntry } from "@/lib/mock-data";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
    reuniao: "Reuniao",
    pesquisa: "Pesquisa Juridica",
    elaboracao: "Elaboracao",
    revisao: "Revisao / Analise",
    audiencia: "Audiencia",
    administrativo: "Administrativo",
};

function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDateBR(isoDate: string): string {
    const [y, m, d] = isoDate.split("-");
    if (!d) return isoDate;
    return `${d}/${m}/${y}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface TimeEntryTableProps {
    entries: MockTimeEntry[];
    /** Show case column (true on /time-tracking, false on /casos/[id]) */
    showCase?: boolean;
    onSubmit: (id: string) => void;
    onRetract: (id: string) => void;
    onDelete: (id: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TimeEntryTable({ entries, showCase, onSubmit, onRetract, onDelete }: TimeEntryTableProps) {
    const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm whitespace-nowrap">
                <thead>
                    <tr className="border-b border-pf-grey/10 text-pf-grey text-[10px] font-semibold uppercase tracking-wider">
                        <th className="px-4 py-2.5">Data</th>
                        {showCase && <th className="px-4 py-2.5">Caso</th>}
                        <th className="px-4 py-2.5">Atividade</th>
                        <th className="px-4 py-2.5">Descricao</th>
                        <th className="px-4 py-2.5 text-right">Duracao</th>
                        <th className="px-4 py-2.5">Tipo</th>
                        <th className="px-4 py-2.5 text-right">Status</th>
                        <th className="px-4 py-2.5 text-right">Acoes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-pf-grey/5">
                    {entries.length === 0 && (
                        <tr>
                            <td colSpan={showCase ? 8 : 7} className="px-4 py-8 text-center text-sm text-pf-grey/50">
                                Nenhum apontamento encontrado
                            </td>
                        </tr>
                    )}
                    {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white transition-colors">
                            <td className="px-4 py-2.5 text-xs font-mono text-pf-grey">{formatDateBR(entry.date)}</td>
                            {showCase && (
                                <td className="px-4 py-2.5 text-xs">
                                    <span className="font-semibold text-pf-black">{entry.caseNumber}</span>
                                    <span className="text-pf-grey/50 ml-1.5">{entry.clientName}</span>
                                </td>
                            )}
                            <td className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-pf-grey">
                                {ACTIVITY_LABELS[entry.activityType] ?? entry.activityType}
                            </td>
                            <td className="px-4 py-2.5 text-xs font-medium text-pf-black truncate max-w-[250px]">
                                {entry.description}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-pf-blue">
                                {formatDuration(entry.durationMinutes)}
                            </td>
                            <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                                    entry.isBillable ? "bg-green-100 text-green-700" : "bg-pf-grey/10 text-pf-grey"
                                }`}>
                                    {entry.isBillable ? "Faturavel" : "Interno"}
                                </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                                <ApprovalBadge status={entry.approvalStatus} />
                            </td>
                            <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    {entry.approvalStatus === "rascunho" && (
                                        <>
                                            <button onClick={() => onSubmit(entry.id)} title="Submeter para aprovacao" className="p-1 rounded hover:bg-pf-blue/10 transition-colors">
                                                <Send size={12} className="text-pf-blue" />
                                            </button>
                                            <button onClick={() => onDelete(entry.id)} title="Excluir" className="p-1 rounded hover:bg-red-50 transition-colors">
                                                <Trash2 size={12} className="text-red-400" />
                                            </button>
                                        </>
                                    )}
                                    {entry.approvalStatus === "pendente" && (
                                        <button onClick={() => onRetract(entry.id)} title="Retratar" className="p-1 rounded hover:bg-orange-50 transition-colors">
                                            <Undo2 size={12} className="text-orange-500" />
                                        </button>
                                    )}
                                    {entry.approvalStatus === "rejeitado" && (
                                        <button onClick={() => onDelete(entry.id)} title="Excluir" className="p-1 rounded hover:bg-red-50 transition-colors">
                                            <Trash2 size={12} className="text-red-400" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
                {entries.length > 0 && (
                    <tfoot>
                        <tr className="bg-pf-grey/5">
                            <td colSpan={showCase ? 4 : 3} className="px-4 py-2.5 text-right text-xs font-bold text-pf-black">
                                TOTAL
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-pf-blue">
                                {formatDuration(totalMinutes)}
                            </td>
                            <td colSpan={3} />
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}
