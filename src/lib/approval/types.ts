// =============================================================================
// PF Advogados ERP — Approval Module Types & Authority Matrix
// =============================================================================

// --- Generic Approval Status ---
export type ApprovalStatus = "pendente" | "aprovado" | "rejeitado";

// --- Module-specific Status Extensions ---
export type PayableApprovalStatus = ApprovalStatus | "agendado" | "pago";
export type ReceivableApprovalStatus = ApprovalStatus | "desconto_solicitado" | "baixa_solicitada";
export type TimeEntryApprovalStatus = "rascunho" | "pendente" | "aprovado" | "rejeitado" | "faturado";
export type PreInvoiceStatus = "draft" | "pending" | "approved" | "rejected" | "invoiced" | "cancelled";

// --- Entity Types for Approval ---
export type ApprovalEntityType = "payable" | "receivable" | "time_entry" | "pre_invoice";

// --- User Roles (mirrors DB roles.name) ---
export type UserRole = "socio" | "advogado" | "financeiro" | "admin";

// --- Authority Matrix ---
export const APPROVAL_AUTHORITY: Record<ApprovalEntityType, UserRole[]> = {
    payable: ["socio", "admin"],
    receivable: ["socio", "admin"],
    time_entry: ["socio", "admin"],
    pre_invoice: ["socio", "admin"],
};

export function canUserApprove(entityType: ApprovalEntityType, userRole: UserRole): boolean {
    return APPROVAL_AUTHORITY[entityType].includes(userRole);
}

// --- Transition Maps ---
export const PAYABLE_TRANSITIONS: Record<PayableApprovalStatus, PayableApprovalStatus[]> = {
    pendente: ["aprovado", "rejeitado"],
    aprovado: ["agendado"],
    rejeitado: ["pendente"], // resubmit
    agendado: ["pago"],
    pago: [],
};

export const RECEIVABLE_TRANSITIONS: Record<ReceivableApprovalStatus, ReceivableApprovalStatus[]> = {
    pendente: [], // no approval needed for normal flow
    aprovado: [],
    rejeitado: [],
    desconto_solicitado: ["aprovado", "rejeitado"],
    baixa_solicitada: ["aprovado", "rejeitado"],
};

export const TIME_ENTRY_TRANSITIONS: Record<TimeEntryApprovalStatus, TimeEntryApprovalStatus[]> = {
    rascunho: ["pendente"],
    pendente: ["aprovado", "rejeitado", "rascunho"],
    aprovado: ["faturado", "pendente"],
    rejeitado: ["rascunho"],
    faturado: [],
};

export const PRE_INVOICE_TRANSITIONS: Record<PreInvoiceStatus, PreInvoiceStatus[]> = {
    draft: ["pending", "cancelled"],
    pending: ["approved", "rejected"],
    approved: ["invoiced"],
    rejected: ["draft", "cancelled"],
    invoiced: [],
    cancelled: [],
};

// --- Display Labels ---
export const APPROVAL_STATUS_LABELS: Record<string, string> = {
    rascunho: "Rascunho",
    pendente: "Pendente",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado",
    agendado: "Agendado",
    pago: "Pago",
    desconto_solicitado: "Desconto Solicitado",
    baixa_solicitada: "Baixa Solicitada",
    faturado: "Faturado",
    // Pre-Invoice statuses
    draft: "Rascunho",
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    invoiced: "Faturado",
    cancelled: "Cancelado",
};

// --- Status Color Map (for badges) ---
export const APPROVAL_STATUS_COLORS: Record<string, string> = {
    rascunho: "bg-gray-100 text-gray-600",
    pendente: "bg-orange-100 text-orange-700",
    aprovado: "bg-green-100 text-green-700",
    rejeitado: "bg-red-100 text-red-700",
    agendado: "bg-blue-100 text-blue-700",
    pago: "bg-green-100 text-green-800",
    desconto_solicitado: "bg-amber-100 text-amber-700",
    baixa_solicitada: "bg-purple-100 text-purple-700",
    faturado: "bg-indigo-100 text-indigo-700",
    // Pre-Invoice statuses
    draft: "bg-gray-100 text-gray-600",
    pending: "bg-orange-100 text-orange-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    invoiced: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-gray-100 text-gray-400",
};

// --- Approval Metadata (shared shape for all modules) ---
export type ApprovalMetadata = {
    approvalStatus: string;
    submittedBy?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionComment?: string;
};

// --- Transition Validation ---
export function isValidTimeEntryTransition(
    current: TimeEntryApprovalStatus,
    next: TimeEntryApprovalStatus,
): boolean {
    return TIME_ENTRY_TRANSITIONS[current]?.includes(next) ?? false;
}

export function isValidPreInvoiceTransition(
    current: PreInvoiceStatus,
    next: PreInvoiceStatus,
): boolean {
    return PRE_INVOICE_TRANSITIONS[current]?.includes(next) ?? false;
}
