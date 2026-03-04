import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    // Invoice / Pre-invoice lifecycle
    "Rascunho": { bg: "bg-gray-100", text: "text-gray-600" },
    "Pendente Aprovacao": { bg: "bg-orange-100", text: "text-orange-700" },
    "Aprovado": { bg: "bg-green-100", text: "text-green-700" },
    "Faturado": { bg: "bg-indigo-100", text: "text-indigo-700" },
    "Rejeitado": { bg: "bg-red-100", text: "text-red-700" },
    "Cancelado": { bg: "bg-gray-100", text: "text-gray-400" },

    // Case lifecycle
    "Ativo": { bg: "bg-green-100", text: "text-green-700" },
    "Em Pausa": { bg: "bg-amber-100", text: "text-amber-700" },
    "Encerrado": { bg: "bg-pf-grey/10", text: "text-pf-grey" },

    // Time entry
    "Pendente": { bg: "bg-orange-100", text: "text-orange-700" },

    // Approval
    "approved": { bg: "bg-green-100", text: "text-green-700" },
    "pending": { bg: "bg-orange-100", text: "text-orange-700" },
    "rejected": { bg: "bg-red-100", text: "text-red-700" },

    // Priority
    "Alta": { bg: "bg-red-100", text: "text-red-700" },
    "Media": { bg: "bg-orange-100", text: "text-orange-700" },
    "Baixa": { bg: "bg-blue-100", text: "text-blue-700" },

    // Billable
    "Faturavel": { bg: "bg-green-100", text: "text-green-700" },
    "Interno": { bg: "bg-pf-grey/10", text: "text-pf-grey" },
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const style = STATUS_STYLES[status] ?? { bg: "bg-pf-grey/10", text: "text-pf-grey" };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                style.bg,
                style.text,
                className,
            )}
        >
            {status}
        </span>
    );
}

/** Export the raw map for cases where components need direct access */
export { STATUS_STYLES };
