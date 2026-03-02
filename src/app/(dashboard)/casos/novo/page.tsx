"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { Briefcase, Save } from "lucide-react";

const AREA_OPTIONS = [
    "Tributario / Consultivo",
    "Tributario / Planejamento",
    "Trabalhista",
    "Societario",
    "Contencioso",
    "Compliance",
];

const RESPONSIBLE_OPTIONS = [
    "Jose Rafael Feiteiro",
    "Carlos Oliveira",
    "Ana Souza",
    "Fernando Brasil",
];

export default function NewCasePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const fromProposalId = searchParams.get("fromProposal");
    const initialClient = searchParams.get("client") || "";
    const initialTitle = searchParams.get("title") || "";
    const initialValue = searchParams.get("value") || "";

    const [client, setClient] = useState(initialClient);
    const [title, setTitle] = useState(initialTitle);
    const [area, setArea] = useState(AREA_OPTIONS[0]);
    const [responsible, setResponsible] = useState(RESPONSIBLE_OPTIONS[0]);

    const inputClasses =
        "w-full border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded";

    const handleCreate = () => {
        if (!client.trim() || !title.trim()) {
            toast("Preencha o cliente e o titulo do caso.", "warning");
            return;
        }

        // In production this would call a server action to create the case in DB
        toast(`Caso "${title}" criado com sucesso para ${client}.`, "success");
        router.push("/casos");
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={fromProposalId ? "Novo Caso (a partir de Proposta)" : "Novo Caso"}
                subtitle={
                    fromProposalId
                        ? `Caso pre-preenchido a partir da proposta aprovada. Valor: ${initialValue}.`
                        : "Crie um novo caso de atendimento para o escritorio."
                }
            />

            <div className="max-w-2xl rounded-lg border border-pf-grey/20 bg-white p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-pf-grey/10">
                    <Briefcase className="h-5 w-5 text-pf-blue" />
                    <h3 className="font-sans text-sm font-bold text-pf-black">Dados do Caso</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Cliente
                        </label>
                        <input
                            type="text"
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            placeholder="Nome do cliente"
                            className={inputClasses}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Titulo do Caso
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Assessoria Contabil e Fiscal"
                            className={inputClasses}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Area
                        </label>
                        <select value={area} onChange={(e) => setArea(e.target.value)} className={inputClasses}>
                            {AREA_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey">
                            Responsavel
                        </label>
                        <select
                            value={responsible}
                            onChange={(e) => setResponsible(e.target.value)}
                            className={inputClasses}
                        >
                            {RESPONSIBLE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-pf-grey/10">
                    <Button variant="secondary" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button icon={<Save className="h-4 w-4" />} onClick={handleCreate}>
                        Criar Caso
                    </Button>
                </div>
            </div>
        </div>
    );
}
