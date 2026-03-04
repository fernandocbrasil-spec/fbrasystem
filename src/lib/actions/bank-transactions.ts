"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bankTransactions, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MOCK_BANK_ENTRIES, type MockBankEntry } from "@/lib/mock-data";

// ============================================================================
// Mapper
// ============================================================================

function toMockBankEntry(row: typeof bankTransactions.$inferSelect): MockBankEntry {
    return {
        id: row.id,
        date: row.date,
        description: row.description ?? "",
        value: parseFloat(row.value),
        balance: 0, // computed client-side from running total
        reconciled: row.isReconciled ?? false,
    };
}

// ============================================================================
// Queries
// ============================================================================

export async function getBankEntries(): Promise<MockBankEntry[]> {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const rows = await db
            .select()
            .from(bankTransactions)
            .orderBy(bankTransactions.date);

        const entries = rows.map(toMockBankEntry);

        // Compute running balance
        let balance = 0;
        for (const entry of entries) {
            balance += entry.value;
            entry.balance = balance;
        }

        return entries;
    } catch {
        return [...MOCK_BANK_ENTRIES];
    }
}

// ============================================================================
// Mutations
// ============================================================================

export async function reconcileBankEntry(id: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    try {
        await db.update(bankTransactions).set({ isReconciled: true }).where(eq(bankTransactions.id, id));

        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "bank_entry_reconciled",
            entityType: "bank_transaction",
            entityId: id,
        });

        return { success: true };
    } catch (err) {
        console.error("[reconcileBankEntry]", err);
        return { success: false, error: "Erro ao conciliar lancamento" };
    }
}
