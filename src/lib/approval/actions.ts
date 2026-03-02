"use server";

// =============================================================================
// PF Advogados ERP — Approval Server Actions
// TODO: Replace mock mutations with Drizzle DB operations when connected
// =============================================================================

import { canUserApprove, type ApprovalEntityType, type UserRole } from "./types";

type ApproveResult = { success: boolean; error?: string };

export async function approveEntity({
    entityType,
    entityId,
    userRole,
}: {
    entityType: ApprovalEntityType;
    entityId: string;
    userRole: UserRole;
}): Promise<ApproveResult> {
    if (!canUserApprove(entityType, userRole)) {
        return { success: false, error: "Permissao insuficiente para aprovar este tipo de entidade." };
    }

    // TODO: Update DB record — set approvalStatus = "aprovado", approvedBy, approvedAt
    // TODO: Insert audit log entry
    console.log(`[Approval] Approved ${entityType} #${entityId} by role=${userRole}`);
    return { success: true };
}

export async function rejectEntity({
    entityType,
    entityId,
    userRole,
    comment,
}: {
    entityType: ApprovalEntityType;
    entityId: string;
    userRole: UserRole;
    comment: string;
}): Promise<ApproveResult> {
    if (!canUserApprove(entityType, userRole)) {
        return { success: false, error: "Permissao insuficiente para rejeitar este tipo de entidade." };
    }

    if (!comment.trim()) {
        return { success: false, error: "Motivo da rejeicao e obrigatorio." };
    }

    // TODO: Update DB record — set approvalStatus = "rejeitado", rejectionComment
    // TODO: Insert audit log entry
    console.log(`[Approval] Rejected ${entityType} #${entityId} by role=${userRole}: ${comment}`);
    return { success: true };
}

export async function batchApproveEntities({
    entityType,
    entityIds,
    userRole,
}: {
    entityType: ApprovalEntityType;
    entityIds: string[];
    userRole: UserRole;
}): Promise<ApproveResult> {
    if (!canUserApprove(entityType, userRole)) {
        return { success: false, error: "Permissao insuficiente para aprovar este tipo de entidade." };
    }

    if (entityIds.length === 0) {
        return { success: false, error: "Nenhum item selecionado." };
    }

    // TODO: Batch update DB records
    // TODO: Insert audit log entries
    console.log(`[Approval] Batch approved ${entityIds.length} ${entityType}(s) by role=${userRole}`);
    return { success: true };
}

export async function getPendingApprovalCounts(): Promise<Record<ApprovalEntityType, number>> {
    // TODO: Query DB for counts of pending approvals per entity type
    return {
        payable: 2,
        receivable: 2,
        time_entry: 2,
    };
}
