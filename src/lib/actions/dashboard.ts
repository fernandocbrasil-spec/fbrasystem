"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
    accountsPayable,
    arTitles,
    timeEntries,
    proposals,
    preInvoices,
    clients,
    cases,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { formatCurrency, formatDateBR, formatTimestampBR } from "@/lib/db/format";
import {
    MOCK_PENDING_APPROVALS,
    MOCK_NOTIFICATIONS,
    MOCK_EVENTS,
    type MockPendingApproval,
    type MockNotification,
    type MockEvent,
} from "@/lib/mock-data";

// ============================================================================
// Dashboard data — queries real DB, falls back to mock
// ============================================================================

export async function getPendingApprovals(): Promise<MockPendingApproval[]> {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const items: MockPendingApproval[] = [];

        // 1. Pending payables
        const pendingPayables = await db
            .select()
            .from(accountsPayable)
            .where(eq(accountsPayable.approvalStatus, "pendente"));

        for (const row of pendingPayables) {
            items.push({
                id: `ap-${row.id}`,
                entityType: "payable",
                label: row.supplierName,
                client: row.category ?? "Despesa",
                value: formatCurrency(row.value),
                date: formatDateBR(row.dueDate),
            });
        }

        // 2. AR titles with pending actions (desconto_solicitado, baixa_solicitada)
        const pendingAR = await db
            .select({ ar: arTitles, clientName: clients.companyName })
            .from(arTitles)
            .leftJoin(clients, eq(arTitles.clientId, clients.id))
            .where(inArray(arTitles.approvalStatus, ["desconto_solicitado", "baixa_solicitada"]));

        for (const row of pendingAR) {
            const action = row.ar.requestedAction === "desconto" ? "Desconto" : "Baixa";
            items.push({
                id: `ar-${row.ar.id}`,
                entityType: "receivable",
                label: `${action} — ${row.clientName ?? ""}`,
                client: row.clientName ?? "",
                value: formatCurrency(row.ar.value),
                date: formatDateBR(row.ar.dueDate),
            });
        }

        // 3. Pending time entries
        const pendingTE = await db
            .select({ te: timeEntries, caseTitle: cases.title, clientName: clients.companyName })
            .from(timeEntries)
            .leftJoin(cases, eq(timeEntries.caseId, cases.id))
            .leftJoin(clients, eq(cases.clientId, clients.id))
            .where(eq(timeEntries.approvalStatus, "pendente"));

        for (const row of pendingTE) {
            const hours = Math.floor((row.te.durationMinutes ?? 0) / 60);
            const mins = (row.te.durationMinutes ?? 0) % 60;
            items.push({
                id: `te-${row.te.id}`,
                entityType: "time_entry",
                label: `${row.te.description ?? row.te.activityType ?? "Horas"} (${hours}h${mins > 0 ? String(mins).padStart(2, "0") : ""})`,
                client: row.clientName ?? "",
                value: `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`,
                date: formatDateBR(row.te.date),
            });
        }

        // 4. Draft proposals (pending review)
        const pendingProposals = await db
            .select({ p: proposals, clientName: clients.companyName })
            .from(proposals)
            .leftJoin(clients, eq(proposals.clientId, clients.id))
            .where(eq(proposals.status, "draft"));

        for (const row of pendingProposals) {
            const content = (row.p.content ?? {}) as Record<string, unknown>;
            items.push({
                id: `prop-${row.p.id}`,
                entityType: "proposal",
                label: (content.title as string) ?? "Proposta",
                client: row.clientName ?? "",
                value: formatCurrency(row.p.totalValue),
                date: row.p.createdAt ? formatTimestampBR(row.p.createdAt) : "",
            });
        }

        // 5. Pending pre-invoices
        const pendingPI = await db
            .select({ pi: preInvoices, clientName: clients.companyName })
            .from(preInvoices)
            .leftJoin(clients, eq(preInvoices.clientId, clients.id))
            .where(eq(preInvoices.status, "pending"));

        for (const row of pendingPI) {
            items.push({
                id: `pf-${row.pi.id}`,
                entityType: "pre_invoice",
                label: `Pre-Fatura ${row.pi.referencePeriod ?? ""}`,
                client: row.clientName ?? "",
                value: formatCurrency(row.pi.totalValue),
                date: row.pi.createdAt ? formatTimestampBR(row.pi.createdAt) : "",
            });
        }

        return items;
    } catch {
        return [...MOCK_PENDING_APPROVALS];
    }
}

export async function getNotifications(): Promise<MockNotification[]> {
    const session = await auth();
    if (!session?.user) return [];
    // No notifications table in schema — return mock
    return [...MOCK_NOTIFICATIONS];
}

export async function getEvents(): Promise<MockEvent[]> {
    const session = await auth();
    if (!session?.user) return [];
    // No events/calendar table in schema — return mock
    return [...MOCK_EVENTS];
}
