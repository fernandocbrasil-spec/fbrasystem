"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ApprovalBadge } from "@/components/approval/approval-badge";
import { MOCK_TIME_ENTRIES } from "@/lib/mock-data";
import { ArrowLeft, CheckCircle, XCircle, Clock, User, Calendar, Briefcase } from "lucide-react";
import Link from "next/link";

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

export default function TimeTrackingAprovacaoDetalhePage() {
    const { id } = useParams<{ id: string }>();
    const item = MOCK_TIME_ENTRIES.find((t) => t.id === id);

    const [status, setStatus] = useState(item?.approvalStatus ?? "pendente");
    const [rejectComment, setRejectComment] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);

    if (!item) {
        return (
            <div className="py-12 text-center">
                <p className="text-sm text-pf-grey">Lancamento nao encontrado.</p>
                <Link href="/time-tracking/aprovacoes" className="text-xs text-pf-blue hover:underline mt-2 inline-block">
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
                title="Aprovacao de Lancamento"
                subtitle={`${item.submittedBy} — ${item.caseNumber}`}
                actions={
                    <Link
                        href="/time-tracking/aprovacoes"
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
                                <Clock className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="font-sans text-2xl font-bold text-pf-black">{formatDuration(item.durationMinutes)}</h2>
                                <p className="font-sans text-sm text-pf-grey">{ACTIVITY_LABELS[item.activityType] ?? item.activityType}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${item.isBillable ? "bg-green-100 text-green-700" : "bg-pf-grey/10 text-pf-grey"}`}>
                                    {item.isBillable ? "Faturavel" : "Interno"}
                                </span>
                                <ApprovalBadge status={status} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6 text-sm">
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1 flex items-center gap-1.5">
                                    <User className="h-3 w-3" aria-hidden="true" />
                                    Advogado
                                </p>
                                <p className="text-pf-black">{item.submittedBy ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1 flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" aria-hidden="true" />
                                    Data
                                </p>
                                <p className="text-pf-black font-mono">{item.date}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1 flex items-center gap-1.5">
                                    <Briefcase className="h-3 w-3" aria-hidden="true" />
                                    Caso
                                </p>
                                <p className="text-pf-black font-bold">{item.caseNumber}</p>
                                <p className="text-xs text-pf-grey">{item.caseTitle}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Cliente</p>
                                <p className="text-pf-black">{item.clientName}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Descricao da Atividade</p>
                                <p className="text-pf-black bg-pf-grey/5 p-3 rounded-md">{item.description}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Horario de Inicio</p>
                                <p className="text-pf-black font-mono">{item.startTime}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Duracao</p>
                                <p className="text-pf-black font-sans text-lg font-bold">{formatDuration(item.durationMinutes)}</p>
                            </div>
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
                                Ao aprovar, o lancamento sera contabilizado e ficara disponivel para faturamento.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleApprove}
                                    className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 font-sans font-bold text-white transition-all hover:bg-green-700 active:scale-95 shadow-sm"
                                >
                                    <CheckCircle className="h-5 w-5" />
                                    Aprovar Lancamento
                                </button>

                                {!showRejectForm ? (
                                    <button
                                        onClick={() => setShowRejectForm(true)}
                                        className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-3 font-sans font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95"
                                    >
                                        <XCircle className="h-5 w-5" />
                                        Solicitar Correcao
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <textarea
                                            value={rejectComment}
                                            onChange={(e) => setRejectComment(e.target.value)}
                                            placeholder="Motivo da correcao (obrigatorio)..."
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
                                    <span className="text-xs text-pf-grey">Lancamento aprovado com sucesso.</span>
                                )}
                                {status === "rejeitado" && (
                                    <span className="text-xs text-red-500">Lancamento devolvido para correcao.</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
