import { AlertTriangle, X } from "lucide-react";

interface ErrorBannerProps {
    message: string;
    onDismiss?: () => void;
    action?: { label: string; onClick: () => void };
}

export function ErrorBanner({ message, onDismiss, action }: ErrorBannerProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-700 truncate">{message}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
                {action && (
                    <button
                        onClick={action.onClick}
                        className="text-[10px] font-bold text-red-700 hover:text-red-900 transition-colors"
                    >
                        {action.label}
                    </button>
                )}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
