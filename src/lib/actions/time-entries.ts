"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { timeEntries, cases, clients, users, auditLogs } from "@/lib/db/schema";
import { formatDateBR } from "@/lib/db/format";
import { eq, and, inArray, sql } from "drizzle-orm";
import { MOCK_TIME_ENTRIES, type MockTimeEntry } from "@/lib/mock-data";
import type { TimeEntryApprovalStatus } from "@/lib/approval/types";
import { isValidTimeEntryTransition } from "@/lib/approval/types";
import { getCapStatus, simulateEntry, type CapStatus } from "@/lib/billing/cap";

// ============================================================================
// Schemas
// ============================================================================

const timeEntriesFilterSchema = z.object({
    search: z.string().max(200).optional(),
    activityType: z.array(z.string().max(50)).optional(),
    date: z.string().max(20).optional(),
    caseId: z.string().uuid().optional(),
}).optional();

const createTimeEntrySchema = z.object({
    caseId: z.string().uuid(),
    taskId: z.string().uuid().optional(),
    activityType: z.string().min(1).max(100),
    description: z.string().min(1),
    durationMinutes: z.number().int().positive(),
    date: z.string().max(20),
    isBillable: z.boolean().optional(),
    capOverrideReason: z.string().max(500).optional(),
});

const updateTimeEntryDataSchema = z.object({
    activityType: z.string().min(1).max(100).optional(),
    description: z.string().min(1).optional(),
    durationMinutes: z.number().int().positive().optional(),
    date: z.string().max(20).optional(),
    isBillable: z.boolean().optional(),
});

// ============================================================================
// Mapper
// ============================================================================

function toMockTimeEntry(
    row: typeof timeEntries.$inferSelect,
    caseNumber: string,
    caseTitle: string,
    clientName: string,
    submitterName: string,
    approverName?: string,
): MockTimeEntry {
    return {
        id: row.id,
        caseNumber,
        caseTitle,
        clientName,
        activityType: row.activityType as MockTimeEntry["activityType"],
        description: row.description,
        durationMinutes: row.durationMinutes,
        date: row.date,
        startTime: "09:00",
        isBillable: row.isBillable ?? true,
        approvalStatus: (row.approvalStatus ?? "rascunho") as TimeEntryApprovalStatus,
        submittedBy: submitterName || undefined,
        approvedBy: approverName || undefined,
        approvedAt: row.approvedAt ? formatDateBR(row.approvedAt.toISOString().split("T")[0]) : undefined,
        rejectionComment: row.rejectionComment ?? undefined,
    };
}

// ============================================================================
// Queries
// ============================================================================

export async function getTimeEntries(filters?: z.input<typeof timeEntriesFilterSchema>): Promise<MockTimeEntry[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = timeEntriesFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    try {
        const conditions = [];
        if (f?.caseId) {
            conditions.push(eq(timeEntries.caseId, f.caseId));
        }
        if (f?.date) {
            conditions.push(eq(timeEntries.date, f.date));
        }
        if (f?.activityType?.length) {
            conditions.push(inArray(timeEntries.activityType, f.activityType));
        }

        const submitter = users;

        const rows = await db
            .select({
                entry: timeEntries,
                caseNumber: cases.caseNumber,
                caseTitle: cases.title,
                clientName: clients.companyName,
                submitterName: submitter.name,
            })
            .from(timeEntries)
            .leftJoin(cases, eq(timeEntries.caseId, cases.id))
            .leftJoin(clients, eq(cases.clientId, clients.id))
            .leftJoin(submitter, eq(timeEntries.userId, submitter.id))
            .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
            .orderBy(timeEntries.date);

        let results = rows.map((r) =>
            toMockTimeEntry(
                r.entry,
                r.caseNumber ?? "",
                r.caseTitle ?? "",
                r.clientName ?? "",
                r.submitterName ?? "",
            ),
        );

        if (f?.search) {
            const q = f.search.toLowerCase();
            results = results.filter(
                (e) =>
                    e.description.toLowerCase().includes(q) ||
                    e.clientName.toLowerCase().includes(q),
            );
        }

        return results;
    } catch {
        let results = [...MOCK_TIME_ENTRIES];
        if (f?.date) {
            results = results.filter((e) => e.date === f.date);
        }
        if (f?.search) {
            const q = f.search.toLowerCase();
            results = results.filter(
                (e) =>
                    e.description.toLowerCase().includes(q) ||
                    e.clientName.toLowerCase().includes(q),
            );
        }
        if (f?.activityType?.length) {
            results = results.filter((e) => f.activityType!.includes(e.activityType));
        }
        return results;
    }
}

// ============================================================================
// Cap Status (server action wrapper for UI)
// ============================================================================

export async function getCapStatusAction(
    caseId: string,
    date: string,
): Promise<CapStatus | null> {
    const session = await auth();
    if (!session?.user) return null;

    try {
        return await getCapStatus(caseId, date);
    } catch {
        return null;
    }
}

