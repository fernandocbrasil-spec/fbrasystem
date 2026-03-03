"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { leads, users } from "@/lib/db/schema";
import { formatDateBR } from "@/lib/db/format";
import { eq, ilike, inArray, sql } from "drizzle-orm";
import { MOCK_LEADS, type MockLead } from "@/lib/mock-data";

const leadsFilterSchema = z.object({
    search: z.string().max(200).optional(),
    temperature: z.array(z.string().max(50)).optional(),
    stage: z.array(z.string().max(50)).optional(),
}).optional();

const createLeadSchema = z.object({
    contactName: z.string().min(1).max(255),
    companyName: z.string().max(255).optional(),
    contactEmail: z.string().max(255).optional(),
    contactPhone: z.string().max(50).optional(),
    temperature: z.string().max(20).optional(),
    status: z.string().max(50).optional(),
    notes: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Mapper
// ============================================================================

function toMockLead(
    row: typeof leads.$inferSelect,
): MockLead {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
        id: row.id,
        companyName: row.companyName ?? undefined,
        contactName: row.contactName,
        temperature: (row.temperature ?? "morno") as MockLead["temperature"],
        value: (meta.valor as string) ?? undefined,
        stage: (row.status ?? "novo") as MockLead["stage"],
        date: formatDateBR(row.createdAt?.toISOString().split("T")[0] ?? null),
    };
}

// ============================================================================
// Queries
// ============================================================================

export async function getLeads(filters?: z.input<typeof leadsFilterSchema>): Promise<MockLead[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = leadsFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    try {
        const conditions = [];

        if (f?.search) {
            conditions.push(
                sql`(${ilike(leads.contactName, `%${f.search}%`)} OR ${ilike(leads.companyName, `%${f.search}%`)})`,
            );
        }
        if (f?.temperature?.length) {
            conditions.push(inArray(leads.temperature, f.temperature));
        }
        if (f?.stage?.length) {
            conditions.push(inArray(leads.status, f.stage));
        }

        const rows = await db
            .select()
            .from(leads)
            .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
            .orderBy(leads.createdAt);

        return rows.map(toMockLead);
    } catch {
        // Fallback to mock
        let results = [...MOCK_LEADS];
        if (f?.search) {
            const q = f.search.toLowerCase();
            results = results.filter(
                (l) =>
                    l.contactName.toLowerCase().includes(q) ||
                    (l.companyName ?? "").toLowerCase().includes(q),
            );
        }
        if (f?.temperature?.length) {
            results = results.filter((l) => f.temperature!.includes(l.temperature));
        }
        if (f?.stage?.length) {
            results = results.filter((l) => f.stage!.includes(l.stage));
        }
        return results;
    }
}

export async function getLeadById(id: string): Promise<MockLead | null> {
    const session = await auth();
    if (!session?.user) return null;

    const parsed = z.string().max(100).safeParse(id);
    if (!parsed.success) return null;

    try {
        const rows = await db.select().from(leads).where(eq(leads.id, parsed.data)).limit(1);
        return rows.length > 0 ? toMockLead(rows[0]) : null;
    } catch {
        return MOCK_LEADS.find((l) => l.id === parsed.data) ?? null;
    }
}

// ============================================================================
// Mutations
// ============================================================================

export async function createLead(data: z.input<typeof createLeadSchema>): Promise<{ success: boolean; id?: string; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = createLeadSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    try {
        const [row] = await db.insert(leads).values({
            contactName: parsed.data.contactName,
            companyName: parsed.data.companyName,
            contactEmail: parsed.data.contactEmail,
            contactPhone: parsed.data.contactPhone,
            temperature: parsed.data.temperature ?? "morno",
            status: parsed.data.status ?? "novo",
            notes: parsed.data.notes,
            metadata: parsed.data.metadata ?? {},
            responsibleId: session.user.id,
        }).returning({ id: leads.id });
        return { success: true, id: row.id };
    } catch (err) {
        console.error("[createLead]", err);
        return { success: false, error: "Erro ao criar lead" };
    }
}

export async function updateLead(
    id: string,
    data: Partial<z.input<typeof createLeadSchema>>,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        const updates: Partial<typeof leads.$inferInsert> = {};
        if (data.contactName) updates.contactName = data.contactName;
        if (data.companyName !== undefined) updates.companyName = data.companyName;
        if (data.temperature) updates.temperature = data.temperature;
        if (data.status) updates.status = data.status;
        if (data.notes !== undefined) updates.notes = data.notes;
        if (data.metadata) updates.metadata = data.metadata;

        await db.update(leads).set(updates).where(eq(leads.id, id));
        return { success: true };
    } catch (err) {
        console.error("[updateLead]", err);
        return { success: false, error: "Erro ao atualizar lead" };
    }
}

