"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
    preInvoices,
    clients,
    cases,
    billingPlans,
    timeEntries,
    invoices,
    auditLogs,
} from "@/lib/db/schema";
import { formatCurrency } from "@/lib/db/format";
import { eq, and, sql, inArray } from "drizzle-orm";
import { MOCK_INVOICES, type MockInvoice } from "@/lib/mock-data";
import type { PreInvoiceStatus } from "@/lib/approval/types";
import { isValidPreInvoiceTransition } from "@/lib/approval/types";

// ============================================================================
// Schemas
// ============================================================================

const generatePreInvoiceSchema = z.object({
    caseId: z.string().uuid(),
    period: z.string().regex(/^\d{4}-\d{2}$/),
});

// ============================================================================
// Mapper
// ============================================================================

const STATUS_MAP: Record<string, MockInvoice["status"]> = {
    draft: "Rascunho",
    pending: "Pendente Aprovacao",
    review: "Pendente Aprovacao",
    approved: "Aprovado",
    rejected: "Rejeitado",
    invoiced: "Faturado",
    cancelled: "Cancelado",
};

function toMockInvoice(
    row: typeof preInvoices.$inferSelect,
    clientName: string,
    caseName: string,
    billingType: string,
    nfseNumber?: string | null,
    nfsePdfUrl?: string | null,
): MockInvoice {
    return {
        id: row.id,
        month: row.referencePeriod ?? "",
        client: clientName,
        caseName,
        value: formatCurrency(row.totalValue),
        status: STATUS_MAP[row.status ?? "draft"] ?? "Rascunho",
        type: billingType,
        nfseNumber: nfseNumber ?? undefined,
        nfsePdfUrl: nfsePdfUrl ?? undefined,
    };
}

// ============================================================================
// Queries
// ============================================================================

export async function getInvoices(): Promise<MockInvoice[]> {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const rows = await db
            .select({
                preInvoice: preInvoices,
                clientName: clients.companyName,
                caseTitle: cases.title,
                billingType: billingPlans.type,
                nfseNumber: invoices.nfseNumber,
                nfsePdfUrl: invoices.nfsePdfUrl,
            })
            .from(preInvoices)
            .leftJoin(clients, eq(preInvoices.clientId, clients.id))
            .leftJoin(cases, eq(preInvoices.caseId, cases.id))
            .leftJoin(billingPlans, eq(preInvoices.billingPlanId, billingPlans.id))
            .leftJoin(invoices, eq(invoices.preInvoiceId, preInvoices.id))
            .orderBy(preInvoices.createdAt);

        return rows.map((r) => {
            const typeLabel = r.billingType === "mensal_fixo" ? "Fixo Mensal"
                : r.billingType === "hora_trabalhada" ? "Hora Trabalhada"
                : r.billingType === "exito" ? "Exito"
                : r.billingType === "hibrido" ? "Hibrido"
                : "Fixo Mensal";
            return toMockInvoice(r.preInvoice, r.clientName ?? "", r.caseTitle ?? "", typeLabel, r.nfseNumber, r.nfsePdfUrl);
        });
    } catch {
        return [...MOCK_INVOICES];
    }
}

// ============================================================================
// Pre-Invoice Generation
// ============================================================================

type GenerateResult = {
    success: boolean;
    id?: string;
    totalValue?: string;
    entryCount?: number;
    error?: string;
};

