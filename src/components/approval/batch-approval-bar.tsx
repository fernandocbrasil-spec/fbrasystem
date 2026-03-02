"use client";

import { Check, X, XCircle } from "lucide-react";

type BatchApprovalBarProps = {
    selectedCount: number;
    selectedSummary?: string;
    onApproveSelected: () => void;
    onRejectSelected: () => void;
    onClearSelection: () => void;
};

export function BatchApprovalBar({
    selectedCount,
    selectedSummary,
    onApproveSelected,
    onRejectSelected,
    onClearSelection,
}: BatchApprovalBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-pf-grey/20 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom-4">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                    <span className="font-sans text-sm font-bold text-pf-black">
                        {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
                    </span>
                    {selectedSummary && (
                        <span className="text-xs text-pf-grey font-medium">
                            {selectedSummary}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClearSelection}
                        className="flex items-center gap-1.5 rounded-md border border-pf-grey/20 bg-white px-3 py-1.5 text-xs font-bold text-pf-grey hover:text-pf-black hover:border-pf-grey/40 transition-colors"
                    >
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Limpar
                    </button>
                    <button
                        onClick={onRejectSelected}
                        className="flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Rejeitar
                    </button>
                    <button
                        onClick={onApproveSelected}
                        className="flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition-colors"
                    >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Aprovar Selecionados
                    </button>
                </div>
            </div>
        </div>
    );
}
