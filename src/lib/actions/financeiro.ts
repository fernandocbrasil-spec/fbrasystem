"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { accountsPayable, arTitles, clients } from "@/lib/db/schema";
import { formatCurrency, formatDateBR, formatTimestampBR, parseCurrency, parseDateBR } from "@/lib/db/format";
import { eq, ilike, inArray, or, sql } from "drizzle-orm";
import { MOCK_RECEIVABLES, MOCK_PAYABLES, type MockReceivable, type MockPayable } from "@/lib/mock-data";
import type { PayableApprovalStatus, ReceivableApprovalStatus } from "@/lib/approval/types";

// ============================================================================
// Schemas
// ============================================================================

const receivablesFilterSchema = z.object({
    search: z.string().max(200).optional(),
    status: z.array(z.string().max(50)).optional(),
}).optional();

const payablesFilterSchema = z.object({
    search: z.string().max(200).optional(),
    categoria: z.array(z.string().max(50)).optional(),
}).optional();

const createPayableSchema = z.object({
    fornecedor: z.string().min(1).max(255),
    categoria: z.string().max(100),
    valor: z.string().min(1),
    vencimento: z.string().min(1),
});

// ============================================================================
// Mappers — DB row → Mock display type
// ============================================================================

const STATUS_MAP_AP: Record<string, string> = {
    pending: "Pendente",
    scheduled: "Agendado",
    overdue: "Atrasado",
    paid: "Pago",
};

function toMockPayable(row: typeof accountsPayable.$inferSelect): MockPayable {
    return {
        id: row.id,
        fornecedor: row.supplierName,
        categoria: row.category ?? "",
        valor: formatCurrency(row.value),
        vencimento: formatDateBR(row.dueDate),
        status: (STATUS_MAP_AP[row.status ?? "pending"] ?? "Pendente") as MockPayable["status"],
        approvalStatus: (row.approvalStatus ?? "pendente") as PayableApprovalStatus,
        submittedBy: undefined, // TODO: join with users to get name
        approvedBy: undefined,
        approvedAt: row.approvedAt ? formatTimestampBR(row.approvedAt) : undefined,
        rejectionComment: row.rejectionComment ?? undefined,
    };
}

const STATUS_MAP_AR: Record<string, string> = {
    open: "A Receber",
    paid: "Recebido",
    overdue: "A Receber",
    partial: "A Receber",
};

function toMockReceivable(
    row: typeof arTitles.$inferSelect,
    clientName: string,
): MockReceivable {
    return {
        id: row.id,
        cliente: clientName,
        descricao: row.notes ?? "",
        valor: formatCurrency(row.value),
        vencimento: formatDateBR(row.dueDate),
        status: (STATUS_MAP_AR[row.status ?? "open"] ?? "A Receber") as MockReceivable["status"],
        banco: "Itau", // default — bank info lives on bank_transactions
        approvalStatus: (row.approvalStatus ?? "pendente") as ReceivableApprovalStatus,
        requestedBy: row.requestedBy ? "Financeiro" : undefined,
        requestedAction: row.requestedAction as MockReceivable["requestedAction"],
        approvedBy: undefined,
        approvedAt: row.approvedAt ? formatTimestampBR(row.approvedAt) : undefined,
        rejectionComment: row.rejectionComment ?? undefined,
    };
}

// ============================================================================
// Queries
// ============================================================================

export async function getPayables(filters?: z.input<typeof payablesFilterSchema>): Promise<MockPayable[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = payablesFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    try {
        const conditions = [];

        if (f?.search) {
            conditions.push(ilike(accountsPayable.supplierName, `%${f.search}%`));
        }
        if (f?.categoria?.length) {
            conditions.push(inArray(accountsPayable.category, f.categoria));
        }

        const rows = await db
            .select()
            .from(accountsPayable)
            .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
            .orderBy(accountsPayable.dueDate);

        return rows.map(toMockPayable);
    } catch {
        // Fallback to mock if DB not available
        let results = [...MOCK_PAYABLES];
        if (f?.search) {
            const q = f.search.toLowerCase();
            results = results.filter((d) => d.fornecedor.toLowerCase().includes(q));
        }
        if (f?.categoria?.length) {
            results = results.filter((d) => f.categoria!.includes(d.categoria));
        }
        return results;
    }
}

export async function getReceivables(filters?: z.input<typeof receivablesFilterSchema>): Promise<MockReceivable[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = receivablesFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    try {
        const rows = await db
            .select({
                arTitle: arTitles,
                clientName: clients.companyName,
            })
            .from(arTitles)
            .leftJoin(clients, eq(arTitles.clientId, clients.id))
            .orderBy(arTitles.dueDate);

        let results = rows.map((r) => toMockReceivable(r.arTitle, r.clientName ?? ""));

        if (f?.search) {
            const q = f.search.toLowerCase();
            results = results.filter(
                (r) =>
                    r.cliente.toLowerCase().includes(q) ||
                    r.descricao.toLowerCase().includes(q),
            );
        }
        if (f?.status?.length) {
            results = results.filter((r) => f.status!.includes(r.status));
        }

        return results;
    } catch {
        // Fallback to mock
        let results = [...MOCK_RECEIVABLES];
        if (f?.search) {
            const q = f.search.toLowerCase();
            results = results.filter(
                (r) =>
                    r.cliente.toLowerCase().includes(q) ||
                    r.descricao.toLowerCase().includes(q),
            );
        }
        if (f?.status?.length) {
            results = results.filter((r) => f.status!.includes(r.status));
        }
        return results;
    }
}

// ============================================================================
// Mutations
// ============================================================================

export async function createPayable(data: z.input<typeof createPayableSchema>): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = createPayableSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    try {
        await db.insert(accountsPayable).values({
            supplierName: parsed.data.fornecedor,
            category: parsed.data.categoria,
            value: parseCurrency(parsed.data.valor),
            dueDate: parseDateBR(parsed.data.vencimento),
            status: "pending",
            approvalStatus: "pendente",
            submittedBy: session.user.id,
        });
        return { success: true };
    } catch (err) {
        console.error("[createPayable]", err);
        return { success: false, error: "Erro ao criar conta a pagar" };
    }
}

export async function updatePayableStatus(
    id: string,
    status: string,
    approvalStatus?: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        const updates: Partial<typeof accountsPayable.$inferInsert> = {};
        if (status) updates.status = status;
        if (approvalStatus) {
            updates.approvalStatus = approvalStatus;
            if (approvalStatus === "aprovado") {
                updates.approvedBy = session.user.id;
                updates.approvedAt = new Date();
            }
        }

        await db.update(accountsPayable).set(updates).where(eq(accountsPayable.id, id));
        return { success: true };
    } catch (err) {
        console.error("[updatePayableStatus]", err);
        return { success: false, error: "Erro ao atualizar status" };
    }
}

export async function deletePayable(id: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        await db.delete(accountsPayable).where(eq(accountsPayable.id, id));
        return { success: true };
    } catch (err) {
        console.error("[deletePayable]", err);
        return { success: false, error: "Erro ao deletar" };
    }
}