// ============================================================================
// Mutations
// ============================================================================

type CreateResult = {
    success: boolean;
    id?: string;
    error?: string;
    capWarning?: string;
    capStatus?: CapStatus;
};

export async function createTimeEntry(data: z.input<typeof createTimeEntrySchema>): Promise<CreateResult> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = createTimeEntrySchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    try {
        // ── Cap Enforcement ──
        let capWarning: string | undefined;
        let projectedCap: CapStatus | undefined;

        if (parsed.data.isBillable !== false && parsed.data.date) {
            const currentCap = await getCapStatus(parsed.data.caseId, parsed.data.date);
            if (!currentCap.isUncapped) {
                projectedCap = simulateEntry(currentCap, parsed.data.durationMinutes);

                if (projectedCap.threshold === "soft_block" || projectedCap.threshold === "hard_block") {
                    if (!parsed.data.capOverrideReason) {
                        return {
                            success: false,
                            error: projectedCap.threshold === "hard_block"
                                ? "Cap excedido (>110%). Justificativa obrigatoria."
                                : "Cap atingido (100%). Informe justificativa para continuar.",
                            capStatus: projectedCap,
                        };
                    }
                } else if (projectedCap.threshold === "warning") {
                    capWarning = `Cap a ${Math.round(projectedCap.percentage)}% (${Math.round(projectedCap.usedMinutes / 60)}h / ${Math.round(projectedCap.capMinutes / 60)}h)`;
                }
            }
        }

        // ── Insert ──
        const [row] = await db.insert(timeEntries).values({
            userId: session.user.id,
            caseId: parsed.data.caseId,
            taskId: parsed.data.taskId ?? null,
            activityType: parsed.data.activityType,
            description: parsed.data.description,
            durationMinutes: parsed.data.durationMinutes,
            date: parsed.data.date,
            isBillable: parsed.data.isBillable ?? true,
            approvalStatus: "rascunho",
        }).returning({ id: timeEntries.id });

        // ── Audit log for cap override ──
        if (parsed.data.capOverrideReason && projectedCap) {
            await db.insert(auditLogs).values({
                userId: session.user.id,
                action: "cap_override",
                entityType: "time_entry",
                entityId: row.id,
                newData: {
                    reason: parsed.data.capOverrideReason,
                    threshold: projectedCap.threshold,
                    percentage: Math.round(projectedCap.percentage),
                    capMinutes: projectedCap.capMinutes,
                    usedMinutes: projectedCap.usedMinutes,
                },
            });
        }

        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "time_entry_created",
            entityType: "time_entry",
            entityId: row.id,
            newData: { caseId: parsed.data.caseId, durationMinutes: parsed.data.durationMinutes, activityType: parsed.data.activityType },
        });

        return { success: true, id: row.id, capWarning, capStatus: projectedCap };
    } catch (err) {
        console.error("[createTimeEntry]", err);
        return { success: false, error: "Erro ao criar apontamento" };
    }
}

// ── Submit: rascunho → pendente ──

export async function submitTimeEntry(
    id: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        const [entry] = await db
            .select({ status: timeEntries.approvalStatus, preInvoiceId: timeEntries.preInvoiceId })
            .from(timeEntries)
            .where(eq(timeEntries.id, id))
            .limit(1);

        if (!entry) return { success: false, error: "Apontamento nao encontrado" };

        const current = (entry.status ?? "rascunho") as TimeEntryApprovalStatus;
        if (!isValidTimeEntryTransition(current, "pendente")) {
            return { success: false, error: `Nao e possivel submeter a partir do status "${current}"` };
        }

        await db.update(timeEntries).set({
            approvalStatus: "pendente",
            submittedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(timeEntries.id, id));

        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "time_entry_submitted",
            entityType: "time_entry",
            entityId: id,
        });

        return { success: true };
    } catch (err) {
        console.error("[submitTimeEntry]", err);
        return { success: false, error: "Erro ao submeter apontamento" };
    }
}

// ── Retract: pendente → rascunho ──

export async function retractTimeEntry(
    id: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        const [entry] = await db
            .select({ status: timeEntries.approvalStatus })
            .from(timeEntries)
            .where(eq(timeEntries.id, id))
            .limit(1);

        if (!entry) return { success: false, error: "Apontamento nao encontrado" };

        const current = (entry.status ?? "rascunho") as TimeEntryApprovalStatus;
        if (!isValidTimeEntryTransition(current, "rascunho")) {
            return { success: false, error: `Nao e possivel retratar a partir do status "${current}"` };
        }

        await db.update(timeEntries).set({
            approvalStatus: "rascunho",
            submittedAt: null,
            updatedAt: new Date(),
        }).where(eq(timeEntries.id, id));

        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "time_entry_retracted",
            entityType: "time_entry",
            entityId: id,
        });

        return { success: true };
    } catch (err) {
        console.error("[retractTimeEntry]", err);
        return { success: false, error: "Erro ao retratar apontamento" };
    }
}