export async function deleteLead(id: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        await db.delete(leads).where(eq(leads.id, id));
        return { success: true };
    } catch (err) {
        console.error("[deleteLead]", err);
        return { success: false, error: "Erro ao deletar lead" };
    }
}

// ============================================================================
// Board-specific types (matching leads/page.tsx Monday-style UI)
// ============================================================================

export type BoardLeadStatus = "em_andamento" | "feito" | "parado" | "nao_iniciado";
export type BoardLeadPriority = "critico" | "alta" | "media" | "baixa" | "";
export type BoardLeadStage = "prospeccao" | "qualificacao" | "proposta" | "negociacao" | "ganho" | "perdido";

export type BoardLead = {
    id: string;
    name: string;
    responsible: string;
    status: BoardLeadStatus;
    deadline: string;
    priority: BoardLeadPriority;
    notes: string;
    value: string;
    files: number;
    timeline: { start: string; end: string } | null;
    updatedAt: string;
    updatedBy: string;
    stage: BoardLeadStage;
    followUpDate: string;
};

// ============================================================================
// Follow-up Governance — SLA rules per stage
// ============================================================================

/** Max days without any interaction (updatedAt) before lead is considered stale */
export const STAGE_SLA_DAYS: Record<BoardLeadStage, number> = {
    prospeccao: 3,
    qualificacao: 5,
    proposta: 7,
    negociacao: 3,
    ganho: 999,   // closed — no SLA
    perdido: 999, // closed — no SLA
};

/** Max days a lead can exist without a followUpDate set */
export const STAGE_MAX_NO_FOLLOWUP: Record<BoardLeadStage, number> = {
    prospeccao: 1,
    qualificacao: 2,
    proposta: 3,
    negociacao: 1,
    ganho: 999,
    perdido: 999,
};

export type FollowUpUrgency = "overdue" | "today" | "this_week" | "no_date" | "stale" | "ok";

export type FollowUpItem = BoardLead & {
    urgency: FollowUpUrgency;
    daysSinceUpdate: number;
    slaDays: number;
    daysOverdue: number;
};

export type FollowUpDigest = {
    overdue: number;
    today: number;
    thisWeek: number;
    noDate: number;
    stale: number;
    total: number;
};

// Zod schema for validated metadata keys
const leadMetadataSchema = z.object({
    displayName: z.string().optional(),
    boardStatus: z.enum(["em_andamento", "feito", "parado", "nao_iniciado"]).optional(),
    priority: z.enum(["critico", "alta", "media", "baixa", ""]).optional(),
    deadline: z.string().optional(),
    valor: z.string().optional(),
    files: z.number().optional(),
    timeline: z.object({ start: z.string(), end: z.string() }).nullable().optional(),
    updatedBy: z.string().optional(),
}).passthrough();

export type LeadMetadata = z.infer<typeof leadMetadataSchema>;

/** Validate metadata before writing — strips unknown keys, returns clean object */
export function validateLeadMetadata(raw: Record<string, unknown>): LeadMetadata {
    const result = leadMetadataSchema.safeParse(raw);
    return result.success ? result.data : (raw as LeadMetadata);
}

// ============================================================================
// Board mapper — DB row → BoardLead
// ============================================================================

const DB_STATUS_TO_STAGE: Record<string, BoardLeadStage> = {
    novo: "prospeccao",
    contato_feito: "qualificacao",
    proposta_enviada: "proposta",
    negociacao: "negociacao",
    ganho: "ganho",
    perdido: "perdido",
    // Accept stage values directly (used by new entries)
    prospeccao: "prospeccao",
    qualificacao: "qualificacao",
    proposta: "proposta",
};

function toBoardLead(
    row: typeof leads.$inferSelect,
    responsibleName: string,
): BoardLead {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const company = row.companyName ?? "";
    const contact = row.contactName ?? "";

    return {
        id: row.id,
        name: (meta.displayName as string) ??
            (company ? `${company} — ${contact}` : contact),
        responsible: responsibleName,
        status: ((meta.boardStatus as string) ?? "nao_iniciado") as BoardLeadStatus,
        deadline: (meta.deadline as string) ?? "",
        priority: ((meta.priority as string) ?? "") as BoardLeadPriority,
        notes: row.notes ?? "",
        value: (meta.valor as string) ?? "",
        files: (meta.files as number) ?? 0,
        timeline: (meta.timeline as { start: string; end: string }) ?? null,
        updatedAt: row.updatedAt?.toISOString() ?? "",
        updatedBy: (meta.updatedBy as string) ?? "",
        stage: DB_STATUS_TO_STAGE[row.status ?? "novo"] ?? "prospeccao",
        followUpDate: row.followUpDate ?? "",
    };
}

