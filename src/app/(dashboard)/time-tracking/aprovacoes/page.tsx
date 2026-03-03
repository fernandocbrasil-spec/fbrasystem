"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ApprovalActions } from "@/components/approval/approval-actions";
import { ApprovalDialog } from "@/components/approval/approval-dialog";
import { BatchApprovalBar } from "@/components/approval/batch-approval-bar";
import { getTimeEntries } from "@/lib/actions";
import type { MockTimeEntry } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";

const ACTIVITY_LABELS: Record<string, string> = {
    reuniao: "Reuniao",
    pesquisa: "Pesquisa",
    elaboracao: "Elaboracao",
    revisao: "Revisao",
    audiencia: "Audiencia",
    administrativo: "Administrativo",
};

function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m.toString().padStart(2, "0")}`;
}

export default function TimeTrackingAprovacoesPage() {
    const [data, setData] = useState<MockTimeEntry[]>([]);

    const loadData = useCallback(async () => {
        const result = await getTimeEntries();
        setData(result);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);

    const pending = data.filter((t) => t.approvalStatus === "pendente");

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === pending.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pending.map((t) => t.id)));
        }
    };

    const handleApprove = (id: string) => {
        setData((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, approvalStatus: "aprovado" as const, approvedBy: "Jose Rafael Feiteiro", approvedAt: "01/03/2026" } : t
            )
        );
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    };

    const handleReject = (id: string, comment: string) => {
        setData((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, approvalStatus: "rejeitado" as const, rejectionComment: comment } : t
            )
        );
        setRejectTarget(null);
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    };

    const handleBatchApprove = () => {
        setData((prev) =>
            prev.map((t) =>
                selectedIds.has(t.id) ? { ...t, approvalStatus: "aprovado" as const, approvedBy: "Jose Rafael Feiteiro", approvedAt: "01/03/2026" } : t
            )
        );
        setSelectedIds(new Set());
    };

    const handleBatchReject = () => {
        if (selectedIds.size === 1) {
            setRejectTarget(Array.from(selectedIds)[0]);
        }
    };

    const rejectItem = rejectTarget ? data.find((t) => t.id === rejectTarget) : null;

    const totalMinutes = pending
        .filter((t) => selectedIds.has(t.id))
        .reduce((sum, t) => sum + t.durationMinutes, 0);

    return (
        <div>
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Aprovacoes — Apontamento de Horas"
                    subtitle="Lancamentos pendentes de aprovacao do socio."
                    actions={
                        <Link
                            href="/time-tracking"
                            className="flex items-center gap-2 rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-xs font-bold text-pf-black hover:bg-pf-grey/5 transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                            Voltar
                        </Link>
                    }
                />
            </div>

            {pending.length === 0 ? (
                <EmptyState title="Nenhum lancamento pendente" message="Todos os apontamentos foram processados." />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-sm">
                        <thead>
                            <tr className="text-pf-grey border-b border-pf-grey/20">
                                <th className="px-2 py-2 w-8">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === pending.length && pending.length > 0}
                                        onChange={toggleAll}
                                        className="h-3.5 w-3.5 rounded border-pf-grey/30 accent-pf-blue"
                                        aria-label="Selecionar todos"
                                    />
                                </th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">Advogado</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">Caso</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">Descricao</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">Tipo</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-right">Duracao</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-right">Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pending.map((entry) => (
                                <tr key={entry.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors">
                                    <td className="px-2 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(entry.id)}
                                            onChange={() => toggleSelect(entry.id)}
                                            className="h-3.5 w-3.5 rounded border-pf-grey/30 accent-pf-blue"
                                            aria-label={`Selecionar lancamento de ${entry.submittedBy}`}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <Link href={`/time-tracking/${entry.id}/aprovacao`} className="font-bold text-pf-black text-xs hover:text-pf-blue transition-colors">
                                            {entry.submittedBy ?? "—"}
                                        </Link>
                                    </td>
                                    <td className="px-2 py-2">
                                        <p className="text-xs font-bold text-pf-black">{entry.caseNumber}</p>
                                        <p className="text-[10px] text-pf-grey truncate max-w-[150px]">{entry.clientName}</p>
                                    </td>
                                    <td className="px-2 py-2 text-xs text-pf-grey max-w-[200px] truncate">{entry.description}</td>
                                    <td className="px-2 py-2">
                                        <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${entry.isBillable ? "bg-green-100 text-green-700" : "bg-pf-grey/10 text-pf-grey"}`}>
                                            {entry.isBillable ? "Faturavel" : "Interno"}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 text-right font-bold text-pf-black font-mono text-xs">{formatDuration(entry.durationMinutes)}</td>
                                    <td className="px-2 py-2 text-right">
                                        <ApprovalActions
                                            status={entry.approvalStatus}
                                            onApprove={() => handleApprove(entry.id)}
                                            onReject={() => setRejectTarget(entry.id)}
                                            compact
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <BatchApprovalBar
                selectedCount={selectedIds.size}
                selectedSummary={selectedIds.size > 0 ? `Total: ${formatDuration(totalMinutes)}` : undefined}
                onApproveSelected={handleBatchApprove}
                onRejectSelected={handleBatchReject}
                onClearSelection={() => setSelectedIds(new Set())}
            />

            <ApprovalDialog
                isOpen={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                onConfirm={(comment) => rejectTarget && handleReject(rejectTarget, comment)}
                entityLabel={rejectItem ? `${rejectItem.submittedBy} — ${rejectItem.caseNumber} (${formatDuration(rejectItem.durationMinutes)})` : ""}
            />
        </div>
    );
}
