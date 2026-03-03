"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cases, clients, users } from "@/lib/db/schema";
import { formatDateBR } from "@/lib/db/format";
import { eq, ilike, inArray, sql } from "drizzle-orm";
import { MOCK_CASES, type MockCase } from "@/lib/mock-data";

const casesFilterSchema = z.object({
    search: z.string().max(200).optional(),
    area: z.array(z.string().max(50)).optional(),
    status: z.array(z.string().max(50)).optional(),
}).optional();

const createCaseSchema = z.object({
    clientId: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    caseNumber: z.string().max(50).optional(),
    area: z.string().max(100).optional(),
    responsibleId: z.string().uuid().optional(),
    proposalId: z.string().uuid().optional(),
});

// ============================================================================
// Mapper
// ============================================================================

const STATUS_MAP: Record<string, string> = {
    active: "Ativo",
    paused: "Em Pausa",
    closed: "Encerrado",
};

function toMockCase(
    row: typeof cases.$inferSelect,
    clientName: string,
    responsibleName: string,
): MockCase {
    return {
        id: row.id,
        number: row.caseNumber ?? "",
        client: clientName,
        title: row.title,
        area: row.area ?? "",
        responsible: responsibleName,
        status: (STATUS_MAP[row.status ?? "active"] ?? "Ativo") as MockCase["status"],
        startDate: formatDateBR(row.startedAt),
    };
}

// ============================================================================
// Queries
// ============================================================================

export async function getCases(filters?: z.input<typeof casesFilterSchema>): Promise<MockCase[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = casesFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    try {
        const rows = await db
            .select({
                case_: cases,
                clientName: clients.companyName,
                responsibleName: users.name,
            })
            .from(cases)
            .leftJoin(clients, eq(cases.clientId, clients.id))
            .leftJoin(users, eq(cases.responsibleId, users.id))
            .orderBy(cases.createdAt);

        let results = rows.map((r) =>
            toMockCase(r.case_, r.clientName ?? "", r.responsibleName ?? ""),
        );

        if (f?.search) {
            const q = f.search.toLowerCase();
            results = results.filter(
                (c) =>
                    c.title.toLowerCase().includes(q) ||
                    c.client.toLowerCase().includes(q),
            );
        }
        if (f?.area?.length) {
            results = results.filter((c) => f.area!.includes(c.area));
        }
        if (f?.status?.length) {
            results = results.filter((c) => f.status!.includes(c.status));
        }

        return results;
    } catch {
        let results = [...MOCK_CASES];
        if (f?.search) {
            const q = f.search.toLowerCase();
            results = results.filter(
                (c) =>
                    c.title.toLowerCase().includes(q) ||
                    c.client.toLowerCase().includes(q),
            );
        }
        if (f?.area?.length) {
            results = results.filter((c) => f.area!.includes(c.area));
        }
        if (f?.status?.length) {
            results = results.filter((c) => f.status!.includes(c.status));
        }
        return results;
    }
}

export async function getCaseById(id: string): Promise<MockCase | null> {
    const session = await auth();
    if (!session?.user) return null;

    const parsed = z.string().max(100).safeParse(id);
    if (!parsed.success) return null;

    try {
        const rows = await db
            .select({
                case_: cases,
                clientName: clients.companyName,
                responsibleName: users.name,
            })
            .from(cases)
            .leftJoin(clients, eq(cases.clientId, clients.id))
            .leftJoin(users, eq(cases.responsibleId, users.id))
            .where(eq(cases.id, parsed.data))
            .limit(1);

        return rows.length > 0
            ? toMockCase(rows[0].case_, rows[0].clientName ?? "", rows[0].responsibleName ?? "")
            : null;
    } catch {
        return MOCK_CASES.find((c) => c.id === parsed.data) ?? null;
    }
}

// ============================================================================
// Mutations
// ============================================================================

export async function createCase(data: z.input<typeof createCaseSchema>): Promise<{ success: boolean; id?: string; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = createCaseSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    try {
        const [row] = await db.insert(cases).values({
            clientId: parsed.data.clientId,
            title: parsed.data.title,
            description: parsed.data.description,
            caseNumber: parsed.data.caseNumber,
            area: parsed.data.area,
            responsibleId: parsed.data.responsibleId ?? session.user.id,
            proposalId: parsed.data.proposalId,
            startedAt: new Date().toISOString().split("T")[0],
        }).returning({ id: cases.id });
        return { success: true, id: row.id };
    } catch (err) {
        console.error("[createCase]", err);
        return { success: false, error: "Erro ao criar caso" };
    }
}

export async function updateCase(
    id: string,
    data: { status?: string; title?: string; area?: string },
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        await db.update(cases).set(data).where(eq(cases.id, id));
        return { success: true };
    } catch (err) {
        console.error("[updateCase]", err);
        return { success: false, error: "Erro ao atualizar caso" };
    }
}
