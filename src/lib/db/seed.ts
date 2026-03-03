import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
    roles,
    users,
    leads,
    clients,
    cases,
    accountsPayable,
    arTitles,
    timeEntries,
    proposals,
    bankTransactions,
    partners,
    billingPlans,
    preInvoices,
} from "./schema";

// ============================================================================
// Deterministic UUIDs — manter em sincronia com auth.ts
// ============================================================================

const UUID = {
    // Roles
    ROLE_SOCIO: "b0000000-0000-4000-8000-000000000001",
    ROLE_ADVOGADO: "b0000000-0000-4000-8000-000000000002",
    ROLE_FINANCEIRO: "b0000000-0000-4000-8000-000000000003",
    ROLE_ADMIN: "b0000000-0000-4000-8000-000000000004",

    // Users
    USER_FERNANDO: "a0000000-0000-4000-8000-000000000001", // deve bater com auth.ts
    USER_JOSE_RAFAEL: "a0000000-0000-4000-8000-000000000002",
    USER_ANA_SOUZA: "a0000000-0000-4000-8000-000000000003",
    USER_CARLOS_OLIVEIRA: "a0000000-0000-4000-8000-000000000004",

    // Leads
    LEAD_TECHCORP: "c0000000-0000-4000-8000-000000000001",
    LEAD_ANA_PAULA: "c0000000-0000-4000-8000-000000000002",
    LEAD_LOGISTICA: "c0000000-0000-4000-8000-000000000003",
    LEAD_SEQUOIA: "c0000000-0000-4000-8000-000000000004",
    LEAD_IPE: "c0000000-0000-4000-8000-000000000005",
    LEAD_FARMACIA: "c0000000-0000-4000-8000-000000000006",
    LEAD_REDE_PLUS: "c0000000-0000-4000-8000-000000000007",
    LEAD_AUTOPECAS: "c0000000-0000-4000-8000-000000000008",
    LEAD_HOTEL: "c0000000-0000-4000-8000-000000000009",
    LEAD_CLINICA: "c0000000-0000-4000-8000-00000000000a",
    LEAD_PADARIA: "c0000000-0000-4000-8000-00000000000b",

    // Clients
    CLIENT_SEQUOIA: "d0000000-0000-4000-8000-000000000001",
    CLIENT_TECHCORP: "d0000000-0000-4000-8000-000000000002",
    CLIENT_LOGISTICA: "d0000000-0000-4000-8000-000000000003",
    CLIENT_METAL_SP: "d0000000-0000-4000-8000-000000000004",
    CLIENT_HORIZONTE: "d0000000-0000-4000-8000-000000000005",

    // Cases
    CASE_001: "e0000000-0000-4000-8000-000000000001",
    CASE_002: "e0000000-0000-4000-8000-000000000002",
    CASE_003: "e0000000-0000-4000-8000-000000000003",

    // Proposals
    PROPOSAL_001: "f0000000-0000-4000-8000-000000000001",
    PROPOSAL_002: "f0000000-0000-4000-8000-000000000002",

    // Billing Plans
    BP_001: "f1000000-0000-4000-8000-000000000001",
    BP_002: "f1000000-0000-4000-8000-000000000002",

    // Pre-Invoices
    PI_001: "f2000000-0000-4000-8000-000000000001",
    PI_002: "f2000000-0000-4000-8000-000000000002",
    PI_003: "f2000000-0000-4000-8000-000000000003",

    // Partners
    PARTNER_FERNANDO: "f3000000-0000-4000-8000-000000000001",
    PARTNER_JOSE: "f3000000-0000-4000-8000-000000000002",
} as const;

// ============================================================================
// Main seed function
// ============================================================================

