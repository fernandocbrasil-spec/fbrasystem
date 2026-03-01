import { PageHeader } from "@/components/ui/page-header";
import { CheckCircle, XCircle, FileText, Download, Briefcase } from "lucide-react";

export default function ProposalApprovalPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Revisão de Proposta"
                subtitle="Analise os dados da proposta gerada antes de aprovar e enviar ao cliente."
            />

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
                                <button className="flex items-center gap-2 rounded border border-pf-grey/30 px-3 py-1.5 text-sm text-pf-grey hover:bg-pf-blue/5 hover:text-pf-blue transition-colors">
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
                        <p className="text-xs text-pf-grey mb-6">Ao aprovar, o PDF será finalizado, congelado (versionado) e o lead poderá avançar no funil para "Proposta Enviada".</p>

                        <div className="space-y-3">
                            <button className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 font-sans font-bold text-white transition-all hover:bg-green-700 active:scale-95 shadow-sm">
                                <CheckCircle className="h-5 w-5" />
                                Aprovar Proposta
                            </button>
                            <button className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-3 font-sans font-bold text-red-600 transition-all hover:bg-red-50 active:scale-95">
                                <XCircle className="h-5 w-5" />
                                Solicitar Revisão
                            </button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-pf-grey/10 bg-white p-6 shadow-sm">
                        <h3 className="font-sans text-sm font-bold uppercase tracking-tight text-pf-black mb-4">
                            Avançar no Pipeline?
                        </h3>
                        <p className="text-xs text-pf-grey mb-4">Se a proposta já foi enviada e aceita pelo cliente, você pode convertê-la em um Caso Ativo.</p>
                        <button className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-pf-black bg-pf-black px-4 py-3 font-sans font-bold text-white transition-all hover:bg-gray-800 active:scale-95 shadow-sm">
                            <Briefcase className="h-5 w-5" />
                            Aprovar & Gerar Caso
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
