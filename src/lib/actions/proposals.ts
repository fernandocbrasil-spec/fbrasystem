"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { proposals, clients, leads } from "@/lib/db/schema";
import { formatCurrency, formatDateBR } from "@/lib/db/format";
import { eq } from "drizzle-orm";
import { MOCK_PROPOSALS, type MockProposal } from "@/lib/mock-data";

const proposalsFilterSchema = z.object({
    search: z.string().max(200).optional(),
    status: z.array(z.string().max(50)).optional(),
}).optional();

const createProposalSchema = z.object({
    title: z.string().min(1).max(255),
    clientId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    content: z.record(z.string(), z.unknown()),
    totalValue: z.string().optional(),
    billingType: z.string().max(50).optional(),
});

// ============================================================================
// Mapper
// ============================================================================

const STATUS_MAP: Record<string, string> = {
    draft: "Em Revisao",
    sent: "Em Revisao",
    approved: "Aprovada",
    rejected: "Rejeitada",
};

function toMockProposal(
    row: typeof proposals.$inferSelect,
    clientName: string,
): MockProposal {
    const content = row.content as Record<string, unknown>;
    return {
        id: row.id,
        title: (content.title as string) ?? "Sem titulo",
        client: clientName,
        status: (STATUS_MAP[row.status ?? "draft"] ?? "Em Revisao") as MockProposal["status"],
        date: formatDateBR(row.createdAt?.toISOString().split("T")[0] ?? null),
        value: formatCurrency(row.totalValue),
    };
}

// ============================================================================
// Queries
// ============================================================================

export async function getProposals(filters?: z.input<typeof proposalsFilterSchema>): Promise<MockProposal[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = proposalsFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    try {
        const rows = await db
            .select({
                proposal: proposals,
                clientName: clients.companyName,
            })
            .from(proposals)
            .leftJoin(clients, eq(proposals.clientId, clients.id))
            .orderBy(proposals.createdAt);

        let results = rows.map((r) =>
            toMockProposal(r.proposal, r.clientName ?? ""),
        );

        if (f?.search) {
            const q = f.search.toLowerCase();
            results = results.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.client.toLowerCase().includes(q),
            );
        }
        if (f?.status?.length) {
            results = results.filter((p) => f.status!.includes(p.status));
        }

        return results;
    } catch {
        let results = [...MOCK_PROPOSALS];
        if (f?.search) {
            const q = f.search.toLowerCase();
            results = results.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.client.toLowerCase().includes(q),
            );
        }
        if (f?.status?.length) {
            results = results.filter((p) => f.status!.includes(p.status));
        }
        return results;
    }
}

export async function getProposalById(id: string): Promise<MockProposal | null> {
    const session = await auth();
    if (!session?.user) return null;

    const parsed = z.string().max(100).safeParse(id);
    if (!parsed.success) return null;

    try {
        const rows = await db
            .select({
                proposal: proposals,
                clientName: clients.companyName,
            })
            .from(proposals)
            .leftJoin(clients, eq(proposals.clientId, clients.id))
            .where(eq(proposals.id, parsed.data))
            .limit(1);

        return rows.length > 0
            ? toMockProposal(rows[0].proposal, rows[0].clientName ?? "")
            : null;
    } catch {
        return MOCK_PROPOSALS.find((p) => p.id === parsed.data) ?? null;
    }
}

// ============================================================================
// Mutations
// ============================================================================

export async function createProposal(data: z.input<typeof createProposalSchema>): Promise<{ success: boolean; id?: string; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = createProposalSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    try {
        const [row] = await db.insert(proposals).values({
            leadId: parsed.data.leadId,
            clientId: parsed.data.clientId,
            content: parsed.data.content,
            totalValue: parsed.data.totalValue,
            billingType: parsed.data.billingType,
            createdBy: session.user.id,
        }).returning({ id: proposals.id });
        return { success: true, id: row.id };
    } catch (err) {
        console.error("[createProposal]", err);
        return { success: false, error: "Erro ao criar proposta" };
    }
}

export async function updateProposal(
    id: string,
    data: { status?: string; content?: Record<string, unknown>; totalValue?: string },
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        await db.update(proposals).set(data).where(eq(proposals.id, id));
        return { success: true };
    } catch (err) {
        console.error("[updateProposal]", err);
        return { success: false, error: "Erro ao atualizar proposta" };
    }
}
