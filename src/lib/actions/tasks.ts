"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tasks, timeEntries, users } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type TaskItem = {
    id: string;
    caseId: string;
    title: string;
    description: string;
    status: "todo" | "in_progress" | "done" | "blocked";
    priority: "low" | "medium" | "high" | "urgent";
    assigneeId: string | null;
    assigneeName: string | null;
    assigneeInitials: string | null;
    dueDate: string | null;
    position: number;
    completedAt: string | null;
};

// ============================================================================
// Schemas
// ============================================================================

const createTaskSchema = z.object({
    caseId: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    assigneeId: z.string().uuid().optional(),
    dueDate: z.string().optional(),
});

const updateTaskSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    dueDate: z.string().nullable().optional(),
});

// ============================================================================
// Fallback mock data
// ============================================================================

const FALLBACK_TASKS: TaskItem[] = [
    { id: "t-1", caseId: "", title: "Revisao documentos IRPJ Marco", description: "", status: "todo", priority: "high", assigneeId: null, assigneeName: null, assigneeInitials: null, dueDate: "2026-03-05", position: 0, completedAt: null },
    { id: "t-2", caseId: "", title: "Agendar call checkpoint mensal", description: "", status: "todo", priority: "low", assigneeId: null, assigneeName: null, assigneeInitials: null, dueDate: null, position: 1, completedAt: null },
    { id: "t-3", caseId: "", title: "Elaboracao planilhas Intercompany", description: "", status: "in_progress", priority: "medium", assigneeId: null, assigneeName: "Carlos Oliveira", assigneeInitials: "CO", dueDate: null, position: 2, completedAt: null },
];

// ============================================================================
// Mapper
// ============================================================================

function toTaskItem(
    row: typeof tasks.$inferSelect,
    assigneeName?: string | null,
): TaskItem {
    const initials = assigneeName
        ? assigneeName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
        : null;

    return {
        id: row.id,
        caseId: row.caseId,
        title: row.title,
        description: row.description ?? "",
        status: (row.status ?? "todo") as TaskItem["status"],
        priority: (row.priority ?? "medium") as TaskItem["priority"],
        assigneeId: row.assigneeId,
        assigneeName: assigneeName ?? null,
        assigneeInitials: initials,
        dueDate: row.due_date,
        position: row.position ?? 0,
        completedAt: row.completedAt ? row.completedAt.toISOString().split("T")[0] : null,
    };
}

// ============================================================================
// Queries
// ============================================================================

export async function getTasksForCase(caseId: string): Promise<TaskItem[]> {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const rows = await db
            .select({
                task: tasks,
                assigneeName: users.name,
            })
            .from(tasks)
            .leftJoin(users, eq(tasks.assigneeId, users.id))
            .where(eq(tasks.caseId, caseId))
            .orderBy(asc(tasks.position));

        return rows.map((r) => toTaskItem(r.task, r.assigneeName));
    } catch {
        return FALLBACK_TASKS.map((t) => ({ ...t, caseId }));
    }
}

// ============================================================================
// Mutations
// ============================================================================

export async function createTask(
    data: z.input<typeof createTaskSchema>,
): Promise<{ success: boolean; id?: string; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = createTaskSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    try {
        // Get max position for the case
        const maxPos = await db
            .select({ pos: tasks.position })
            .from(tasks)
            .where(eq(tasks.caseId, parsed.data.caseId))
            .orderBy(tasks.position)
            .limit(1);

        const nextPos = (maxPos[0]?.pos ?? -1) + 1;

        const [row] = await db.insert(tasks).values({
            caseId: parsed.data.caseId,
            title: parsed.data.title,
            description: parsed.data.description ?? null,
            priority: parsed.data.priority,
            assigneeId: parsed.data.assigneeId ?? null,
            due_date: parsed.data.dueDate ?? null,
            status: "todo",
            position: nextPos,
        }).returning({ id: tasks.id });

        return { success: true, id: row.id };
    } catch (err) {
        console.error("[createTask]", err);
        return { success: false, error: "Erro ao criar tarefa" };
    }
}

export async function updateTask(
    id: string,
    data: z.input<typeof updateTaskSchema>,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = updateTaskSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    try {
        const updates: Partial<typeof tasks.$inferInsert> = {};
        if (parsed.data.title !== undefined) updates.title = parsed.data.title;
        if (parsed.data.description !== undefined) updates.description = parsed.data.description;
        if (parsed.data.priority !== undefined) updates.priority = parsed.data.priority;
        if (parsed.data.assigneeId !== undefined) updates.assigneeId = parsed.data.assigneeId;
        if (parsed.data.dueDate !== undefined) updates.due_date = parsed.data.dueDate;
        updates.updatedAt = new Date();

        await db.update(tasks).set(updates).where(eq(tasks.id, id));
        return { success: true };
    } catch (err) {
        console.error("[updateTask]", err);
        return { success: false, error: "Erro ao atualizar tarefa" };
    }
}

export async function updateTaskStatus(
    id: string,
    newStatus: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const validStatuses = ["todo", "in_progress", "done", "blocked"];
    if (!validStatuses.includes(newStatus)) {
        return { success: false, error: "Status invalido" };
    }

    try {
        // ── COMPLETION GUARD ──
        if (newStatus === "done") {
            const approvedEntries = await db
                .select({ id: timeEntries.id })
                .from(timeEntries)
                .where(
                    and(
                        eq(timeEntries.taskId, id),
                        eq(timeEntries.approvalStatus, "aprovado"),
                    ),
                )
                .limit(1);

            if (approvedEntries.length === 0) {
                return {
                    success: false,
                    error: "Tarefa precisa ter pelo menos um apontamento de horas aprovado para ser concluida.",
                };
            }
        }

        const updates: Partial<typeof tasks.$inferInsert> = {
            status: newStatus,
            updatedAt: new Date(),
        };

        if (newStatus === "done") {
            updates.completedAt = new Date();
        } else {
            updates.completedAt = null;
        }

        await db.update(tasks).set(updates).where(eq(tasks.id, id));
        return { success: true };
    } catch (err) {
        console.error("[updateTaskStatus]", err);
        return { success: false, error: "Erro ao atualizar status da tarefa" };
    }
}

export async function deleteTask(
    id: string,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        // Don't allow deleting completed tasks
        const [existing] = await db
            .select({ status: tasks.status })
            .from(tasks)
            .where(eq(tasks.id, id))
            .limit(1);

        if (existing?.status === "done") {
            return { success: false, error: "Tarefa concluida nao pode ser excluida" };
        }

        await db.delete(tasks).where(eq(tasks.id, id));
        return { success: true };
    } catch (err) {
        console.error("[deleteTask]", err);
        return { success: false, error: "Erro ao excluir tarefa" };
    }
}

export async function reorderTasks(
    caseId: string,
    orderedIds: string[],
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        const updates = orderedIds.map((taskId, index) =>
            db.update(tasks).set({ position: index }).where(
                and(eq(tasks.id, taskId), eq(tasks.caseId, caseId)),
            ),
        );
        await Promise.all(updates);
        return { success: true };
    } catch (err) {
        console.error("[reorderTasks]", err);
        return { success: false, error: "Erro ao reordenar tarefas" };
    }
}
