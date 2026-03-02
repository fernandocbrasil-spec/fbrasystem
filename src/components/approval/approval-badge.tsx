"use client";

import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS } from "@/lib/approval/types";

export function ApprovalBadge({ status }: { status: string }) {
    const label = APPROVAL_STATUS_LABELS[status] ?? status;
    const colors = APPROVAL_STATUS_COLORS[status] ?? "bg-pf-grey/10 text-pf-grey";

    return (
        <span
            className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${colors}`}
        >
            {label}
        </span>
    );
}
