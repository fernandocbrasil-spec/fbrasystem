// =============================================================================
// Barrel re-exports for server actions
// Import from "@/lib/actions" instead of individual files
// =============================================================================

export { getLeads, getLeadById } from "./leads";
export { getCases, getCaseById } from "./cases";
export { getProposals, getProposalById } from "./proposals";
export { getReceivables, getPayables } from "./financeiro";
export { getTimeEntries } from "./time-entries";
