"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getGDriveAdapter } from "@/lib/integrations/gdrive";
import type { GDriveFile } from "@/lib/integrations/gdrive";

// ============================================================================
// Types
// ============================================================================

export type CaseDriveInfo = {
    folderId: string | null;
    folderUrl: string | null;
};

// ============================================================================
// Queries
// ============================================================================

export async function getCaseDriveInfo(caseId: string): Promise<CaseDriveInfo> {
    const session = await auth();
    if (!session?.user) return { folderId: null, folderUrl: null };

    const parsed = z.string().uuid().safeParse(caseId);
    if (!parsed.success) return { folderId: null, folderUrl: null };

    try {
        const [row] = await db
            .select({
                driveFolderId: cases.driveFolderId,
                driveFolderUrl: cases.driveFolderUrl,
            })
            .from(cases)
            .where(eq(cases.id, parsed.data))
            .limit(1);

        return {
            folderId: row?.driveFolderId ?? null,
            folderUrl: row?.driveFolderUrl ?? null,
        };
    } catch {
        return { folderId: null, folderUrl: null };
    }
}

export async function listCaseFiles(caseId: string): Promise<GDriveFile[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = z.string().uuid().safeParse(caseId);
    if (!parsed.success) return [];

    try {
        const info = await getCaseDriveInfo(parsed.data);
        if (!info.folderId) return [];

        const adapter = getGDriveAdapter();
        return adapter.listCaseFiles(info.folderId);
    } catch (err) {
        console.error("[listCaseFiles]", err);
        return [];
    }
}

// ============================================================================
// Mutations
// ============================================================================

export async function createOrGetCaseFolder(
    caseId: string,
): Promise<{ success: boolean; folderId?: string; folderUrl?: string; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = z.string().uuid().safeParse(caseId);
    if (!parsed.success) return { success: false, error: "ID invalido" };

    try {
        // Check if folder already exists
        const info = await getCaseDriveInfo(parsed.data);
        if (info.folderId && info.folderUrl) {
            return { success: true, folderId: info.folderId, folderUrl: info.folderUrl };
        }

        // Get case title for folder name
        const [caseRow] = await db
            .select({ title: cases.title, caseNumber: cases.caseNumber })
            .from(cases)
            .where(eq(cases.id, parsed.data))
            .limit(1);

        if (!caseRow) return { success: false, error: "Caso nao encontrado" };

        const folderName = `${caseRow.caseNumber ?? "CASO"} — ${caseRow.title}`;

        // Create via adapter
        const adapter = getGDriveAdapter();
        const folder = await adapter.createCaseFolder(parsed.data, folderName);

        // Persist to case record
        await db.update(cases).set({
            driveFolderId: folder.id,
            driveFolderUrl: folder.webViewLink,
        }).where(eq(cases.id, parsed.data));

        return { success: true, folderId: folder.id, folderUrl: folder.webViewLink };
    } catch (err) {
        console.error("[createOrGetCaseFolder]", err);
        return { success: false, error: "Erro ao criar pasta no Drive" };
    }
}
