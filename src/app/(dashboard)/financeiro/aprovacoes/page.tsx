"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ApprovalActions } from "@/components/approval/approval-actions";
import { ApprovalDialog } from "@/components/approval/approval-dialog";
import { ApprovalBadge } from "@/components/approval/approval-badge";
import { MOCK_RECEIVABLES, type MockReceivable } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";

export default function FinanceiroAprovacoesPage() {
    const [data, setData] = useState<MockReceivable[]>(MOCK_RECEIVABLES);
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);

    const pending = data.filter(
        (r) => r.approvalStatus === "desconto_solicitado" || r.approvalStatus === "baixa_solicitada"
    );

    const handleApprove = (id: string) => {
        setData((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, approvalStatus: "aprovado" as const, approvedBy: "Jose Rafael Feiteiro", approvedAt: "01/03/2026" } : r
            )
        );
    };

    const handleReject = (id: string, comment: string) => {
        setData((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, approvalStatus: "rejeitado" as const, rejectionComment: comment } : r
            )
        );
        setRejectTarget(null);
    };

    const rejectItem = rejectTarget ? data.find((r) => r.id === rejectTarget) : null;

    const requestTypeLabel = (r: MockReceivable) => {
        if (r.approvalStatus === "desconto_solicitado") return "Desconto";
        if (r.approvalStatus === "baixa_solicitada") return "Baixa";
        return "—";
    };

    return (
        <div>
            <div className="space-y-2 pb-3">
                <PageHeader
                    title="Aprovacoes — Financeiro"
                    subtitle="Solicitacoes de desconto e baixa pendentes de aprovacao."
                    actions={
                        <Link
                            href="/financeiro"
                            className="flex items-center gap-2 rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-xs font-bold text-pf-black hover:bg-pf-grey/5 transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                            Voltar
                        </Link>
                    }
                />
            </div>

            {pending.length === 0 ? (
                <EmptyState title="Nenhuma solicitacao pendente" message="Todas as solicitacoes foram processadas." />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-sm">
                        <thead>
                            <tr className="text-pf-grey border-b border-pf-grey/20">
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">Cliente</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">Tipo Solicitacao</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-right">Valor Original</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-right">Valor Solicitado</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">Motivo</th>
                                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-right">Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pending.map((rec) => (
                                <tr key={rec.id} className="border-b border-pf-grey/15 hover:bg-white transition-colors">
                                    <td className="px-2 py-2">
                                        <Link href={`/financeiro/${rec.id}/aprovacao`} className="font-bold text-pf-black text-xs hover:text-pf-blue transition-colors">
                                            {rec.cliente}
                                        </Link>
                                        <p className="text-[10px] text-pf-grey mt-0.5 truncate max-w-[200px]">{rec.descricao}</p>
                                    </td>
                                    <td className="px-2 py-2">
                                        <ApprovalBadge status={rec.approvalStatus} />
                                    </td>
                                    <td className="px-2 py-2 text-right font-bold text-pf-black font-mono text-xs">{rec.valor}</td>
                                    <td className="px-2 py-2 text-right font-bold text-pf-blue font-mono text-xs">
                                        {rec.requestedValue ?? "—"}
                                    </td>
                                    <td className="px-2 py-2 text-xs text-pf-grey max-w-[200px] truncate">
                                        {rec.requestedReason ?? "—"}
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                        <ApprovalActions
                                            status="pendente"
                                            onApprove={() => handleApprove(rec.id)}
                                            onReject={() => setRejectTarget(rec.id)}
                                            compact
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ApprovalDialog
                isOpen={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                onConfirm={(comment) => rejectTarget && handleReject(rejectTarget, comment)}
                entityLabel={rejectItem ? `${rejectItem.cliente} — ${rejectItem.valor}` : ""}
            />
        </div>
    );
}