// Fallback data when DB is not available
const FALLBACK_BOARD_LEADS: BoardLead[] = [
    { id: "fb-1", name: "TechCorp BR — Assessoria Tributaria", responsible: "Jose Rafael", status: "em_andamento", deadline: "2026-03-01", priority: "baixa", notes: "Elementos de acao", value: "R$ 45.000", files: 1, timeline: { start: "2026-03-01", end: "2026-03-02" }, updatedAt: "2026-03-02T10:26:00", updatedBy: "Fernando Brasil", stage: "prospeccao", followUpDate: "2026-03-04" },
    { id: "fb-2", name: "Grupo Sequoia — Planejamento Fiscal", responsible: "Carlos Oliveira", status: "feito", deadline: "2026-03-02", priority: "alta", notes: "Notas de reuniao", value: "R$ 11.150", files: 0, timeline: { start: "2026-03-03", end: "2026-03-04" }, updatedAt: "2026-03-02T10:26:00", updatedBy: "Fernando Brasil", stage: "prospeccao", followUpDate: "2026-03-05" },
    { id: "fb-3", name: "Logistica ABC — Contencioso", responsible: "Ana Souza", status: "parado", deadline: "2026-03-03", priority: "media", notes: "Outro", value: "R$ 8.500", files: 0, timeline: { start: "2026-03-05", end: "2026-03-06" }, updatedAt: "2026-03-02T10:26:00", updatedBy: "Fernando Brasil", stage: "prospeccao", followUpDate: "" },
    { id: "fb-4", name: "Construtora Ipe — Compliance", responsible: "Fernando Brasil", status: "nao_iniciado", deadline: "2026-03-05", priority: "critico", notes: "Urgente", value: "R$ 22.000", files: 2, timeline: { start: "2026-03-01", end: "2026-03-10" }, updatedAt: "2026-03-01T15:00:00", updatedBy: "Jose Rafael", stage: "qualificacao", followUpDate: "2026-03-02" },
    { id: "fb-5", name: "Farmacia Vida — Societario", responsible: "Jose Rafael", status: "em_andamento", deadline: "2026-03-08", priority: "media", notes: "Aguardando docs", value: "R$ 6.200", files: 1, timeline: { start: "2026-03-06", end: "2026-03-12" }, updatedAt: "2026-03-01T09:00:00", updatedBy: "Ana Souza", stage: "qualificacao", followUpDate: "2026-03-06" },
    { id: "fb-6", name: "Rede Plus — Trabalhista", responsible: "Carlos Oliveira", status: "feito", deadline: "2026-02-28", priority: "alta", notes: "Proposta enviada", value: "R$ 15.000", files: 3, timeline: { start: "2026-02-20", end: "2026-03-01" }, updatedAt: "2026-02-28T14:00:00", updatedBy: "Carlos Oliveira", stage: "proposta", followUpDate: "2026-03-01" },
    { id: "fb-7", name: "Auto Pecas JR — Tributario", responsible: "Ana Souza", status: "em_andamento", deadline: "2026-03-10", priority: "baixa", notes: "Follow-up", value: "R$ 3.800", files: 0, timeline: { start: "2026-03-08", end: "2026-03-15" }, updatedAt: "2026-03-02T08:00:00", updatedBy: "Fernando Brasil", stage: "proposta", followUpDate: "2026-03-10" },
    { id: "fb-8", name: "Hotel Atlantico — Consultivo", responsible: "Fernando Brasil", status: "em_andamento", deadline: "2026-03-12", priority: "alta", notes: "Negociacao de valores", value: "R$ 32.000", files: 1, timeline: { start: "2026-03-05", end: "2026-03-15" }, updatedAt: "2026-03-02T11:30:00", updatedBy: "Jose Rafael", stage: "negociacao", followUpDate: "2026-03-03" },
    { id: "fb-9", name: "Clinica Saude Total — Fiscal", responsible: "Jose Rafael", status: "feito", deadline: "2026-02-25", priority: "media", notes: "Contrato assinado", value: "R$ 18.500", files: 4, timeline: { start: "2026-02-15", end: "2026-02-28" }, updatedAt: "2026-02-25T16:00:00", updatedBy: "Jose Rafael", stage: "ganho", followUpDate: "" },
    { id: "fb-10", name: "Padaria Estrela — Contabil", responsible: "Carlos Oliveira", status: "parado", deadline: "2026-02-20", priority: "baixa", notes: "Sem retorno", value: "R$ 2.100", files: 0, timeline: null, updatedAt: "2026-02-20T10:00:00", updatedBy: "Carlos Oliveira", stage: "perdido", followUpDate: "" },
];

