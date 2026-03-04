"use server";

// =============================================================================
// PF Advogados ERP — Approval Server Actions
// Role is ALWAYS read from session — never from client parameters
// =============================================================================

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { accountsPayable, arTitles, timeEntries, preInvoices, auditLogs } from "@/lib/db/schema";
import { canUserApprove, type ApprovalEntityType, type UserRole } from "./types";
import { approvalActionSchema, batchApprovalSchema } from "@/lib/schemas";
import { rateLimitApproval } from "@/lib/rate-limit";
import { eq, inArray, sql } from "drizzle-orm";

type ApproveResult = { success: boolean; error?: string };

async function getSessionRole(): Promise<{ role: UserRole; userId: string } | null> {
    const session = await auth();
    if (!session?.user?.role) return null;
    return { role: session.user.role as UserRole, userId: session.user.id ?? "unknown" };
}

// Entity table mapping for DB updates
async function updateEntityStatus(
    entityType: ApprovalEntityType,
    entityId: string,
    status: "aprovado" | "rejeitado",
    userId: string,
    comment?: string,
): Promise<boolean> {
    const now = new Date();

    switch (entityType) {
        case "payable":
            await db.update(accountsPayable).set({
                approvalStatus: status,
                ...(status === "aprovado" ? { approvedBy: userId, approvedAt: now } : {}),
                ...(status === "rejeitado" && comment ? { rejectionComment: comment } : {}),
            }).where(eq(accountsPayable.id, entityId));
            return true;

        case "receivable":
            await db.update(arTitles).set({
                approvalStatus: status,
                ...(status === "aprovado" ? { approvedBy: userId, approvedAt: now } : {}),
                ...(status === "rejeitado" && comment ? { rejectionComment: comment } : {}),
            }).where(eq(arTitles.id, entityId));
            return true;

        case "time_entry":
            await db.update(timeEntries).set({
                approvalStatus: status,
                updatedAt: now,
                ...(status === "aprovado" ? { approvedBy: userId, approvedAt: now } : {}),
                ...(status === "rejeitado" && comment ? { rejectionComment: comment } : {}),
            }).where(eq(timeEntries.id, entityId));
            return true;

        case "pre_invoice": {
            const piStatus = status === "aprovado" ? "approved" : "rejected";
            await db.update(preInvoices).set({
                status: piStatus,
                updatedAt: now,
                ...(status === "aprovado" ? { approvedBy: userId, approvedAt: now } : {}),
                ...(status === "rejeitado" && comment ? { notes: comment } : {}),
            }).where(eq(preInvoices.id, entityId));

            // If rejected, unlock time entries
            if (status === "rejeitado") {
                await db.update(timeEntries).set({
                    preInvoiceId: null,
                    approvalStatus: "aprovado",
                    updatedAt: now,
                }).where(eq(timeEntries.preInvoiceId, entityId));
            }
            return true;
        }

        default:
            return false;
    }
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

    const rl = rateLimitApproval(sessionUser.userId);
    if (!rl.success) return { success: false, error: "Limite de requisicoes excedido. Tente novamente em breve." };

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

    try {
        await updateEntityStatus(entityType, entityId, "aprovado", sessionUser.userId);

        await db.insert(auditLogs).values({
            userId: sessionUser.userId,
            action: `${entityType}_approved`,
            entityType,
            entityId,
        });

        return { success: true };
    } catch (err) {
        console.error(`[approveEntity] ${entityType} #${entityId}`, err);
        return { success: false, error: "Erro ao aprovar entidade." };
    }
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

    const rl = rateLimitApproval(sessionUser.userId);
    if (!rl.success) return { success: false, error: "Limite de requisicoes excedido. Tente novamente em breve." };

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

    try {
        await updateEntityStatus(entityType, entityId, "rejeitado", sessionUser.userId, comment);

        await db.insert(auditLogs).values({
            userId: sessionUser.userId,
            action: `${entityType}_rejected`,
            entityType,
            entityId,
            newData: { comment },
        });

        return { success: true };
    } catch (err) {
        console.error(`[rejectEntity] ${entityType} #${entityId}`, err);
        return { success: false, error: "Erro ao rejeitar entidade." };
    }
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

    const rl = rateLimitApproval(sessionUser.userId);
    if (!rl.success) return { success: false, error: "Limite de requisicoes excedido. Tente novamente em breve." };

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

    try {
        for (const entityId of entityIds) {
            await updateEntityStatus(entityType, entityId, "aprovado", sessionUser.userId);
        }

        await db.insert(auditLogs).values({
            userId: sessionUser.userId,
            action: `${entityType}_batch_approved`,
            entityType,
            entityId: entityIds[0],
            newData: { count: entityIds.length, ids: entityIds },
        });

        return { success: true };
    } catch (err) {
        console.error(`[batchApproveEntities] ${entityType}`, err);
        return { success: false, error: "Erro ao aprovar entidades em lote." };
    }
}

export async function getPendingApprovalCounts(): Promise<Record<ApprovalEntityType, number>> {
    const sessionUser = await getSessionRole();
    if (!sessionUser) return { payable: 0, receivable: 0, time_entry: 0, pre_invoice: 0 };

    try {
        const [payableCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(accountsPayable)
            .where(eq(accountsPayable.approvalStatus, "pendente"));

        const [receivableCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(arTitles)
            .where(inArray(arTitles.approvalStatus, ["desconto_solicitado", "baixa_solicitada"]));

        const [teCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(timeEntries)
            .where(eq(timeEntries.approvalStatus, "pendente"));

        const [piCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(preInvoices)
            .where(eq(preInvoices.status, "pending"));

        return {
            payable: Number(payableCount?.count ?? 0),
            receivable: Number(receivableCount?.count ?? 0),
            time_entry: Number(teCount?.count ?? 0),
            pre_invoice: Number(piCount?.count ?? 0),
        };
    } catch {
        return { payable: 0, receivable: 0, time_entry: 0, pre_invoice: 0 };
    }
}