async function seed() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not set. Add it to .env.local");
        process.exit(1);
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log("Seeding database...\n");

    // --- ROLES ---
    console.log("  [1/12] Roles...");
    await db.insert(roles).values([
        { id: UUID.ROLE_SOCIO, name: "socio", permissions: { all: true } },
        { id: UUID.ROLE_ADVOGADO, name: "advogado", permissions: { cases: true, timeEntries: true } },
        { id: UUID.ROLE_FINANCEIRO, name: "financeiro", permissions: { financial: true, billing: true } },
        { id: UUID.ROLE_ADMIN, name: "admin", permissions: { all: true } },
    ]).onConflictDoNothing();

    // --- USERS ---
    console.log("  [2/12] Users...");
    await db.insert(users).values([
        { id: UUID.USER_FERNANDO, email: "fernando@pfadvogados.com.br", name: "Fernando Brasil", roleId: UUID.ROLE_SOCIO, hourlyRate: "350.00" },
        { id: UUID.USER_JOSE_RAFAEL, email: "jose.rafael@pfadvogados.com.br", name: "Jose Rafael Feiteiro", roleId: UUID.ROLE_SOCIO, hourlyRate: "400.00" },
        { id: UUID.USER_ANA_SOUZA, email: "ana.souza@pfadvogados.com.br", name: "Ana Souza", roleId: UUID.ROLE_ADVOGADO, hourlyRate: "280.00" },
        { id: UUID.USER_CARLOS_OLIVEIRA, email: "carlos.oliveira@pfadvogados.com.br", name: "Carlos Oliveira", roleId: UUID.ROLE_ADVOGADO, hourlyRate: "250.00" },
    ]).onConflictDoNothing();

    // --- LEADS ---
    console.log("  [3/12] Leads...");
    await db.insert(leads).values([
        { id: UUID.LEAD_TECHCORP, companyName: "TechCorp BR", contactName: "Carlos Silva", temperature: "morno", status: "prospeccao", responsibleId: UUID.USER_JOSE_RAFAEL, followUpDate: "2026-03-04", notes: "Elementos de acao", metadata: { displayName: "TechCorp BR — Assessoria Tributaria", boardStatus: "em_andamento", priority: "baixa", deadline: "2026-03-01", valor: "R$ 45.000", files: 1, timeline: { start: "2026-03-01", end: "2026-03-02" }, updatedBy: "Fernando Brasil" } },
        { id: UUID.LEAD_SEQUOIA, companyName: "Grupo Sequoia", contactName: "Marcelo Furtado", temperature: "quente", status: "prospeccao", responsibleId: UUID.USER_CARLOS_OLIVEIRA, followUpDate: "2026-03-05", notes: "Notas de reuniao", metadata: { displayName: "Grupo Sequoia — Planejamento Fiscal", boardStatus: "feito", priority: "alta", deadline: "2026-03-02", valor: "R$ 11.150", files: 0, timeline: { start: "2026-03-03", end: "2026-03-04" }, updatedBy: "Fernando Brasil" } },
        { id: UUID.LEAD_LOGISTICA, companyName: "Logistica ABC", contactName: "Marcos Torres", temperature: "quente", status: "prospeccao", responsibleId: UUID.USER_ANA_SOUZA, notes: "Contencioso trabalhista", metadata: { displayName: "Logistica ABC — Contencioso", boardStatus: "parado", priority: "media", deadline: "2026-03-03", valor: "R$ 8.500", files: 0, timeline: { start: "2026-03-05", end: "2026-03-06" }, updatedBy: "Fernando Brasil" } },
        { id: UUID.LEAD_IPE, companyName: "Construtora Ipe", contactName: "Ricardo Lima", temperature: "morno", status: "qualificacao", responsibleId: UUID.USER_FERNANDO, followUpDate: "2026-03-02", notes: "Urgente", metadata: { displayName: "Construtora Ipe — Compliance", boardStatus: "nao_iniciado", priority: "critico", deadline: "2026-03-05", valor: "R$ 22.000", files: 2, timeline: { start: "2026-03-01", end: "2026-03-10" }, updatedBy: "Jose Rafael" } },
        { id: UUID.LEAD_FARMACIA, companyName: "Farmacia Vida", contactName: "Laura Mendes", temperature: "morno", status: "qualificacao", responsibleId: UUID.USER_JOSE_RAFAEL, followUpDate: "2026-03-06", notes: "Aguardando docs", metadata: { displayName: "Farmacia Vida — Societario", boardStatus: "em_andamento", priority: "media", deadline: "2026-03-08", valor: "R$ 6.200", files: 1, timeline: { start: "2026-03-06", end: "2026-03-12" }, updatedBy: "Ana Souza" } },
        { id: UUID.LEAD_REDE_PLUS, companyName: "Rede Plus", contactName: "Pedro Costa", temperature: "quente", status: "proposta", responsibleId: UUID.USER_CARLOS_OLIVEIRA, followUpDate: "2026-03-01", notes: "Proposta enviada", metadata: { displayName: "Rede Plus — Trabalhista", boardStatus: "feito", priority: "alta", deadline: "2026-02-28", valor: "R$ 15.000", files: 3, timeline: { start: "2026-02-20", end: "2026-03-01" }, updatedBy: "Carlos Oliveira" } },
        { id: UUID.LEAD_AUTOPECAS, companyName: "Auto Pecas JR", contactName: "Junior Almeida", temperature: "morno", status: "proposta", responsibleId: UUID.USER_ANA_SOUZA, followUpDate: "2026-03-10", notes: "Follow-up", metadata: { displayName: "Auto Pecas JR — Tributario", boardStatus: "em_andamento", priority: "baixa", deadline: "2026-03-10", valor: "R$ 3.800", files: 0, timeline: { start: "2026-03-08", end: "2026-03-15" }, updatedBy: "Fernando Brasil" } },
        { id: UUID.LEAD_HOTEL, companyName: "Hotel Atlantico", contactName: "Roberta Santos", temperature: "quente", status: "negociacao", responsibleId: UUID.USER_FERNANDO, followUpDate: "2026-03-03", notes: "Negociacao de valores", metadata: { displayName: "Hotel Atlantico — Consultivo", boardStatus: "em_andamento", priority: "alta", deadline: "2026-03-12", valor: "R$ 32.000", files: 1, timeline: { start: "2026-03-05", end: "2026-03-15" }, updatedBy: "Jose Rafael" } },
        { id: UUID.LEAD_CLINICA, companyName: "Clinica Saude Total", contactName: "Dr. Fernando Gomes", temperature: "quente", status: "ganho", responsibleId: UUID.USER_JOSE_RAFAEL, notes: "Contrato assinado", metadata: { displayName: "Clinica Saude Total — Fiscal", boardStatus: "feito", priority: "media", deadline: "2026-02-25", valor: "R$ 18.500", files: 4, timeline: { start: "2026-02-15", end: "2026-02-28" }, updatedBy: "Jose Rafael" } },
        { id: UUID.LEAD_PADARIA, companyName: "Padaria Estrela", contactName: "Marcos Padeiro", temperature: "frio", status: "perdido", responsibleId: UUID.USER_CARLOS_OLIVEIRA, notes: "Sem retorno", metadata: { displayName: "Padaria Estrela — Contabil", boardStatus: "parado", priority: "baixa", deadline: "2026-02-20", valor: "R$ 2.100", files: 0, updatedBy: "Carlos Oliveira" } },
        { id: UUID.LEAD_ANA_PAULA, contactName: "Ana Paula Consultoria", temperature: "frio", status: "prospeccao", metadata: { displayName: "Ana Paula Consultoria", boardStatus: "nao_iniciado", priority: "", files: 0, updatedBy: "Fernando Brasil" } },
    ]).onConflictDoNothing();

    // --- CLIENTS ---
    console.log("  [4/12] Clients...");
    await db.insert(clients).values([
        { id: UUID.CLIENT_SEQUOIA, companyName: "Grupo Sequoia", contactName: "Marcelo Furtado", leadId: UUID.LEAD_SEQUOIA },
        { id: UUID.CLIENT_TECHCORP, companyName: "TechCorp BR", contactName: "Carlos Silva", leadId: UUID.LEAD_TECHCORP },
        { id: UUID.CLIENT_LOGISTICA, companyName: "Logistica ABC", contactName: "Marcos Torres", leadId: UUID.LEAD_LOGISTICA },
        { id: UUID.CLIENT_METAL_SP, companyName: "Industria Metal SP" },
        { id: UUID.CLIENT_HORIZONTE, companyName: "Construtora Horizonte" },
    ]).onConflictDoNothing();

    // --- CASES ---
    console.log("  [5/12] Cases...");
    await db.insert(cases).values([
        { id: UUID.CASE_001, clientId: UUID.CLIENT_SEQUOIA, title: "Assessoria Contabil e Fiscal Continua", caseNumber: "CA-2026-001", area: "Tributario / Consultivo", responsibleId: UUID.USER_JOSE_RAFAEL, startedAt: "2026-03-01" },
        { id: UUID.CASE_002, clientId: UUID.CLIENT_TECHCORP, title: "Planejamento Tributario 2026", caseNumber: "CA-2026-002", area: "Tributario / Planejamento", responsibleId: UUID.USER_CARLOS_OLIVEIRA, startedAt: "2026-02-25" },
        { id: UUID.CASE_003, clientId: UUID.CLIENT_LOGISTICA, title: "Revisao de Passivo Trabalhista", caseNumber: "CA-2025-089", area: "Trabalhista", responsibleId: UUID.USER_ANA_SOUZA, status: "paused", startedAt: "2025-11-10" },
    ]).onConflictDoNothing();

    // --- PROPOSALS ---
    console.log("  [6/12] Proposals...");
    await db.insert(proposals).values([
        { id: UUID.PROPOSAL_001, leadId: UUID.LEAD_SEQUOIA, clientId: UUID.CLIENT_SEQUOIA, status: "draft", content: { title: "Assessoria Contabil e Fiscal", sections: [] }, totalValue: "11150.00", billingType: "fixed", createdBy: UUID.USER_JOSE_RAFAEL },
        { id: UUID.PROPOSAL_002, leadId: UUID.LEAD_TECHCORP, clientId: UUID.CLIENT_TECHCORP, status: "approved", content: { title: "Planejamento Tributario", sections: [] }, totalValue: "45000.00", billingType: "success", createdBy: UUID.USER_FERNANDO, approvedBy: UUID.USER_JOSE_RAFAEL },
    ]).onConflictDoNothing();

    // --- BILLING PLANS ---
    console.log("  [7/12] Billing Plans...");
    await db.insert(billingPlans).values([
        { id: UUID.BP_001, caseId: UUID.CASE_001, clientId: UUID.CLIENT_SEQUOIA, type: "fixed", monthlyValue: "11150.00", taxRate: "14.53", billingDay: 1 },
        { id: UUID.BP_002, caseId: UUID.CASE_002, clientId: UUID.CLIENT_TECHCORP, type: "hourly", hourlyRate: "350.00", taxRate: "14.53" },
    ]).onConflictDoNothing();

    // --- PRE-INVOICES ---
    console.log("  [8/12] Pre-Invoices...");
    await db.insert(preInvoices).values([
        { id: UUID.PI_001, caseId: UUID.CASE_001, clientId: UUID.CLIENT_SEQUOIA, billingPlanId: UUID.BP_001, referencePeriod: "2026-02", baseValue: "11379.47", taxValue: "1666.03", totalValue: "13045.51", status: "pending", lineItems: [{ description: "Honorarios Mensais Fevereiro/26", value: 11379.47 }] },
        { id: UUID.PI_002, caseId: UUID.CASE_002, clientId: UUID.CLIENT_TECHCORP, referencePeriod: "2026-02", baseValue: "39256.52", taxValue: "5743.48", totalValue: "45000.00", status: "approved", lineItems: [{ description: "Planejamento Tributario - Parcela Unica", value: 39256.52 }], approvedBy: UUID.USER_JOSE_RAFAEL },
        { id: UUID.PI_003, caseId: UUID.CASE_003, clientId: UUID.CLIENT_LOGISTICA, referencePeriod: "2026-02", baseValue: "7449.35", taxValue: "1090.65", totalValue: "8540.00", status: "draft", lineItems: [{ description: "Consultoria Trabalhista HR", value: 7449.35 }] },
    ]).onConflictDoNothing();

    // --- ACCOUNTS PAYABLE ---
    console.log("  [9/12] Accounts Payable...");
    await db.insert(accountsPayable).values([
        { supplierName: "Amazon Web Services (AWS)", category: "Infraestrutura / Servidores", value: "1250.00", dueDate: "2026-03-05", status: "pending", approvalStatus: "pendente", submittedBy: UUID.USER_FERNANDO },
        { supplierName: "WeWork (Escritorio SP)", category: "Aluguel & Condominio", value: "8500.00", dueDate: "2026-03-10", status: "scheduled", approvalStatus: "aprovado", submittedBy: UUID.USER_FERNANDO, approvedBy: UUID.USER_JOSE_RAFAEL },
        { supplierName: "Google Workspace", category: "Licencas de Software", value: "850.00", dueDate: "2026-03-01", status: "paid", approvalStatus: "pago", submittedBy: UUID.USER_FERNANDO, approvedBy: UUID.USER_JOSE_RAFAEL },
        { supplierName: "Thomson Reuters (RT)", category: "Assinaturas & Livros", value: "450.00", dueDate: "2026-02-15", status: "overdue", approvalStatus: "pendente", submittedBy: UUID.USER_FERNANDO },
        { supplierName: "Alura Cursos", category: "Treinamento & Capacitacao", value: "2400.00", dueDate: "2026-03-12", status: "pending", approvalStatus: "rejeitado", submittedBy: UUID.USER_FERNANDO, rejectionComment: "Aguardar aprovacao do plano de capacitacao anual antes de contratar" },
    ]).onConflictDoNothing();

    // --- AR TITLES ---
    console.log("  [10/12] AR Titles...");
    await db.insert(arTitles).values([
        { clientId: UUID.CLIENT_SEQUOIA, value: "13045.51", dueDate: "2026-03-10", status: "open", approvalStatus: "pendente", notes: "Honorarios Mensais Fevereiro/26" },
        { clientId: UUID.CLIENT_TECHCORP, value: "45000.00", dueDate: "2026-03-15", status: "open", approvalStatus: "pendente", notes: "Planejamento Tributario - Parcela Unica" },
        { clientId: UUID.CLIENT_LOGISTICA, value: "4500.00", dueDate: "2026-02-20", paidDate: "2026-02-20", paidValue: "4500.00", status: "paid", approvalStatus: "aprovado", notes: "Parecer Trabalhista" },
        { clientId: UUID.CLIENT_METAL_SP, value: "8200.00", dueDate: "2026-03-05", status: "open", approvalStatus: "desconto_solicitado", requestedAction: "desconto", requestedBy: UUID.USER_FERNANDO, notes: "Assessoria Tributaria Jan/26 — Cliente solicitou desconto de 20%" },
        { clientId: UUID.CLIENT_HORIZONTE, value: "3800.00", dueDate: "2026-01-15", status: "overdue", approvalStatus: "baixa_solicitada", requestedAction: "baixa", requestedBy: UUID.USER_FERNANDO, notes: "Consultoria Trabalhista Dez/25 — Cliente em recuperacao judicial" },
    ]).onConflictDoNothing();

    // --- TIME ENTRIES ---
    console.log("  [11/12] Time Entries...");
    await db.insert(timeEntries).values([
        { userId: UUID.USER_CARLOS_OLIVEIRA, caseId: UUID.CASE_001, activityType: "revisao", description: "Revisao dos balancetes mensais e conferencia de IRPJ", durationMinutes: 90, date: "2026-03-01", hourlyRate: "250.00", approvalStatus: "pendente" },
        { userId: UUID.USER_CARLOS_OLIVEIRA, caseId: UUID.CASE_001, activityType: "reuniao", description: "Call mensal com cliente — checkpoint de fechamento", durationMinutes: 45, date: "2026-03-01", hourlyRate: "250.00", approvalStatus: "pendente" },
        { userId: UUID.USER_ANA_SOUZA, caseId: UUID.CASE_002, activityType: "pesquisa", description: "Pesquisa jurisprudencia STJ sobre creditos PIS/COFINS", durationMinutes: 120, date: "2026-03-01", hourlyRate: "280.00", approvalStatus: "aprovado", approvedBy: UUID.USER_JOSE_RAFAEL },
        { userId: UUID.USER_CARLOS_OLIVEIRA, caseId: UUID.CASE_001, activityType: "administrativo", description: "Organizacao de pastas no Drive e atualizacao de status", durationMinutes: 30, date: "2026-03-01", hourlyRate: "250.00", isBillable: false, approvalStatus: "aprovado", approvedBy: UUID.USER_JOSE_RAFAEL },
        { userId: UUID.USER_ANA_SOUZA, caseId: UUID.CASE_002, activityType: "elaboracao", description: "Elaboracao do parecer sobre reorganizacao societaria", durationMinutes: 180, date: "2026-02-28", hourlyRate: "280.00", approvalStatus: "aprovado", approvedBy: UUID.USER_JOSE_RAFAEL },
        { userId: UUID.USER_ANA_SOUZA, caseId: UUID.CASE_003, activityType: "audiencia", description: "Participacao em audiencia de conciliacao — TRT 2a Regiao", durationMinutes: 240, date: "2026-02-27", hourlyRate: "280.00", approvalStatus: "faturado", approvedBy: UUID.USER_JOSE_RAFAEL },
        { userId: UUID.USER_CARLOS_OLIVEIRA, caseId: UUID.CASE_001, activityType: "elaboracao", description: "Elaboracao de relatorio de compliance fiscal Q1", durationMinutes: 150, date: "2026-03-01", hourlyRate: "250.00", approvalStatus: "rejeitado", rejectionComment: "Descricao insuficiente — detalhar escopo do compliance" },
    ]).onConflictDoNothing();

    // --- BANK TRANSACTIONS ---
    console.log("  [12/12] Bank Transactions...");
    await db.insert(bankTransactions).values([
        { bank: "itau", date: "2026-02-03", description: "TED RECEBIDA — GRUPO SEQUOIA PART LTDA", value: "13045.51", type: "C", isReconciled: true },
        { bank: "itau", date: "2026-02-05", description: "PAG BOLETO — AMAZON WEB SERVICES", value: "-1250.00", type: "D", isReconciled: true },
        { bank: "itau", date: "2026-02-07", description: "TED RECEBIDA — TECHCORP BR TECNOLOGIA", value: "45000.00", type: "C", isReconciled: true },
        { bank: "itau", date: "2026-02-10", description: "DEB AUTOMATICO — WEWORK COWORKING SP", value: "-8500.00", type: "D", isReconciled: true },
        { bank: "itau", date: "2026-02-12", description: "PIX RECEBIDO — INDUSTRIA METAL SP LTDA", value: "8200.00", type: "C", isReconciled: false },
        { bank: "itau", date: "2026-02-14", description: "PAG BOLETO — GOOGLE CLOUD PLATFORM", value: "-850.00", type: "D", isReconciled: true },
        { bank: "btg", date: "2026-02-18", description: "TED RECEBIDA — CONSTRUTORA HORIZONTE SA", value: "3800.00", type: "C", isReconciled: false },
        { bank: "itau", date: "2026-02-20", description: "DEB AUTOMATICO — NET VIRTUA INTERNET", value: "-389.90", type: "D", isReconciled: false },
        { bank: "itau", date: "2026-02-25", description: "PAG BOLETO — THOMSON REUTERS BRASIL", value: "-450.00", type: "D", isReconciled: false },
        { bank: "itau", date: "2026-02-28", description: "RENDIMENTO POUPANCA — APLICACAO AUTO", value: "312.45", type: "C", isReconciled: false },
    ]).onConflictDoNothing();

    // --- PARTNERS ---
    await db.insert(partners).values([
        { id: UUID.PARTNER_FERNANDO, userId: UUID.USER_FERNANDO, sharePercentage: "50.00" },
        { id: UUID.PARTNER_JOSE, userId: UUID.USER_JOSE_RAFAEL, sharePercentage: "50.00" },
    ]).onConflictDoNothing();

    console.log("\nSeed complete! All mock data inserted.");
    await client.end();
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
