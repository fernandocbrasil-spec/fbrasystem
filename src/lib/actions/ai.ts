"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { meetings, auditLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAIAdapter, type MeetingSummaryResult } from "@/lib/integrations/ai";

// ============================================================================
// Types
// ============================================================================

export type SummarizeMeetingResult = {
    success: boolean;
    data?: MeetingSummaryResult;
    error?: string;
};

export type CaseMeeting = {
    id: string;
    title: string;
    date: string;
    hasTranscript: boolean;
    hasSummary: boolean;
    summary?: string;
    participants: string[];
};

// ============================================================================
// Get meetings for a case
// ============================================================================

export async function getCaseMeetings(caseId: string): Promise<CaseMeeting[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = z.string().uuid().safeParse(caseId);
    if (!parsed.success) return [];

    try {
        const rows = await db
            .select()
            .from(meetings)
            .where(eq(meetings.caseId, parsed.data))
            .orderBy(meetings.date);

        return rows.map((m) => ({
            id: m.id,
            title: m.title ?? "Reuniao",
            date: m.date?.toISOString().split("T")[0] ?? "",
            hasTranscript: !!m.transcript,
            hasSummary: !!m.aiSummary,
            summary: m.aiSummary ?? undefined,
            participants: Array.isArray(m.participants) ? (m.participants as string[]) : [],
        }));
    } catch {
        return [];
    }
}

// ============================================================================
// Summarize a meeting
// ============================================================================

export async function summarizeMeeting(meetingId: string): Promise<SummarizeMeetingResult> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = z.string().uuid().safeParse(meetingId);
    if (!parsed.success) return { success: false, error: "ID invalido" };

    try {
        // Load meeting
        const [meeting] = await db
            .select()
            .from(meetings)
            .where(eq(meetings.id, parsed.data))
            .limit(1);

        if (!meeting) return { success: false, error: "Reuniao nao encontrada" };

        // Idempotency: if already summarized, parse and return existing
        if (meeting.aiSummary) {
            const brief = meeting.aiBrief as MeetingSummaryResult | null;
            if (brief) {
                return { success: true, data: brief };
            }
        }

        // Need transcript (or use title as fallback for stub)
        const transcript = meeting.transcript ?? meeting.title ?? "Sem transcricao";
        const participants = Array.isArray(meeting.participants) ? (meeting.participants as string[]) : [];

        const adapter = getAIAdapter();
        const result = await adapter.summarizeMeeting({
            meetingId: parsed.data,
            title: meeting.title ?? "Reuniao",
            transcript,
            participants,
        });

        // Persist summary
        await db.update(meetings).set({
            aiSummary: result.summary,
            aiBrief: result as unknown as Record<string, unknown>,
        }).where(eq(meetings.id, parsed.data));

        // Audit
        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "meeting_summarized",
            entityType: "meeting",
            entityId: parsed.data,
            newData: { title: meeting.title },
        });

        return { success: true, data: result };
    } catch (err) {
        console.error("[summarizeMeeting]", err);
        return { success: false, error: "Erro ao resumir reuniao" };
    }
}