// ============================================================================
// Board queries
// ============================================================================

export async function getLeadsForBoard(): Promise<BoardLead[]> {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const rows = await db
            .select({
                lead: leads,
                responsibleName: users.name,
            })
            .from(leads)
            .leftJoin(users, eq(leads.responsibleId, users.id))
            .orderBy(leads.createdAt);

        return rows.map((r) => toBoardLead(r.lead, r.responsibleName ?? ""));
    } catch {
        return [...FALLBACK_BOARD_LEADS];
    }
}

// ============================================================================
// Board mutations
// ============================================================================

const boardLeadCreateSchema = z.object({
    name: z.string().min(1).max(500),
    responsible: z.string().max(255),
    status: z.string().max(50),
    stage: z.string().max(50),
    deadline: z.string().max(50).optional(),
    priority: z.string().max(50).optional(),
    notes: z.string().optional(),
    value: z.string().max(100).optional(),
});

export async function createLeadFromBoard(
    data: z.input<typeof boardLeadCreateSchema>,
): Promise<{ success: boolean; id?: string; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = boardLeadCreateSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    try {
        // Resolve responsible name → user ID
        let responsibleId: string | undefined;
        if (parsed.data.responsible) {
            const [user] = await db
                .select({ id: users.id })
                .from(users)
                .where(ilike(users.name, `%${parsed.data.responsible}%`))
                .limit(1);
            responsibleId = user?.id;
        }

        // Parse display name into company + contact
        const parts = parsed.data.name.split(" — ");
        const companyName = parts.length > 1 ? parts[0] : undefined;
        const contactName = parts.length > 1 ? parts[1] : parsed.data.name;

        const [row] = await db.insert(leads).values({
            companyName,
            contactName,
            status: parsed.data.stage,
            responsibleId,
            notes: parsed.data.notes,
            metadata: validateLeadMetadata({
                displayName: parsed.data.name,
                boardStatus: parsed.data.status,
                priority: parsed.data.priority ?? "",
                deadline: parsed.data.deadline ?? "",
                valor: parsed.data.value ?? "",
                files: 0,
                timeline: null,
                updatedBy: session.user.name ?? "Voce",
            }),
        }).returning({ id: leads.id });

        return { success: true, id: row.id };
    } catch (err) {
        console.error("[createLeadFromBoard]", err);
        return { success: false, error: "Erro ao criar lead" };
    }
}

export async function updateLeadFromBoard(
    id: string,
    patch: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) return { success: false, error: "ID invalido" };

    try {
        // Get existing row for metadata merge
        const [existing] = await db.select().from(leads).where(eq(leads.id, parsedId.data)).limit(1);
        if (!existing) return { success: false, error: "Lead nao encontrado" };

        const existingMeta = (existing.metadata ?? {}) as Record<string, unknown>;
        const updates: Partial<typeof leads.$inferInsert> = {};

        // Map board fields → DB columns
        if (patch.stage !== undefined) {
            updates.status = patch.stage as string;
        }
        if (patch.notes !== undefined) {
            updates.notes = patch.notes as string;
        }
        if (patch.followUpDate !== undefined) {
            updates.followUpDate = (patch.followUpDate as string) || null;
        }
        if (patch.responsible !== undefined) {
            const name = patch.responsible as string;
            if (name) {
                const [user] = await db
                    .select({ id: users.id })
                    .from(users)
                    .where(ilike(users.name, `%${name}%`))
                    .limit(1);
                if (user) updates.responsibleId = user.id;
            } else {
                updates.responsibleId = null;
            }
        }
        if (patch.name !== undefined) {
            const parts = (patch.name as string).split(" — ");
            if (parts.length > 1) {
                updates.companyName = parts[0];
                updates.contactName = parts[1];
            } else {
                updates.contactName = patch.name as string;
            }
        }

        // Merge metadata
        const newMeta = { ...existingMeta };
        if (patch.name !== undefined) newMeta.displayName = patch.name;
        if (patch.status !== undefined) newMeta.boardStatus = patch.status;
        if (patch.priority !== undefined) newMeta.priority = patch.priority;
        if (patch.deadline !== undefined) newMeta.deadline = patch.deadline;
        if (patch.value !== undefined) newMeta.valor = patch.value;
        if (patch.files !== undefined) newMeta.files = patch.files;
        if (patch.timeline !== undefined) newMeta.timeline = patch.timeline;
        if (patch.updatedBy !== undefined) newMeta.updatedBy = patch.updatedBy;
        updates.metadata = validateLeadMetadata(newMeta);

        await db.update(leads).set(updates).where(eq(leads.id, parsedId.data));
        return { success: true };
    } catch (err) {
        console.error("[updateLeadFromBoard]", err);
        return { success: false, error: "Erro ao atualizar lead" };
    }
}