export async function generatePreInvoice(
    data: z.input<typeof generatePreInvoiceSchema>,
): Promise<GenerateResult> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = generatePreInvoiceSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    const { caseId, period } = parsed.data;

    try {
        // ── Duplicate Guard ──
        const existing = await db
            .select({ id: preInvoices.id })
            .from(preInvoices)
            .where(
                and(
                    eq(preInvoices.caseId, caseId),
                    eq(preInvoices.referencePeriod, period),
                    sql`${preInvoices.status} NOT IN ('cancelled', 'rejected')`,
                ),
            )
            .limit(1);

        if (existing.length > 0) {
            return { success: false, error: "Pre-fatura ja existe para este caso/periodo." };
        }

        // ── Load Billing Plan ──
        const [plan] = await db
            .select()
            .from(billingPlans)
            .where(and(eq(billingPlans.caseId, caseId), eq(billingPlans.isActive, true)))
            .limit(1);

        if (!plan) {
            return { success: false, error: "Nenhum plano de faturamento ativo para este caso." };
        }

        // ── Load Eligible Time Entries ──
        const periodStart = `${period}-01`;
        const [y, m] = period.split("-").map(Number);
        const nextMonth = m === 12 ? 1 : m + 1;
        const nextYear = m === 12 ? y + 1 : y;
        const periodEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

        const eligibleEntries = await db
            .select()
            .from(timeEntries)
            .where(
                and(
                    eq(timeEntries.caseId, caseId),
                    eq(timeEntries.isBillable, true),
                    eq(timeEntries.approvalStatus, "aprovado"),
                    sql`${timeEntries.preInvoiceId} IS NULL`,
                    sql`${timeEntries.date} >= ${periodStart}`,
                    sql`${timeEntries.date} < ${periodEnd}`,
                ),
            );

        if (eligibleEntries.length === 0) {
            return { success: false, error: "Nenhum apontamento aprovado e faturavel para este periodo." };
        }

        // ── Calculate Values ──
        const totalBillableMinutes = eligibleEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
        let baseValue = 0;
        const lineItems: Record<string, unknown>[] = [];

        if (plan.type === "mensal_fixo" || plan.type === "fixed") {
            baseValue = parseFloat(plan.monthlyValue ?? "0");
            lineItems.push({
                type: "fixed_fee",
                description: `Honorarios Mensais ${period}`,
                value: baseValue,
            });

            // Check for excess hours
            if (plan.monthlyHoursIncluded && plan.excessRate) {
                const capMinutes = plan.monthlyHoursIncluded * 60;
                if (totalBillableMinutes > capMinutes) {
                    const excessMinutes = totalBillableMinutes - capMinutes;
                    const excessHours = excessMinutes / 60;
                    const excessRate = parseFloat(plan.excessRate);
                    const excessValue = excessHours * excessRate;
                    lineItems.push({
                        type: "excess_hours",
                        description: `Horas excedentes (${excessHours.toFixed(1)}h x R$ ${excessRate.toFixed(2)})`,
                        value: excessValue,
                        details: { minutes: excessMinutes, rate: excessRate },
                    });
                    baseValue += excessValue;
                }
            }
        } else if (plan.type === "hora_trabalhada" || plan.type === "hourly") {
            for (const entry of eligibleEntries) {
                const rate = parseFloat(entry.hourlyRate ?? plan.hourlyRate ?? "0");
                const hours = entry.durationMinutes / 60;
                const value = hours * rate;
                lineItems.push({
                    type: "hourly",
                    timeEntryId: entry.id,
                    description: entry.description,
                    durationMinutes: entry.durationMinutes,
                    hourlyRate: rate,
                    value,
                });
                baseValue += value;
            }
        } else {
            return { success: false, error: "Planos de exito requerem geracao manual." };
        }

        // ── Tax ──
        const taxRate = parseFloat(plan.taxRate ?? "14.53");
        const taxValue = baseValue * (taxRate / 100);
        const totalValue = baseValue + taxValue;

        // ── Insert Pre-Invoice ──
        const [newPreInvoice] = await db.insert(preInvoices).values({
            caseId,
            clientId: plan.clientId,
            billingPlanId: plan.id,
            referencePeriod: period,
            baseValue: baseValue.toFixed(2),
            taxValue: taxValue.toFixed(2),
            totalValue: totalValue.toFixed(2),
            status: "draft",
            lineItems,
        }).returning({ id: preInvoices.id });

        // ── Lock Time Entries ──
        const entryIds = eligibleEntries.map((e) => e.id);
        const updateResult = await db
            .update(timeEntries)
            .set({
                preInvoiceId: newPreInvoice.id,
                approvalStatus: "faturado",
                updatedAt: new Date(),
            })
            .where(
                and(
                    inArray(timeEntries.id, entryIds),
                    sql`${timeEntries.preInvoiceId} IS NULL`,
                ),
            );

        // Idempotency check — verify expected rows were updated
        const updatedCount = (updateResult as unknown as { rowCount?: number })?.rowCount ?? entryIds.length;
        if (updatedCount < entryIds.length) {
            // Some entries were already claimed — but pre-invoice was created.
            // Log the discrepancy but don't fail (entries that were already locked won't be double-counted).
            console.warn(`[generatePreInvoice] Expected ${entryIds.length} entries, updated ${updatedCount}`);
        }

        // ── Audit Log ──
        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "pre_invoice_generated",
            entityType: "pre_invoice",
            entityId: newPreInvoice.id,
            newData: {
                caseId,
                period,
                totalValue: totalValue.toFixed(2),
                entryCount: eligibleEntries.length,
                billingType: plan.type,
            },
        });

        return {
            success: true,
            id: newPreInvoice.id,
            totalValue: formatCurrency(totalValue.toFixed(2)),
            entryCount: eligibleEntries.length,
        };
    } catch (err) {
        console.error("[generatePreInvoice]", err);
        return { success: false, error: "Erro ao gerar pre-fatura" };
    }
}

