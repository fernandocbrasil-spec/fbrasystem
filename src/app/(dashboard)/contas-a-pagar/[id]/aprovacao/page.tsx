"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ApprovalBadge } from "@/components/approval/approval-badge";
import { MOCK_PAYABLES } from "@/lib/mock-data";
import { ArrowLeft, CheckCircle, XCircle, CreditCard, User, Calendar, Tag } from "lucide-react";
import Link from "next/link";

export default function ContasAPagarAprovacaoDetalhePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const item = MOCK_PAYABLES.find((p) => p.id === id);

    const [status, setStatus] = useState(item?.approvalStatus ?? "pendente");
    const [rejectComment, setRejectComment] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);

    if (!item) {
        return (
            <div className="py-12 text-center">
                <p className="text-sm text-pf-grey">Despesa nao encontrada.</p>
                <Link href="/contas-a-pagar/aprovacoes" className="text-xs text-pf-blue hover:underline mt-2 inline-block">
                    Voltar para aprovacoes
                </Link>
            </div>
        );
    }

    const isPending = status === "pendente";

    const handleApprove = () => {
        setStatus("aprovado");
    };

    const handleReject = () => {
        if (rejectComment.trim()) {
            setStatus("rejeitado");
            setShowRejectForm(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Aprovacao de Despesa"
                subtitle={`${item.fornecedor} — ${item.valor}`}
                actions={
                    <Link
                        href="/contas-a-pagar/aprovacoes"
                        className="flex items-center gap-2 rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-xs font-bold text-pf-black hover:bg-pf-grey/5 transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                        Voltar
                    </Link>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* DETALHES */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-lg border border-pf-grey/10 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-pf-grey/10">
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-pf-blue/5 text-pf-blue ring-1 ring-pf-blue/20">
                                <CreditCard className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="font-sans text-2xl font-bold text-pf-black">{item.fornecedor}</h2>
                                <p className="font-sans text-sm text-pf-grey uppercase tracking-widest">{item.categoria}</p>
                            </div>
                            <div className="ml-auto">
                                <ApprovalBadge status={status} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6 text-sm">
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1 flex items-center gap-1.5">
                                    <Tag className="h-3 w-3" aria-hidden="true" />
                                    Categoria
                                </p>
                                <p className="text-pf-black">{item.categoria}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1 flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" aria-hidden="true" />
                                    Vencimento
                                </p>
                                <p className="text-pf-black font-mono">{item.vencimento}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Valor</p>
                                <p className="text-pf-black font-sans text-lg font-bold">{item.valor}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Status Pagamento</p>
                                <p className="text-pf-black font-bold">{item.status}</p>
                            </div>
                            {item.submittedBy && (
                                <div>
                                    <p className="text-xs font-bold uppercase text-pf-grey mb-1 flex items-center gap-1.5">
                                        <User className="h-3 w-3" aria-hidden="true" />
                                        Solicitado por
                                    </p>
                                    <p className="text-pf-black">{item.submittedBy}</p>
                                </div>
                            )}
                            {item.approvedBy && (
                                <div>
                                    <p className="text-xs font-bold uppercase text-pf-grey mb-1">Aprovado por</p>
                                    <p className="text-pf-black">{item.approvedBy} em {item.approvedAt}</p>
                                </div>
                            )}
                            {item.rejectionComment && (
                                <div className="col-span-2">
                                    <p className="text-xs font-bold uppercase text-red-600 mb-1">Motivo da Rejeicao</p>
                                    <p className="text-pf-black bg-red-50 p-3 rounded-md text-sm">{item.rejectionComment}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ACOES */}
                <div className="space-y-6">
                    {isPending ? (
                        <div className="rounded-lg border border-pf-blue/20 bg-pf-blue/5 p-6 shadow-sm">
                            <h3 className="font-sans text-lg font-bold uppercase tracking-tight text-pf-blue mb-4">
                                Acao do Socio
                            </h3>
                            <p className="text-xs text-pf-grey mb-6">
                                Ao aprovar, a despesa sera liberada para agendamento de pagamento.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleApprove}
                                    className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 font-sans font-bold text-white transition-all hover:bg-green-700 active:scale-95 shadow-sm"
                                >
                                    <CheckCircle className="h-5 w-5" />
                                    Aprovar Despesa
                                </button>

                                {!showRejectForm ? (
                                    <button
                                        onClick={() => setShowRejectForm(true)}
                                        className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-3 font-sans font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95"
                                    >
                                        <XCircle className="h-5 w-5" />
                                        Solicitar Revisao
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <textarea
                                            value={rejectComment}
                                            onChange={(e) => setRejectComment(e.target.value)}
                                            placeholder="Motivo da rejeicao (obrigatorio)..."
                                            rows={3}
                                            className="w-full rounded-md border border-pf-grey/20 px-3 py-2 text-sm font-sans outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowRejectForm(false)}
                                                className="flex-1 rounded-md border border-pf-grey/20 bg-white px-3 py-2 text-xs font-bold text-pf-black hover:bg-pf-grey/5 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleReject}
                                                disabled={!rejectComment.trim()}
                                                className="flex-1 rounded-md bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-pf-grey/10 bg-white p-6 shadow-sm">
                            <h3 className="font-sans text-sm font-bold uppercase tracking-tight text-pf-black mb-4">
                                Status da Aprovacao
                            </h3>
                            <div className="flex items-center gap-3">
                                <ApprovalBadge status={status} />
                                {status === "aprovado" && (
                                    <span className="text-xs text-pf-grey">Despesa aprovada com sucesso.</span>
                                )}
                                {status === "rejeitado" && (
                                    <span className="text-xs text-red-500">Despesa rejeitada.</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
