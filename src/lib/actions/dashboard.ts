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
    auditLogs,
    meetings,
} from "@/lib/db/schema";
import { eq, inArray, sql, and, gte } from "drizzle-orm";
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

// ============================================================================
// Notifications — derived from recent audit logs + state-based warnings
// ============================================================================

export async function getNotifications(): Promise<MockNotification[]> {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const items: MockNotification[] = [];
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. Recent audit log entries → success/info notifications
        const recentLogs = await db
            .select()
            .from(auditLogs)
            .where(gte(auditLogs.createdAt, sevenDaysAgo))
            .orderBy(sql`${auditLogs.createdAt} DESC`)
            .limit(10);

        const actionLabels: Record<string, { tipo: MockNotification["tipo"]; msg: string }> = {
            nfse_emitted: { tipo: "success", msg: "NFS-e emitida com sucesso" },
            pre_invoice_generated: { tipo: "info", msg: "Pre-fatura gerada" },
            pre_invoice_approved: { tipo: "success", msg: "Pre-fatura aprovada" },
            pre_invoice_rejected: { tipo: "warning", msg: "Pre-fatura rejeitada" },
            pre_invoice_cancelled: { tipo: "info", msg: "Pre-fatura cancelada" },
        };

        for (const log of recentLogs) {
            const def = actionLabels[log.action];
            if (!def) continue;
            const newData = (log.newData ?? {}) as Record<string, unknown>;
            const detail = (newData.nfseNumber as string) ?? (newData.period as string) ?? "";
            const hora = log.createdAt ? formatTimestampBR(log.createdAt) : "";
            items.push({
                id: `log-${log.id}`,
                tipo: def.tipo,
                mensagem: detail ? `${def.msg} — ${detail}` : def.msg,
                hora,
            });
        }

        // 2. Stale draft proposals (>3 days old) → warning
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const staleProposals = await db
            .select({ p: proposals, clientName: clients.companyName })
            .from(proposals)
            .leftJoin(clients, eq(proposals.clientId, clients.id))
            .where(
                and(
                    eq(proposals.status, "draft"),
                    sql`${proposals.createdAt} < ${threeDaysAgo}`,
                ),
            )
            .limit(3);

        for (const row of staleProposals) {
            const content = (row.p.content ?? {}) as Record<string, unknown>;
            const title = (content.title as string) ?? row.clientName ?? "Proposta";
            const daysOld = Math.floor((now.getTime() - (row.p.createdAt?.getTime() ?? now.getTime())) / (24 * 60 * 60 * 1000));
            items.push({
                id: `stale-prop-${row.p.id}`,
                tipo: "warning",
                mensagem: `Proposta '${title}' aguardando aprovacao ha ${daysOld} dias`,
                hora: row.p.createdAt ? formatTimestampBR(row.p.createdAt) : "",
            });
        }

        // 3. Overdue AP → warning
        const overdueAP = await db
            .select()
            .from(accountsPayable)
            .where(
                and(
                    inArray(accountsPayable.status, ["pending", "open"]),
                    sql`${accountsPayable.dueDate} < ${now.toISOString().split("T")[0]}`,
                ),
            )
            .limit(3);

        for (const row of overdueAP) {
            items.push({
                id: `overdue-ap-${row.id}`,
                tipo: "warning",
                mensagem: `Conta a pagar vencida: ${row.supplierName} — ${formatCurrency(row.value)}`,
                hora: formatDateBR(row.dueDate),
            });
        }

        // If no real notifications found, return fallback
        if (items.length === 0) {
            return [...MOCK_NOTIFICATIONS];
        }

        return items.slice(0, 8);
    } catch {
        return [...MOCK_NOTIFICATIONS];
    }
}

// ============================================================================
// Events — derived from meetings + upcoming AP/AR due dates
// ============================================================================

export async function getEvents(): Promise<MockEvent[]> {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const items: MockEvent[] = [];
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const todayStr = now.toISOString().split("T")[0];
        const futureStr = thirtyDaysFromNow.toISOString().split("T")[0];

        // 1. Upcoming meetings
        const upcomingMeetings = await db
            .select()
            .from(meetings)
            .where(
                and(
                    gte(meetings.date, now),
                    sql`${meetings.date} <= ${thirtyDaysFromNow}`,
                ),
            )
            .orderBy(meetings.date)
            .limit(10);

        for (const m of upcomingMeetings) {
            items.push({
                id: `mtg-${m.id}`,
                data: m.date?.toISOString().split("T")[0] ?? todayStr,
                titulo: m.title ?? "Reuniao",
                tipo: "reuniao",
            });
        }

        // 2. Upcoming AP due dates
        const upcomingAP = await db
            .select()
            .from(accountsPayable)
            .where(
                and(
                    inArray(accountsPayable.status, ["pending", "open"]),
                    sql`${accountsPayable.dueDate} >= ${todayStr}`,
                    sql`${accountsPayable.dueDate} <= ${futureStr}`,
                ),
            )
            .orderBy(accountsPayable.dueDate)
            .limit(5);

        for (const row of upcomingAP) {
            items.push({
                id: `ap-due-${row.id}`,
                data: row.dueDate ?? todayStr,
                titulo: `Vencimento: ${row.supplierName} — ${formatCurrency(row.value)}`,
                tipo: "vencimento",
            });
        }

        // 3. Upcoming AR due dates (open)
        const upcomingAR = await db
            .select({ ar: arTitles, clientName: clients.companyName })
            .from(arTitles)
            .leftJoin(clients, eq(arTitles.clientId, clients.id))
            .where(
                and(
                    eq(arTitles.status, "open"),
                    sql`${arTitles.dueDate} >= ${todayStr}`,
                    sql`${arTitles.dueDate} <= ${futureStr}`,
                ),
            )
            .orderBy(arTitles.dueDate)
            .limit(5);

        for (const row of upcomingAR) {
            items.push({
                id: `ar-due-${row.ar.id}`,
                data: row.ar.dueDate ?? todayStr,
                titulo: `Recebimento: ${row.clientName ?? "Cliente"} — ${formatCurrency(row.ar.value)}`,
                tipo: "vencimento",
            });
        }

        // Sort by date
        items.sort((a, b) => a.data.localeCompare(b.data));

        if (items.length === 0) {
            return [...MOCK_EVENTS];
        }

        return items.slice(0, 10);
    } catch {
        return [...MOCK_EVENTS];
    }
}