export async function deleteLeadFromBoard(id: string): Promise<{ success: boolean; error?: string }> {
    return deleteLead(id);
}

// ============================================================================
// Follow-up Governance — Inbox + Digest
// ============================================================================

function classifyFollowUp(lead: BoardLead, now: Date): FollowUpItem {
    const stage = lead.stage;
    const sla = STAGE_SLA_DAYS[stage] ?? 7;
    const updatedMs = lead.updatedAt ? new Date(lead.updatedAt).getTime() : 0;
    const daysSinceUpdate = updatedMs ? Math.floor((now.getTime() - updatedMs) / 86_400_000) : 999;

    // Closed stages are always "ok"
    if (stage === "ganho" || stage === "perdido") {
        return { ...lead, urgency: "ok", daysSinceUpdate, slaDays: sla, daysOverdue: 0 };
    }

    const todayStr = now.toISOString().split("T")[0];

    // No follow-up date set
    if (!lead.followUpDate) {
        return { ...lead, urgency: "no_date", daysSinceUpdate, slaDays: sla, daysOverdue: 0 };
    }

    // Overdue: followUpDate < today
    if (lead.followUpDate < todayStr) {
        const overdueDays = Math.floor((now.getTime() - new Date(lead.followUpDate).getTime()) / 86_400_000);
        return { ...lead, urgency: "overdue", daysSinceUpdate, slaDays: sla, daysOverdue: overdueDays };
    }

    // Due today
    if (lead.followUpDate === todayStr) {
        return { ...lead, urgency: "today", daysSinceUpdate, slaDays: sla, daysOverdue: 0 };
    }

    // Due this week (next 7 days)
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split("T")[0];
    if (lead.followUpDate <= weekEndStr) {
        // Also check stale (SLA breach on updatedAt)
        if (daysSinceUpdate > sla) {
            return { ...lead, urgency: "stale", daysSinceUpdate, slaDays: sla, daysOverdue: 0 };
        }
        return { ...lead, urgency: "this_week", daysSinceUpdate, slaDays: sla, daysOverdue: 0 };
    }

    // Stale check (no interaction beyond SLA)
    if (daysSinceUpdate > sla) {
        return { ...lead, urgency: "stale", daysSinceUpdate, slaDays: sla, daysOverdue: 0 };
    }

    return { ...lead, urgency: "ok", daysSinceUpdate, slaDays: sla, daysOverdue: 0 };
}

export async function getFollowUpInbox(): Promise<FollowUpItem[]> {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const allLeads = await getLeadsForBoard();
        const now = new Date();
        return allLeads
            .map((l) => classifyFollowUp(l, now))
            .filter((item) => item.urgency !== "ok")
            .sort((a, b) => {
                const priority: Record<FollowUpUrgency, number> = { overdue: 0, today: 1, stale: 2, no_date: 3, this_week: 4, ok: 5 };
                const diff = priority[a.urgency] - priority[b.urgency];
                if (diff !== 0) return diff;
                return b.daysOverdue - a.daysOverdue;
            });
    } catch {
        return [];
    }
}

export async function getFollowUpDigest(): Promise<FollowUpDigest> {
    const session = await auth();
    if (!session?.user) return { overdue: 0, today: 0, thisWeek: 0, noDate: 0, stale: 0, total: 0 };

    try {
        const allLeads = await getLeadsForBoard();
        const now = new Date();
        const items = allLeads.map((l) => classifyFollowUp(l, now));

        const digest: FollowUpDigest = { overdue: 0, today: 0, thisWeek: 0, noDate: 0, stale: 0, total: 0 };
        for (const item of items) {
            if (item.urgency === "overdue") digest.overdue++;
            else if (item.urgency === "today") digest.today++;
            else if (item.urgency === "this_week") digest.thisWeek++;
            else if (item.urgency === "no_date") digest.noDate++;
            else if (item.urgency === "stale") digest.stale++;
        }
        digest.total = digest.overdue + digest.today + digest.thisWeek + digest.noDate + digest.stale;
        return digest;
    } catch {
        return { overdue: 0, today: 0, thisWeek: 0, noDate: 0, stale: 0, total: 0 };
    }
}
