// =============================================================================
// Barrel re-exports for server actions
// Import from "@/lib/actions" instead of individual files
// =============================================================================

// Leads
export { getLeads, getLeadById, createLead, updateLead, deleteLead } from "./leads";
export { getLeadsForBoard, createLeadFromBoard, updateLeadFromBoard, deleteLeadFromBoard } from "./leads";
export { getFollowUpInbox, getFollowUpDigest } from "./leads";

// Cases
export { getCases, getCaseById, createCase, updateCase } from "./cases";

// Proposals
export { getProposals, getProposalById, createProposal, updateProposal } from "./proposals";

// Financeiro (AP + AR)
export { getReceivables, getPayables, createPayable, updatePayableStatus, deletePayable } from "./financeiro";

// Tasks
export { getTasksForCase, createTask, updateTask, updateTaskStatus, deleteTask, reorderTasks } from "./tasks";

// Time Entries
export { getTimeEntries, createTimeEntry, updateTimeEntryStatus } from "./time-entries";
export { submitTimeEntry, retractTimeEntry, updateTimeEntry, deleteTimeEntry, getCapStatusAction } from "./time-entries";

// Bank Transactions
export { getBankEntries, reconcileBankEntry } from "./bank-transactions";

// Faturamento (Pre-Invoices)
export { getInvoices, generatePreInvoice, submitPreInvoice, approvePreInvoice, rejectPreInvoice, cancelPreInvoice } from "./faturamento";

// Dashboard
export { getPendingApprovals, getNotifications, getEvents } from "./dashboard";

// Forecast & KPIs
export { fetchDashboardKPIs, fetchCashflowChart, fetchRollingForecast, fetchRiskItems } from "./forecast";
