"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
    preInvoices,
    invoices,
    arTitles,
    clients,
    cases,
    auditLogs,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getNFSeAdapter } from "@/lib/integrations/nfse";
import { isValidPreInvoiceTransition } from "@/lib/approval/types";
import type { PreInvoiceStatus } from "@/lib/approval/types";

// ============================================================================
// Types
// ============================================================================

export type EmitNFSeResult = {
    success: boolean;
    nfseNumber?: string;
    pdfUrl?: string;
    invoiceId?: string;
    error?: string;
};

// ============================================================================
// emitNFSeFromApprovedPreInvoice
// ============================================================================

export async function emitNFSeFromApprovedPreInvoice(
    preInvoiceId: string,
): Promise<EmitNFSeResult> {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    const parsed = z.string().uuid().safeParse(preInvoiceId);
    if (!parsed.success) return { success: false, error: "ID invalido" };

    try {
        // ── 1. Load pre-invoice ──
        const [pi] = await db
            .select()
            .from(preInvoices)
            .where(eq(preInvoices.id, parsed.data))
            .limit(1);

        if (!pi) return { success: false, error: "Pre-fatura nao encontrada" };

        const current = (pi.status ?? "draft") as PreInvoiceStatus;
        if (!isValidPreInvoiceTransition(current, "invoiced")) {
            return { success: false, error: `Nao e possivel faturar a partir do status "${current}"` };
        }

        // ── 2. Idempotency: check if invoice already exists ──
        const [existingInvoice] = await db
            .select({
                id: invoices.id,
                nfseNumber: invoices.nfseNumber,
                nfsePdfUrl: invoices.nfsePdfUrl,
            })
            .from(invoices)
            .where(eq(invoices.preInvoiceId, parsed.data))
            .limit(1);

        if (existingInvoice) {
            return {
                success: true,
                nfseNumber: existingInvoice.nfseNumber ?? undefined,
                pdfUrl: existingInvoice.nfsePdfUrl ?? undefined,
                invoiceId: existingInvoice.id,
            };
        }

        // ── 3. Load client data ──
        const [client] = await db
            .select({ companyName: clients.companyName, cnpj: clients.cnpj })
            .from(clients)
            .where(eq(clients.id, pi.clientId))
            .limit(1);

        // ── 4. Load case data for description ──
        const [caseRow] = await db
            .select({ title: cases.title, caseNumber: cases.caseNumber })
            .from(cases)
            .where(eq(cases.id, pi.caseId))
            .limit(1);

        const description = `Servicos Advocaticios — ${caseRow?.caseNumber ?? "CASO"} — ${caseRow?.title ?? ""} — Ref. ${pi.referencePeriod ?? ""}`;

        // ── 5. Call NFSe adapter ──
        const adapter = getNFSeAdapter();
        const nfseResult = await adapter.emit({
            preInvoiceId: parsed.data,
            clientName: client?.companyName ?? "Cliente",
            clientCnpj: client?.cnpj ?? undefined,
            value: parseFloat(pi.totalValue),
            taxValue: parseFloat(pi.taxValue ?? "0"),
            description,
        });

        // ── 6. Create invoices row ──
        const today = new Date().toISOString().split("T")[0];

        const [newInvoice] = await db.insert(invoices).values({
            preInvoiceId: parsed.data,
            clientId: pi.clientId,
            caseId: pi.caseId,
            nfseNumber: nfseResult.nfseNumber,
            nfseVerificationCode: nfseResult.verificationCode,
            nfseXml: nfseResult.xml,
            nfsePdfUrl: nfseResult.pdfUrl,
            issueDate: today,
            value: pi.totalValue,
            taxValue: pi.taxValue,
            status: "issued",
            providerResponse: nfseResult.providerResponse,
        }).returning({ id: invoices.id });

        // ── 7. Create AR title ──
        // Due date: 30 days from today
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateStr = dueDate.toISOString().split("T")[0];

        await db.insert(arTitles).values({
            invoiceId: newInvoice.id,
            clientId: pi.clientId,
            caseId: pi.caseId,
            value: pi.totalValue,
            dueDate: dueDateStr,
            status: "open",
            approvalStatus: "pendente",
            notes: `NFS-e ${nfseResult.nfseNumber} — ${description}`,
        });

        // ── 8. Transition pre-invoice to "invoiced" ──
        await db.update(preInvoices).set({
            status: "invoiced",
            updatedAt: new Date(),
        }).where(eq(preInvoices.id, parsed.data));

        // ── 9. Audit log ──
        await db.insert(auditLogs).values({
            userId: session.user.id,
            action: "nfse_emitted",
            entityType: "invoice",
            entityId: newInvoice.id,
            newData: {
                preInvoiceId: parsed.data,
                nfseNumber: nfseResult.nfseNumber,
                value: pi.totalValue,
            },
        });

        return {
            success: true,
            nfseNumber: nfseResult.nfseNumber,
            pdfUrl: nfseResult.pdfUrl,
            invoiceId: newInvoice.id,
        };
    } catch (err) {
        console.error("[emitNFSeFromApprovedPreInvoice]", err);
        return { success: false, error: "Erro ao emitir NFS-e" };
    }
}