// ── Update entry data (with auto-reset) ──

export async function updateTimeEntry(
    id: string,
    data: z.input<typeof updateTimeEntryDataSchema>,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = updateTimeEntryDataSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    try {
        const [entry] = await db
            .select({
                status: timeEntries.approvalStatus,
                preInvoiceId: timeEntries.preInvoiceId,
            })
            .from(timeEntries)
            .where(eq(timeEntries.id, id))
            .limit(1);

        if (!entry) return { success: false, error: "Apontamento nao encontrado" };

        // Lock guard
        if (entry.preInvoiceId) {
            return { success: false, error: "Apontamento vinculado a pre-fatura nao pode ser editado" };
        }

        const current = (entry.status ?? "rascunho") as TimeEntryApprovalStatus;

        if (current === "faturado") {
            return { success: false, error: "Apontamento faturado nao pode ser editado" };
        }
        if (current === "pendente") {
            return { success: false, error: "Retrate o apontamento antes de editar" };
        }

        // Build updates
        const updates: Partial<typeof timeEntries.$inferInsert> = { updatedAt: new Date() };
        if (parsed.data.activityType !== undefined) updates.activityType = parsed.data.activityType;
        if (parsed.data.description !== undefined) updates.description = parsed.data.description;
        if (parsed.data.durationMinutes !== undefined) updates.durationMinutes = parsed.data.durationMinutes;
        if (parsed.data.date !== undefined) updates.date = parsed.data.date;
        if (parsed.data.isBillable !== undefined) updates.isBillable = parsed.data.isBillable;

        // Auto-reset status
        if (current === "aprovado") {
            updates.approvalStatus = "pendente"; // requires re-approval
        } else if (current === "rejeitado") {
            updates.approvalStatus = "rascunho";
            updates.rejectionComment = null;
        }

        await db.update(timeEntries).set(updates).where(eq(timeEntries.id, id));
        return { success: true };
    } catch (err) {
        console.error("[updateTimeEntry]", err);
        return { success: false, error: "Erro ao atualizar apontamento" };
    }
}

// ── Delete entry ──

export async function deleteTimeEntry(
    id: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        const [entry] = await db
            .select({
                status: timeEntries.approvalStatus,
                preInvoiceId: timeEntries.preInvoiceId,
            })
            .from(timeEntries)
            .where(eq(timeEntries.id, id))
            .limit(1);

        if (!entry) return { success: false, error: "Apontamento nao encontrado" };

        if (entry.preInvoiceId) {
            return { success: false, error: "Apontamento vinculado a pre-fatura nao pode ser excluido" };
        }

        const current = (entry.status ?? "rascunho") as TimeEntryApprovalStatus;
        if (current !== "rascunho" && current !== "rejeitado") {
            return { success: false, error: `Apontamento com status "${current}" nao pode ser excluido` };
        }

        await db.delete(timeEntries).where(eq(timeEntries.id, id));

        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "time_entry_deleted",
            entityType: "time_entry",
            entityId: id,
        });

        return { success: true };
    } catch (err) {
        console.error("[deleteTimeEntry]", err);
        return { success: false, error: "Erro ao excluir apontamento" };
    }
}

// ── Update status (approve/reject by socio) with transition validation ──

export async function updateTimeEntryStatus(
    id: string,
    newStatus: string,
    comment?: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        const [entry] = await db
            .select({
                status: timeEntries.approvalStatus,
                preInvoiceId: timeEntries.preInvoiceId,
            })
            .from(timeEntries)
            .where(eq(timeEntries.id, id))
            .limit(1);

        if (!entry) return { success: false, error: "Apontamento nao encontrado" };

        if (entry.preInvoiceId) {
            return { success: false, error: "Apontamento vinculado a pre-fatura nao pode ser alterado" };
        }

        const current = (entry.status ?? "rascunho") as TimeEntryApprovalStatus;
        const next = newStatus as TimeEntryApprovalStatus;

        if (!isValidTimeEntryTransition(current, next)) {
            return { success: false, error: `Transicao invalida: ${current} → ${next}` };
        }

        const updates: Partial<typeof timeEntries.$inferInsert> = {
            approvalStatus: newStatus,
            updatedAt: new Date(),
        };

        if (newStatus === "aprovado") {
            updates.approvedBy = session.user.id;
            updates.approvedAt = new Date();
        }
        if (newStatus === "rejeitado" && comment) {
            updates.rejectionComment = comment;
        }

        await db.update(timeEntries).set(updates).where(eq(timeEntries.id, id));

        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "time_entry_status_updated",
            entityType: "time_entry",
            entityId: id,
            newData: { from: current, to: newStatus, comment },
        });

        return { success: true };
    } catch (err) {
        console.error("[updateTimeEntryStatus]", err);
        return { success: false, error: "Erro ao atualizar status" };
    }
}
