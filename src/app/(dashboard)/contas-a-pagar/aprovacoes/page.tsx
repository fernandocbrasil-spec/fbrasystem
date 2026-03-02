"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ApprovalActions } from "@/components/approval/approval-actions";
import { ApprovalDialog } from "@/components/approval/approval-dialog";
import { BatchApprovalBar } from "@/components/approval/batch-approval-bar";
import { MOCK_PAYABLES, type MockPayable } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";

export default function ContasAPagarAprovacoesPage() {
    const [data, setData] = useState<MockPayable[]>(MOCK_PAYABLES);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);

    const pending = data.filter((d) => d.approvalStatus === "pendente");

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
            setSelectedIds(new Set(pending.map((d) => d.id)));
        }
    };

    const handleApprove = (id: string) => {
        setData((prev) =>
            prev.map((d) =>
                d.id === id ? { ...d, approvalStatus: "aprovado" as const, approvedBy: "Jose Rafael Feiteiro", approvedAt: "01/03/2026" } : d
            )
        );
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    };

    const handleReject = (id: string, comment: string) => {
        setData((prev) =>
            prev.map((d) =>
                d.id === id ? { ...d, approvalStatus: "rejeitado" as const, rejectionComment: comment } : d
            )
        );
        setRejectTarget(null);
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    };

    const handleBatchApprove = () => {
        setData((prev) =>
            prev.map((d) =>
                selectedIds.has(d.id) ? { ...d, approvalStatus: "aprovado" as const, approvedBy: "Jose Rafael Feiteiro", approvedAt: "01/03/2026" } : d
            )
        );
        setSelectedIds(new Set());
    };

    const handleBatchReject = () => {
        if (selectedIds.size === 1) {
            setRejectTarget(Array.from(selectedIds)[0]);
        }
    };

    const rejectItem = rejectTarget ? data.find((d) => d.id === rejectTarget) : null;

    const selectedTotal = pending
        .filter((d) => selectedIds.has(d.id))
        .reduce((sum, d) => sum + parseFloat(d.valor.replace(/[^\d,]/g, "").replace(",", ".")), 0);

    return (
        <div>
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Aprovacoes — Contas a Pagar"
                    subtitle="Despesas pendentes de aprovacao do socio."
                    actions={
                        <Link
                            href="/contas-a-pagar"
                            className="flex items-center gap-2 rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-xs font-bold text-pf-black hover:bg-pf-grey/5 transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                            Voltar
                        </Link>
                    }
                />
            </div>

            {pending.length === 0 ? (
                <EmptyState title="Nenhuma aprovacao pendente" message="Todas as despesas foram processadas." />
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
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">Fornecedor</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">Categoria</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">Vencimento</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-right">Valor</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-right">Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pending.map((desp) => (
                                <tr key={desp.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors">
                                    <td className="px-2 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(desp.id)}
                                            onChange={() => toggleSelect(desp.id)}
                                            className="h-3.5 w-3.5 rounded border-pf-grey/30 accent-pf-blue"
                                            aria-label={`Selecionar ${desp.fornecedor}`}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <Link href={`/contas-a-pagar/${desp.id}/aprovacao`} className="font-bold text-pf-black text-xs hover:text-pf-blue transition-colors">
                                            {desp.fornecedor}
                                        </Link>
                                        {desp.submittedBy && <p className="text-[10px] text-pf-grey mt-0.5">por {desp.submittedBy}</p>}
                                    </td>
                                    <td className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-pf-grey">{desp.categoria}</td>
                                    <td className="px-2 py-2 font-mono text-xs font-semibold text-pf-black">{desp.vencimento}</td>
                                    <td className="px-2 py-2 text-right font-bold text-pf-black font-mono text-xs">{desp.valor}</td>
                                    <td className="px-2 py-2 text-right">
                                        <ApprovalActions
                                            status={desp.approvalStatus}
                                            onApprove={() => handleApprove(desp.id)}
                                            onReject={() => setRejectTarget(desp.id)}
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
                selectedSummary={selectedIds.size > 0 ? `Total: R$ ${selectedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : undefined}
                onApproveSelected={handleBatchApprove}
                onRejectSelected={handleBatchReject}
                onClearSelection={() => setSelectedIds(new Set())}
            />

            <ApprovalDialog
                isOpen={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                onConfirm={(comment) => rejectTarget && handleReject(rejectTarget, comment)}
                entityLabel={rejectItem ? `${rejectItem.fornecedor} — ${rejectItem.valor}` : ""}
            />
        </div>
    );
}
