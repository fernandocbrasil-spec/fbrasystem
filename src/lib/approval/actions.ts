"use server";

// =============================================================================
// PF Advogados ERP — Approval Server Actions
// Role is ALWAYS read from session — never from client parameters
// TODO: Replace mock mutations with Drizzle DB operations when connected
// =============================================================================

import { auth } from "@/auth";
import { canUserApprove, type ApprovalEntityType, type UserRole } from "./types";
import { approvalActionSchema, batchApprovalSchema } from "@/lib/schemas";

type ApproveResult = { success: boolean; error?: string };

async function getSessionRole(): Promise<{ role: UserRole; userId: string } | null> {
    const session = await auth();
    if (!session?.user?.role) return null;
    return { role: session.user.role as UserRole, userId: session.user.id ?? "unknown" };
}

export async function approveEntity({
    entityType,
    entityId,
}: {
    entityType: ApprovalEntityType;
    entityId: string;
}): Promise<ApproveResult> {
    const sessionUser = await getSessionRole();
    if (!sessionUser) return { success: false, error: "Nao autenticado." };

    const parsed = approvalActionSchema.safeParse({
        entityType,
        entityId,
        action: "approve",
    });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
    }

    if (!canUserApprove(entityType, sessionUser.role)) {
        return { success: false, error: "Permissao insuficiente para aprovar este tipo de entidade." };
    }

    // TODO: Update DB record — set approvalStatus = "aprovado", approvedBy, approvedAt
    // TODO: Insert audit log entry
    console.log(`[Approval] Approved ${entityType} #${entityId} by user=${sessionUser.userId} role=${sessionUser.role}`);
    return { success: true };
}

export async function rejectEntity({
    entityType,
    entityId,
    comment,
}: {
    entityType: ApprovalEntityType;
    entityId: string;
    comment: string;
}): Promise<ApproveResult> {
    const sessionUser = await getSessionRole();
    if (!sessionUser) return { success: false, error: "Nao autenticado." };

    const parsed = approvalActionSchema.safeParse({
        entityType,
        entityId,
        action: "reject",
        comment,
    });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
    }

    if (!canUserApprove(entityType, sessionUser.role)) {
        return { success: false, error: "Permissao insuficiente para rejeitar este tipo de entidade." };
    }

    // TODO: Update DB record — set approvalStatus = "rejeitado", rejectionComment
    // TODO: Insert audit log entry
    console.log(`[Approval] Rejected ${entityType} #${entityId} by user=${sessionUser.userId} role=${sessionUser.role}: ${comment}`);
    return { success: true };
}

export async function batchApproveEntities({
    entityType,
    entityIds,
}: {
    entityType: ApprovalEntityType;
    entityIds: string[];
}): Promise<ApproveResult> {
    const sessionUser = await getSessionRole();
    if (!sessionUser) return { success: false, error: "Nao autenticado." };

    const parsed = batchApprovalSchema.safeParse({
        entityType,
        entityIds,
        action: "approve",
    });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
    }

    if (!canUserApprove(entityType, sessionUser.role)) {
        return { success: false, error: "Permissao insuficiente para aprovar este tipo de entidade." };
    }

    // TODO: Batch update DB records
    // TODO: Insert audit log entries
    console.log(`[Approval] Batch approved ${entityIds.length} ${entityType}(s) by user=${sessionUser.userId} role=${sessionUser.role}`);
    return { success: true };
}

export async function getPendingApprovalCounts(): Promise<Record<ApprovalEntityType, number>> {
    const sessionUser = await getSessionRole();
    if (!sessionUser) return { payable: 0, receivable: 0, time_entry: 0 };

    // TODO: Query DB for counts of pending approvals per entity type
    return {
        payable: 2,
        receivable: 2,
        time_entry: 2,
    };
}
