import { z } from "zod";

// --- Enums ---

export const leadTemperature = z.enum(["frio", "morno", "quente"]);
export const leadStatus = z.enum(["novo", "contato_feito", "proposta_enviada", "negociacao", "ganho", "perdido"]);
export const proposalStatus = z.enum(["draft", "sent", "approved", "rejected", "expired"]);
export const caseStatus = z.enum(["active", "paused", "closed", "archived"]);
export const taskStatus = z.enum(["todo", "in_progress", "done", "blocked"]);
export const taskPriority = z.enum(["low", "medium", "high", "urgent"]);
export const billingType = z.enum(["mensal_fixo", "hora_trabalhada", "exito", "hibrido"]);
export const invoiceStatus = z.enum(["pending", "issued", "cancelled", "error"]);
export const arTitleStatus = z.enum(["open", "partial", "paid", "overdue", "cancelled"]);
export const preInvoiceStatus = z.enum(["draft", "review", "approved", "invoiced"]);

// --- Approval Module ---
export const approvalEntityType = z.enum(["payable", "receivable", "time_entry"]);
export const payableApprovalStatus = z.enum(["pendente", "aprovado", "rejeitado", "agendado", "pago"]);
export const receivableApprovalStatus = z.enum(["pendente", "aprovado", "rejeitado", "desconto_solicitado", "baixa_solicitada"]);
export const timeEntryApprovalStatus = z.enum(["pendente", "aprovado", "rejeitado", "faturado"]);

// --- Lead ---

export const createLeadSchema = z.object({
    companyName: z.string().max(255).optional(),
    contactName: z.string().min(1, "Nome do contato obrigatorio").max(255),
    contactEmail: z.string().email("E-mail invalido").optional().or(z.literal("")),
    contactPhone: z.string().max(50).optional(),
    origin: z.string().max(100).optional(),
    temperature: leadTemperature.default("morno"),
    probability: z.number().int().min(0).max(100).default(50),
    status: leadStatus.default("novo"),
    nextSteps: z.string().optional(),
    notes: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

// --- Client ---

export const createClientSchema = z.object({
    companyName: z.string().min(1, "Razao social obrigatoria").max(255),
    tradeName: z.string().max(255).optional(),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ invalido").optional().or(z.literal("")),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF invalido").optional().or(z.literal("")),
    contactName: z.string().max(255).optional(),
    contactEmail: z.string().email("E-mail invalido").optional().or(z.literal("")),
    contactPhone: z.string().max(50).optional(),
});

export const updateClientSchema = createClientSchema.partial();

// --- Case ---

export const createCaseSchema = z.object({
    clientId: z.string().uuid("Cliente obrigatorio"),
    title: z.string().min(1, "Titulo obrigatorio").max(255),
    description: z.string().optional(),
    area: z.string().max(100).optional(),
    responsibleId: z.string().uuid().optional(),
    costCenter: z.string().max(50).optional(),
});

export const updateCaseSchema = createCaseSchema.partial();

// --- Task ---

export const createTaskSchema = z.object({
    caseId: z.string().uuid("Caso obrigatorio"),
    title: z.string().min(1, "Titulo obrigatorio").max(255),
    description: z.string().optional(),
    status: taskStatus.default("todo"),
    priority: taskPriority.default("medium"),
    assigneeId: z.string().uuid().optional(),
    due_date: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

// --- Time Entry ---

export const createTimeEntrySchema = z.object({
    caseId: z.string().uuid("Caso obrigatorio"),
    taskId: z.string().uuid().optional(),
    activityType: z.string().min(1, "Tipo de atividade obrigatorio").max(100),
    description: z.string().min(1, "Descricao obrigatoria"),
    durationMinutes: z.number().int().min(1, "Duracao minima: 1 minuto"),
    date: z.string().min(1, "Data obrigatoria"),
    isBillable: z.boolean().default(true),
});

export const updateTimeEntrySchema = createTimeEntrySchema.partial();

// --- Proposal ---

export const createProposalSchema = z.object({
    leadId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
    templateId: z.string().max(100).optional(),
    content: z.record(z.string(), z.unknown()),
    totalValue: z.string().optional(),
    billingType: billingType.optional(),
    validUntil: z.string().optional(),
});

export const updateProposalSchema = createProposalSchema.partial();

// --- Billing Plan ---

export const createBillingPlanSchema = z.object({
    caseId: z.string().uuid("Caso obrigatorio"),
    clientId: z.string().uuid("Cliente obrigatorio"),
    type: billingType,
    monthlyValue: z.string().optional(),
    hourlyRate: z.string().optional(),
    monthlyHoursIncluded: z.number().int().optional(),
    excessRate: z.string().optional(),
    successPercentage: z.string().optional(),
    taxRate: z.string().default("14.53"),
    billingDay: z.number().int().min(1).max(31).default(1),
    paymentTerms: z.number().int().min(0).default(30),
    notes: z.string().optional(),
});

// --- Pre-Invoice ---

export const createPreInvoiceSchema = z.object({
    caseId: z.string().uuid("Caso obrigatorio"),
    clientId: z.string().uuid("Cliente obrigatorio"),
    billingPlanId: z.string().uuid().optional(),
    referencePeriod: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM").optional(),
    baseValue: z.string().min(1, "Valor base obrigatorio"),
    taxValue: z.string().default("0"),
    totalValue: z.string().min(1, "Valor total obrigatorio"),
    lineItems: z.array(z.record(z.string(), z.unknown())),
    notes: z.string().optional(),
});

// --- Approval Actions ---

export const approvalActionSchema = z.object({
    entityType: approvalEntityType,
    entityId: z.string().uuid("ID da entidade obrigatorio"),
    action: z.enum(["approve", "reject"]),
    comment: z.string().optional(),
}).refine(
    (data) => data.action !== "reject" || (data.comment && data.comment.trim().length > 0),
    { message: "Motivo da rejeicao e obrigatorio", path: ["comment"] },
);

export const batchApprovalSchema = z.object({
    entityType: approvalEntityType,
    entityIds: z.array(z.string().uuid()).min(1, "Selecione pelo menos um item"),
    action: z.enum(["approve", "reject"]),
    comment: z.string().optional(),
}).refine(
    (data) => data.action !== "reject" || (data.comment && data.comment.trim().length > 0),
    { message: "Motivo da rejeicao e obrigatorio", path: ["comment"] },
);

export const receivableRequestSchema = z.object({
    receivableId: z.string().uuid("Titulo obrigatorio"),
    requestType: z.enum(["desconto", "baixa"]),
    requestedValue: z.string().optional(),
    reason: z.string().min(1, "Motivo obrigatorio"),
});
