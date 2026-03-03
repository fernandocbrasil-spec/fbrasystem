import { pgTable, uuid, varchar, text, timestamp, boolean, decimal, integer, jsonb, date } from "drizzle-orm/pg-core";
import { relations, sql, InferSelectModel, InferInsertModel } from "drizzle-orm";

// --- CORE ---

export const roles = pgTable("roles", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).unique().notNull(), // socio, advogado, financeiro, admin
    permissions: jsonb("permissions").default({}).notNull(),
});

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    azureId: varchar("azure_id", { length: 255 }).unique(),
    roleId: uuid("role_id").references(() => roles.id),
    avatarUrl: text("avatar_url"),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).default("0"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- CRM ---

export const leads = pgTable("leads", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyName: varchar("company_name", { length: 255 }),
    contactName: varchar("contact_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 50 }),
    origin: varchar("origin", { length: 100 }),
    responsibleId: uuid("responsible_id").references(() => users.id),
    temperature: varchar("temperature", { length: 20 }).default("morno"),
    probability: integer("probability").default(50),
    status: varchar("status", { length: 50 }).default("novo"),
    nextSteps: text("next_steps"),
    followUpDate: date("follow_up_date"),
    notes: text("notes"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const meetings = pgTable("meetings", {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id").references(() => leads.id),
    caseId: uuid("case_id").references(() => cases.id),
    firefliesId: varchar("fireflies_id", { length: 255 }),
    title: varchar("title", { length: 255 }),
    date: timestamp("date", { withTimezone: true }),
    transcript: text("transcript"),
    aiSummary: text("ai_summary"),
    aiBrief: jsonb("ai_brief"),
    participants: jsonb("participants"),
    recordingUrl: text("recording_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- PROPOSTAS ---

export const proposals = pgTable("proposals", {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id").references(() => leads.id),
    clientId: uuid("client_id").references(() => clients.id),
    version: integer("version").default(1),
    status: varchar("status", { length: 50 }).default("draft"),
    templateId: varchar("template_id", { length: 100 }),
    content: jsonb("content").notNull(),
    totalValue: decimal("total_value", { precision: 12, scale: 2 }),
    billingType: varchar("billing_type", { length: 50 }),
    validUntil: date("valid_until"),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    pdfUrl: text("pdf_url"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const proposalVersions = pgTable("proposal_versions", {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id").references(() => proposals.id),
    version: integer("version").notNull(),
    content: jsonb("content").notNull(),
    changedBy: uuid("changed_by").references(() => users.id),
    changeReason: text("change_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- CLIENTES E CASOS ---

export const clients = pgTable("clients", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    tradeName: varchar("trade_name", { length: 255 }),
    cnpj: varchar("cnpj", { length: 18 }),
    cpf: varchar("cpf", { length: 14 }),
    address: jsonb("address"),
    contactName: varchar("contact_name", { length: 255 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 50 }),
    leadId: uuid("lead_id").references(() => leads.id),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const cases = pgTable("cases", {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").references(() => clients.id).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    caseNumber: varchar("case_number", { length: 50 }),
    status: varchar("status", { length: 50 }).default("active"),
    area: varchar("area", { length: 100 }),
    responsibleId: uuid("responsible_id").references(() => users.id),
    costCenter: varchar("cost_center", { length: 50 }),
    driveFolderId: varchar("drive_folder_id", { length: 255 }),
    driveFolderUrl: text("drive_folder_url"),
    proposalId: uuid("proposal_id").references(() => proposals.id),
    startedAt: date("started_at"),
    closedAt: date("closed_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const caseMembers = pgTable("case_members", {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id").references(() => cases.id).notNull(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    role: varchar("role", { length: 50 }).default("member"),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
});

// --- EXECUÇÃO ---

export const tasks = pgTable("tasks", {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id").references(() => cases.id).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).default("todo"),
    priority: varchar("priority", { length: 20 }).default("medium"),
    assigneeId: uuid("assignee_id").references(() => users.id),
    due_date: date("due_date"),
    checklist: jsonb("checklist").default([]),
    attachments: jsonb("attachments").default([]),
    position: integer("position").default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- APONTAMENTO DE HORAS ---

export const timeEntries = pgTable("time_entries", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    caseId: uuid("case_id").references(() => cases.id).notNull(),
    taskId: uuid("task_id").references(() => tasks.id),
    activityType: varchar("activity_type", { length: 100 }).notNull(),
    description: text("description").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    date: date("date").notNull(),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
    isBillable: boolean("is_billable").default(true),
    preInvoiceId: uuid("pre_invoice_id").references(() => preInvoices.id),
    approvalStatus: varchar("approval_status", { length: 50 }).default("pendente"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectionComment: text("rejection_comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- FATURAMENTO ---

export const billingPlans = pgTable("billing_plans", {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id").references(() => cases.id).notNull(),
    clientId: uuid("client_id").references(() => clients.id).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    monthlyValue: decimal("monthly_value", { precision: 12, scale: 2 }),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
    monthlyHoursIncluded: integer("monthly_hours_included"),
    excessRate: decimal("excess_rate", { precision: 10, scale: 2 }),
    successPercentage: decimal("success_percentage", { precision: 5, scale: 2 }),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("14.53"),
    billingDay: integer("billing_day").default(1),
    paymentTerms: integer("payment_terms").default(30),
    isActive: boolean("is_active").default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const preInvoices = pgTable("pre_invoices", {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id").references(() => cases.id).notNull(),
    clientId: uuid("client_id").references(() => clients.id).notNull(),
    billingPlanId: uuid("billing_plan_id").references(() => billingPlans.id),
    referencePeriod: varchar("reference_period", { length: 7 }),
    baseValue: decimal("base_value", { precision: 12, scale: 2 }).notNull(),
    taxValue: decimal("tax_value", { precision: 12, scale: 2 }).default("0"),
    totalValue: decimal("total_value", { precision: 12, scale: 2 }).notNull(),
    status: varchar("status", { length: 50 }).default("draft"),
    lineItems: jsonb("line_items").notNull(),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const invoices = pgTable("invoices", {
    id: uuid("id").primaryKey().defaultRandom(),
    preInvoiceId: uuid("pre_invoice_id").references(() => preInvoices.id),
    clientId: uuid("client_id").references(() => clients.id).notNull(),
    caseId: uuid("case_id").references(() => cases.id),
    nfseNumber: varchar("nfse_number", { length: 50 }),
    nfseVerificationCode: varchar("nfse_verification_code", { length: 100 }),
    nfseXml: text("nfse_xml"),
    nfsePdfUrl: text("nfse_pdf_url"),
    issueDate: date("issue_date").notNull(),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    taxValue: decimal("tax_value", { precision: 12, scale: 2 }),
    status: varchar("status", { length: 50 }).default("pending"),
    providerResponse: jsonb("provider_response"),
    sentToClientAt: timestamp("sent_to_client_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- CONTAS A RECEBER ---

export const arTitles = pgTable("ar_titles", {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id").references(() => invoices.id),
    clientId: uuid("client_id").references(() => clients.id).notNull(),
    caseId: uuid("case_id").references(() => cases.id),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),
    paidValue: decimal("paid_value", { precision: 12, scale: 2 }),
    status: varchar("status", { length: 50 }).default("open"),
    bankTransactionId: uuid("bank_transaction_id").references(() => bankTransactions.id),
    approvalStatus: varchar("approval_status", { length: 50 }).default("pendente"),
    requestedAction: varchar("requested_action", { length: 50 }),
    requestedBy: uuid("requested_by").references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectionComment: text("rejection_comment"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- CONCILIAÇÃO BANCÁRIA ---

export const bankTransactions = pgTable("bank_transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    bank: varchar("bank", { length: 50 }).default("itau"),
    account: varchar("account", { length: 50 }),
    date: date("date").notNull(),
    description: text("description"),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    type: varchar("type", { length: 10 }),
    documentNumber: varchar("document_number", { length: 100 }),
    isReconciled: boolean("is_reconciled").default(false),
    importBatch: varchar("import_batch", { length: 50 }),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const reconciliationMatches = pgTable("reconciliation_matches", {
    id: uuid("id").primaryKey().defaultRandom(),
    bankTransactionId: uuid("bank_transaction_id").references(() => bankTransactions.id),
    arTitleId: uuid("ar_title_id").references(() => arTitles.id),
    matchType: varchar("match_type", { length: 50 }),
    confidence: decimal("confidence", { precision: 5, scale: 2 }),
    matchedBy: uuid("matched_by").references(() => users.id),
    matchedAt: timestamp("matched_at", { withTimezone: true }).defaultNow(),
    notes: text("notes"),
});

// --- FLUXO DE CAIXA ---

export const cashflowDaily = pgTable("cashflow_daily", {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date").notNull().unique(),
    openingBalance: decimal("opening_balance", { precision: 14, scale: 2 }),
    totalReceipts: decimal("total_receipts", { precision: 14, scale: 2 }).default("0"),
    totalPayments: decimal("total_payments", { precision: 14, scale: 2 }).default("0"),
    closingBalance: decimal("closing_balance", { precision: 14, scale: 2 }),
    projectedReceipts: decimal("projected_receipts", { precision: 14, scale: 2 }).default("0"),
    projectedPayments: decimal("projected_payments", { precision: 14, scale: 2 }).default("0"),
    notes: text("notes"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- CONTAS A PAGAR ---

export const accountsPayable = pgTable("accounts_payable", {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: varchar("supplier_id", { length: 255 }),
    supplierName: varchar("supplier_name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),
    status: varchar("status", { length: 50 }).default("pending"),
    approvalStatus: varchar("approval_status", { length: 50 }).default("pendente"),
    submittedBy: uuid("submitted_by").references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectionComment: text("rejection_comment"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- COFRE DOS SÓCIOS ---

export const partners = pgTable("partners", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }).notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const partnerLedger = pgTable("partner_ledger", {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerId: uuid("partner_id").references(() => partners.id).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    balanceAfter: decimal("balance_after", { precision: 14, scale: 2 }),
    description: text("description"),
    approvedBy: uuid("approved_by").references(() => users.id),
    referenceDate: date("reference_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const distributions = pgTable("distributions", {
    id: uuid("id").primaryKey().defaultRandom(),
    period: varchar("period", { length: 7 }),
    totalValue: decimal("total_value", { precision: 12, scale: 2 }).notNull(),
    status: varchar("status", { length: 50 }).default("simulated"),
    minCashRule: decimal("min_cash_rule", { precision: 12, scale: 2 }),
    cashAfter: decimal("cash_after", { precision: 14, scale: 2 }),
    breakdown: jsonb("breakdown"),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- AUDITORIA ---

export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }),
    entityId: uuid("entity_id"),
    oldData: jsonb("old_data"),
    newData: jsonb("new_data"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- FILA DE EXCEÇÕES ---

export const exceptionQueue = pgTable("exception_queue", {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 100 }).notNull(),
    source: varchar("source", { length: 100 }),
    data: jsonb("data").notNull(),
    status: varchar("status", { length: 50 }).default("pending"),
    resolvedBy: uuid("resolved_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- DRIVE ---

export const driveFolders = pgTable("drive_folders", {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id").references(() => cases.id),
    clientId: uuid("client_id").references(() => clients.id),
    folderId: varchar("folder_id", { length: 255 }).notNull(),
    folderUrl: text("folder_url"),
    folderPath: text("folder_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --- REGRAS ---

export const rules = pgTable("rules", {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 100 }).unique().notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- RELATIONS ---

export const usersRelations = relations(users, ({ one, many }) => ({
    role: one(roles, { fields: [users.roleId], references: [roles.id] }),
    leads: many(leads),
    timeEntries: many(timeEntries),
    cases: many(cases),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
    users: many(users),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
    responsible: one(users, { fields: [leads.responsibleId], references: [users.id] }),
    meetings: many(meetings),
    proposals: many(proposals),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
    lead: one(leads, { fields: [meetings.leadId], references: [leads.id] }),
    case_: one(cases, { fields: [meetings.caseId], references: [cases.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
    lead: one(leads, { fields: [clients.leadId], references: [leads.id] }),
    cases: many(cases),
    proposals: many(proposals),
    billingPlans: many(billingPlans),
    invoices: many(invoices),
    arTitles: many(arTitles),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
    lead: one(leads, { fields: [proposals.leadId], references: [leads.id] }),
    client: one(clients, { fields: [proposals.clientId], references: [clients.id] }),
    createdByUser: one(users, { fields: [proposals.createdBy], references: [users.id] }),
    approvedByUser: one(users, { fields: [proposals.approvedBy], references: [users.id] }),
    versions: many(proposalVersions),
}));

export const proposalVersionsRelations = relations(proposalVersions, ({ one }) => ({
    proposal: one(proposals, { fields: [proposalVersions.proposalId], references: [proposals.id] }),
    changedByUser: one(users, { fields: [proposalVersions.changedBy], references: [users.id] }),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
    client: one(clients, { fields: [cases.clientId], references: [clients.id] }),
    responsible: one(users, { fields: [cases.responsibleId], references: [users.id] }),
    proposal: one(proposals, { fields: [cases.proposalId], references: [proposals.id] }),
    members: many(caseMembers),
    tasks: many(tasks),
    timeEntries: many(timeEntries),
    billingPlans: many(billingPlans),
    preInvoices: many(preInvoices),
}));

export const caseMembersRelations = relations(caseMembers, ({ one }) => ({
    case_: one(cases, { fields: [caseMembers.caseId], references: [cases.id] }),
    user: one(users, { fields: [caseMembers.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    case_: one(cases, { fields: [tasks.caseId], references: [cases.id] }),
    assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
    timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
    user: one(users, { fields: [timeEntries.userId], references: [users.id] }),
    case_: one(cases, { fields: [timeEntries.caseId], references: [cases.id] }),
    task: one(tasks, { fields: [timeEntries.taskId], references: [tasks.id] }),
    preInvoice: one(preInvoices, { fields: [timeEntries.preInvoiceId], references: [preInvoices.id] }),
    approvedByUser: one(users, { fields: [timeEntries.approvedBy], references: [users.id] }),
}));

export const billingPlansRelations = relations(billingPlans, ({ one }) => ({
    case_: one(cases, { fields: [billingPlans.caseId], references: [cases.id] }),
    client: one(clients, { fields: [billingPlans.clientId], references: [clients.id] }),
}));

export const preInvoicesRelations = relations(preInvoices, ({ one }) => ({
    case_: one(cases, { fields: [preInvoices.caseId], references: [cases.id] }),
    client: one(clients, { fields: [preInvoices.clientId], references: [clients.id] }),
    billingPlan: one(billingPlans, { fields: [preInvoices.billingPlanId], references: [billingPlans.id] }),
    approvedByUser: one(users, { fields: [preInvoices.approvedBy], references: [users.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
    preInvoice: one(preInvoices, { fields: [invoices.preInvoiceId], references: [preInvoices.id] }),
    client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
    case_: one(cases, { fields: [invoices.caseId], references: [cases.id] }),
}));

export const arTitlesRelations = relations(arTitles, ({ one }) => ({
    invoice: one(invoices, { fields: [arTitles.invoiceId], references: [invoices.id] }),
    client: one(clients, { fields: [arTitles.clientId], references: [clients.id] }),
    case_: one(cases, { fields: [arTitles.caseId], references: [cases.id] }),
    bankTransaction: one(bankTransactions, { fields: [arTitles.bankTransactionId], references: [bankTransactions.id] }),
    requestedByUser: one(users, { fields: [arTitles.requestedBy], references: [users.id] }),
    approvedByUser: one(users, { fields: [arTitles.approvedBy], references: [users.id] }),
}));

export const accountsPayableRelations = relations(accountsPayable, ({ one }) => ({
    submittedByUser: one(users, { fields: [accountsPayable.submittedBy], references: [users.id] }),
    approvedByUser: one(users, { fields: [accountsPayable.approvedBy], references: [users.id] }),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ many }) => ({
    reconciliationMatches: many(reconciliationMatches),
}));

export const reconciliationMatchesRelations = relations(reconciliationMatches, ({ one }) => ({
    bankTransaction: one(bankTransactions, { fields: [reconciliationMatches.bankTransactionId], references: [bankTransactions.id] }),
    arTitle: one(arTitles, { fields: [reconciliationMatches.arTitleId], references: [arTitles.id] }),
    matchedByUser: one(users, { fields: [reconciliationMatches.matchedBy], references: [users.id] }),
}));

export const partnersRelations = relations(partners, ({ one, many }) => ({
    user: one(users, { fields: [partners.userId], references: [users.id] }),
    ledger: many(partnerLedger),
}));

export const partnerLedgerRelations = relations(partnerLedger, ({ one }) => ({
    partner: one(partners, { fields: [partnerLedger.partnerId], references: [partners.id] }),
    approvedByUser: one(users, { fields: [partnerLedger.approvedBy], references: [users.id] }),
}));

export const distributionsRelations = relations(distributions, ({ one }) => ({
    approvedByUser: one(users, { fields: [distributions.approvedBy], references: [users.id] }),
}));

export const driveFoldersRelations = relations(driveFolders, ({ one }) => ({
    case_: one(cases, { fields: [driveFolders.caseId], references: [cases.id] }),
    client: one(clients, { fields: [driveFolders.clientId], references: [clients.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const rulesRelations = relations(rules, ({ one }) => ({
    updatedByUser: one(users, { fields: [rules.updatedBy], references: [users.id] }),
}));

export const exceptionQueueRelations = relations(exceptionQueue, ({ one }) => ({
    resolvedByUser: one(users, { fields: [exceptionQueue.resolvedBy], references: [users.id] }),
}));

// --- TYPES ---

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Role = InferSelectModel<typeof roles>;
export type Lead = InferSelectModel<typeof leads>;
export type NewLead = InferInsertModel<typeof leads>;
export type Meeting = InferSelectModel<typeof meetings>;
export type Client = InferSelectModel<typeof clients>;
export type NewClient = InferInsertModel<typeof clients>;
export type Proposal = InferSelectModel<typeof proposals>;
export type NewProposal = InferInsertModel<typeof proposals>;
export type ProposalVersion = InferSelectModel<typeof proposalVersions>;
export type Case = InferSelectModel<typeof cases>;
export type NewCase = InferInsertModel<typeof cases>;
export type CaseMember = InferSelectModel<typeof caseMembers>;
export type Task = InferSelectModel<typeof tasks>;
export type NewTask = InferInsertModel<typeof tasks>;
export type TimeEntry = InferSelectModel<typeof timeEntries>;
export type NewTimeEntry = InferInsertModel<typeof timeEntries>;
export type BillingPlan = InferSelectModel<typeof billingPlans>;
export type PreInvoice = InferSelectModel<typeof preInvoices>;
export type Invoice = InferSelectModel<typeof invoices>;
export type ArTitle = InferSelectModel<typeof arTitles>;
export type BankTransaction = InferSelectModel<typeof bankTransactions>;
export type ReconciliationMatch = InferSelectModel<typeof reconciliationMatches>;
export type CashflowDaily = InferSelectModel<typeof cashflowDaily>;
export type Partner = InferSelectModel<typeof partners>;
export type PartnerLedger = InferSelectModel<typeof partnerLedger>;
export type Distribution = InferSelectModel<typeof distributions>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type ExceptionQueueItem = InferSelectModel<typeof exceptionQueue>;
export type DriveFolder = InferSelectModel<typeof driveFolders>;
export type AccountPayable = InferSelectModel<typeof accountsPayable>;
export type NewAccountPayable = InferInsertModel<typeof accountsPayable>;
export type Rule = InferSelectModel<typeof rules>;