// ============================================================================
// Pre-Invoice Lifecycle Actions
// ============================================================================

export async function submitPreInvoice(
    id: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        const [pi] = await db
            .select({ status: preInvoices.status })
            .from(preInvoices)
            .where(eq(preInvoices.id, id))
            .limit(1);

        if (!pi) return { success: false, error: "Pre-fatura nao encontrada" };

        const current = (pi.status ?? "draft") as PreInvoiceStatus;
        if (!isValidPreInvoiceTransition(current, "pending")) {
            return { success: false, error: `Nao e possivel submeter a partir do status "${current}"` };
        }

        await db.update(preInvoices).set({
            status: "pending",
            updatedAt: new Date(),
        }).where(eq(preInvoices.id, id));

        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "pre_invoice_submitted",
            entityType: "pre_invoice",
            entityId: id,
        });

        return { success: true };
    } catch (err) {
        console.error("[submitPreInvoice]", err);
        return { success: false, error: "Erro ao submeter pre-fatura" };
    }
}

export async function approvePreInvoice(
    id: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        const [pi] = await db
            .select({ status: preInvoices.status })
            .from(preInvoices)
            .where(eq(preInvoices.id, id))
            .limit(1);

        if (!pi) return { success: false, error: "Pre-fatura nao encontrada" };

        const current = (pi.status ?? "draft") as PreInvoiceStatus;
        if (!isValidPreInvoiceTransition(current, "approved")) {
            return { success: false, error: `Nao e possivel aprovar a partir do status "${current}"` };
        }

        await db.update(preInvoices).set({
            status: "approved",
            approvedBy: session.user.id,
            approvedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(preInvoices.id, id));

        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "pre_invoice_approved",
            entityType: "pre_invoice",
            entityId: id,
        });

        return { success: true };
    } catch (err) {
        console.error("[approvePreInvoice]", err);
        return { success: false, error: "Erro ao aprovar pre-fatura" };
    }
}

export async function rejectPreInvoice(
    id: string,
    comment: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    if (!comment?.trim()) return { success: false, error: "Motivo da rejeicao e obrigatorio" };

    try {
        const [pi] = await db
            .select({ status: preInvoices.status })
            .from(preInvoices)
            .where(eq(preInvoices.id, id))
            .limit(1);

        if (!pi) return { success: false, error: "Pre-fatura nao encontrada" };

        const current = (pi.status ?? "draft") as PreInvoiceStatus;
        if (!isValidPreInvoiceTransition(current, "rejected")) {
            return { success: false, error: `Nao e possivel rejeitar a partir do status "${current}"` };
        }

        // Update pre-invoice status
        await db.update(preInvoices).set({
            status: "rejected",
            notes: comment,
            updatedAt: new Date(),
        }).where(eq(preInvoices.id, id));

        // Unlock time entries — set back to aprovado, clear preInvoiceId
        await db.update(timeEntries).set({
            preInvoiceId: null,
            approvalStatus: "aprovado",
            updatedAt: new Date(),
        }).where(eq(timeEntries.preInvoiceId, id));

        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "pre_invoice_rejected",
            entityType: "pre_invoice",
            entityId: id,
            newData: { comment },
        });

        return { success: true };
    } catch (err) {
        console.error("[rejectPreInvoice]", err);
        return { success: false, error: "Erro ao rejeitar pre-fatura" };
    }
}

export async function cancelPreInvoice(
    id: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        const [pi] = await db
            .select({ status: preInvoices.status })
            .from(preInvoices)
            .where(eq(preInvoices.id, id))
            .limit(1);

        if (!pi) return { success: false, error: "Pre-fatura nao encontrada" };

        const current = (pi.status ?? "draft") as PreInvoiceStatus;
        if (current === "invoiced") {
            return { success: false, error: "Pre-fatura ja faturada nao pode ser cancelada" };
        }
        if (current === "cancelled") {
            return { success: false, error: "Pre-fatura ja cancelada" };
        }

        // Update pre-invoice status
        await db.update(preInvoices).set({
            status: "cancelled",
            updatedAt: new Date(),
        }).where(eq(preInvoices.id, id));

        // Unlock time entries
        await db.update(timeEntries).set({
            preInvoiceId: null,
            approvalStatus: "aprovado",
            updatedAt: new Date(),
        }).where(eq(timeEntries.preInvoiceId, id));

        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "pre_invoice_cancelled",
            entityType: "pre_invoice",
            entityId: id,
        });

        return { success: true };
    } catch (err) {
        console.error("[cancelPreInvoice]", err);
        return { success: false, error: "Erro ao cancelar pre-fatura" };
    }
}
