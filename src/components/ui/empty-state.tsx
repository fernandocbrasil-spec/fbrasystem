import { SearchX } from "lucide-react";

interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export function EmptyState({
    title = "Nenhum resultado encontrado",
    message = "Tente ajustar os filtros ou criar um novo registro.",
    icon,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {icon || <SearchX className="h-8 w-8 text-pf-grey/30 mb-4" aria-hidden="true" />}
            <p className="text-sm font-bold text-pf-black">{title}</p>
            <p className="text-xs text-pf-grey mt-1 max-w-xs">{message}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
