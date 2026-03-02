import { PageHeader } from "@/components/ui/page-header";
import { ProposalEditor } from "@/components/proposals/proposal-editor";

type Props = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewProposalPage({ searchParams }: Props) {
    const params = await searchParams;
    const fromLeadId = typeof params.fromLead === "string" ? params.fromLead : undefined;
    const initialClient = typeof params.client === "string" ? params.client : undefined;
    const initialContact = typeof params.contact === "string" ? params.contact : undefined;
    const initialValue = typeof params.value === "string" ? params.value : undefined;

    return (
        <div className="h-full space-y-6">
            <PageHeader
                title={fromLeadId ? "Nova Proposta (a partir de Lead)" : "Nova Proposta"}
                subtitle={
                    fromLeadId
                        ? `Proposta pre-preenchida com dados do lead "${initialClient}". Ajuste os campos conforme necessario.`
                        : "Editor por blocos: preencha os dados e gere o PDF final seguindo as diretrizes PF Advogados."
                }
            />

            <ProposalEditor
                initialClient={initialClient}
                initialContact={initialContact}
                initialValue={initialValue}
                fromLeadId={fromLeadId}
            />
        </div>
    );
}
