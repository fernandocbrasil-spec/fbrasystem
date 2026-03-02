"use client";

import { Check, X } from "lucide-react";
import { ApprovalBadge } from "./approval-badge";

type ApprovalActionsProps = {
    status: string;
    approvedBy?: string;
    rejectionComment?: string;
    onApprove: () => void;
    onReject: () => void;
    compact?: boolean;
};

export function ApprovalActions({
    status,
    approvedBy,
    rejectionComment,
    onApprove,
    onReject,
    compact = false,
}: ApprovalActionsProps) {
    if (status === "aprovado" || status === "pago" || status === "agendado" || status === "faturado") {
        return (
            <div className="flex items-center gap-2">
                <ApprovalBadge status={status} />
                {approvedBy && (
                    <span className="text-[9px] text-pf-grey font-medium truncate max-w-[120px]">
                        por {approvedBy}
                    </span>
                )}
            </div>
        );
    }

    if (status === "rejeitado") {
        return (
            <div className="flex items-center gap-2" title={rejectionComment}>
                <ApprovalBadge status={status} />
                {rejectionComment && (
                    <span className="text-[9px] text-red-500 font-medium truncate max-w-[150px]">
                        {rejectionComment}
                    </span>
                )}
            </div>
        );
    }

    // Pending states — show approve/reject buttons
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={(e) => { e.stopPropagation(); onApprove(); }}
                className={`flex items-center gap-1 rounded bg-green-600 text-white font-bold transition-all hover:bg-green-700 active:scale-95 ${compact ? "px-1.5 py-1 text-[10px]" : "px-2 py-1 text-xs"}`}
                aria-label="Aprovar"
            >
                <Check className="h-3 w-3" aria-hidden="true" />
                {!compact && "Aprovar"}
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className={`flex items-center justify-center rounded border border-red-200 bg-white text-red-600 font-bold transition-all hover:bg-red-50 active:scale-95 ${compact ? "p-1" : "p-1.5"}`}
                aria-label="Rejeitar"
            >
                <X className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />
            </button>
        </div>
    );
}
