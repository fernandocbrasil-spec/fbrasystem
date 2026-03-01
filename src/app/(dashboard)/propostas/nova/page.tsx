import { PageHeader } from "@/components/ui/page-header";
import { ProposalEditor } from "@/components/proposals/proposal-editor";

export default function NewProposalPage() {
    return (
        <div className="h-full space-y-6">
            <PageHeader
                title="Nova Proposta"
                subtitle="Editor por blocos: preencha os dados e gere o PDF final seguindo as diretrizes PF Advogados."
            />

            <ProposalEditor />
        </div>
    );
}
