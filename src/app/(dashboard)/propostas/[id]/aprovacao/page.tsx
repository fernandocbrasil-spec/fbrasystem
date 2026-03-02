"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { CheckCircle, XCircle, FileText, Download, Briefcase, ShieldCheck, AlertTriangle } from "lucide-react";

type ApprovalStatus = "pending" | "approved" | "revision";

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
    pending: { label: "Pendente de Aprovação", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
    approved: { label: "Aprovada", color: "bg-green-100 text-green-700", icon: ShieldCheck },
    revision: { label: "Revisão Solicitada", color: "bg-red-100 text-red-700", icon: XCircle },
};

function generateProposalBlob(): string {
    return [
        "===========================================",
        "        PF ADVOGADOS - PROPOSTA",
        "===========================================",
        "",
        "Proposta #1",
        "Cliente: Grupo Sequoia",
        "Titulo: Assessoria Contabil e Fiscal",
        "Data: 26/02/2026",
        "",
        "-------------------------------------------",
        "Valor Mensal (Liquido): R$ 11.150,00",
        "Valor Bruto (com impostos): R$ 13.045,51",
        "Carga Tributaria Estimada: 14,53%",
        "",
        "-------------------------------------------",
        "Escopo dos Servicos:",
        "  - Apuracao de estimativa mensal de IRPJ e CSLL",
        "  - Auxilio no planejamento tributario",
        "  - Equalizacao de resultados entre as empresas do Grupo",
        "  - Revisao de operacoes intercompany",
        "",
        "-------------------------------------------",
        "Autor: Carlos Oliveira (Pleno)",
        "",
        "===========================================",
        "  Documento gerado automaticamente pelo ERP",
        "         PF Advogados - " + new Date().toLocaleDateString("pt-BR"),
        "===========================================",
    ].join("\n");
}

function downloadBlob(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function ProposalApprovalPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = useState<ApprovalStatus>("pending");

    const statusInfo = STATUS_CONFIG[status];
    const StatusBadgeIcon = statusInfo.icon;

    const handleVisualizePdf = () => {
        const content = generateProposalBlob();
        downloadBlob(content, "proposta-1-revisao.txt");
        toast("Documento gerado para visualização", "success");
    };

    const handleApprove = () => {
        setStatus("approved");
        toast("Proposta aprovada com sucesso", "success");
    };

    const handleRequestRevision = () => {
        setStatus("revision");
        toast("Revisão solicitada. O autor será notificado.", "warning");
    };

    const handleApproveAndCreateCase = () => {
        setStatus("approved");
        toast("Proposta aprovada. Redirecionando para criar caso...", "success");
        setTimeout(() => {
            router.push("/casos");
        }, 1200);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Revisão de Proposta"
                subtitle="Analise os dados da proposta gerada antes de aprovar e enviar ao cliente."
            />

            {/* Status Banner */}
            <div className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold ${statusInfo.color}`}>
                <StatusBadgeIcon className="h-5 w-5" />
                <span>Status atual: {statusInfo.label}</span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* PROPOSAL DETAILS */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-lg border border-pf-grey/10 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-pf-grey/10">
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-pf-blue/5 text-pf-blue ring-1 ring-pf-blue/20">
                                <FileText className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="font-sans text-2xl font-bold text-pf-black">Grupo Sequoia</h2>
                                <p className="font-sans text-sm text-pf-grey uppercase tracking-widest">Assessoria Contábil e Fiscal</p>
                            </div>
                            <div className="ml-auto">
                                <button
                                    onClick={handleVisualizePdf}
                                    className="flex items-center gap-2 rounded border border-pf-grey/30 px-3 py-1.5 text-sm text-pf-grey hover:bg-pf-blue/5 hover:text-pf-blue transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    Visualizar PDF
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6 text-sm">
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Autor</p>
                                <p className="text-pf-black">Carlos Oliveira (Pleno)</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Data</p>
                                <p className="text-pf-black">26/02/2026</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Valor Mensal (Líquido)</p>
                                <p className="text-pf-black font-sans text-lg font-bold">R$ 11.150,00</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Valor Bruto (com impostos)</p>
                                <p className="text-pf-blue font-bold text-lg">R$ 13.045,51</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs font-bold uppercase text-pf-grey mb-1">Escopo Resumido</p>
                                <p className="text-pf-black bg-pf-grey/5 p-3 rounded-md line-clamp-3">
                                    Apuração de estimativa mensal de IRPJ e CSLL; Auxílio no planejamento tributário; Equalização de resultados entre as empresas do Grupo; Revisão de operações intercompany.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* APPROVAL ACTIONS */}
                <div className="space-y-6">
                    <div className="rounded-lg border border-pf-blue/20 bg-pf-blue/5 p-6 shadow-sm">
                        <h3 className="font-sans text-lg font-bold uppercase tracking-tight text-pf-blue mb-4">
                            Ação do Sócio
                        </h3>
                        <p className="text-xs text-pf-grey mb-6">Ao aprovar, o PDF será finalizado, congelado (versionado) e o lead poderá avançar no funil para &quot;Proposta Enviada&quot;.</p>

                        <div className="space-y-3">
                            <button
                                onClick={handleApprove}
                                disabled={status === "approved"}
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 font-sans font-bold text-white transition-all hover:bg-green-700 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                <CheckCircle className="h-5 w-5" />
                                {status === "approved" ? "Proposta Aprovada" : "Aprovar Proposta"}
                            </button>
                            <button
                                onClick={handleRequestRevision}
                                disabled={status === "revision"}
                                className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-3 font-sans font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                <XCircle className="h-5 w-5" />
                                {status === "revision" ? "Revisão Solicitada" : "Solicitar Revisão"}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-pf-grey/10 bg-white p-6 shadow-sm">
                        <h3 className="font-sans text-sm font-bold uppercase tracking-tight text-pf-black mb-4">
                            Avançar no Pipeline?
                        </h3>
                        <p className="text-xs text-pf-grey mb-4">Se a proposta já foi enviada e aceita pelo cliente, você pode convertê-la em um Caso Ativo.</p>
                        <button
                            onClick={handleApproveAndCreateCase}
                            className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-pf-black bg-pf-black px-4 py-3 font-sans font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm"
                        >
                            <Briefcase className="h-5 w-5" />
                            Aprovar & Gerar Caso
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
