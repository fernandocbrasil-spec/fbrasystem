// =============================================================================
// PF Advogados ERP — Centralized Mock Data
// TODO: Replace with Drizzle DB queries when database is connected
// =============================================================================

import type { PayableApprovalStatus, ReceivableApprovalStatus, TimeEntryApprovalStatus } from "@/lib/approval/types";

// --- Leads ---
export type MockLead = {
    id: string;
    companyName?: string;
    contactName: string;
    temperature: "frio" | "morno" | "quente";
    value?: string;
    stage: "novo" | "contato_feito" | "proposta_enviada" | "negociacao" | "ganho";
    date: string;
};

export const MOCK_LEADS: MockLead[] = [
    { id: "1", companyName: "TechCorp BR", contactName: "Carlos Silva", temperature: "morno", stage: "novo", date: "01/03/2026" },
    { id: "2", contactName: "Ana Paula Consultoria", temperature: "frio", stage: "novo", date: "28/02/2026" },
    { id: "3", companyName: "Logistica ABC", contactName: "Marcos Torres", temperature: "quente", stage: "contato_feito", date: "27/02/2026" },
    { id: "4", companyName: "Grupo Sequoia", contactName: "Marcelo Furtado", temperature: "quente", value: "R$ 11.150,00/mes", stage: "proposta_enviada", date: "20/02/2026" },
];

// --- Cases ---
export type MockCase = {
    id: string;
    number: string;
    client: string;
    title: string;
    area: string;
    responsible: string;
    status: "Ativo" | "Em Pausa";
    startDate: string;
};

export const MOCK_CASES: MockCase[] = [
    { id: "1", number: "CA-2026-001", client: "Grupo Sequoia", title: "Assessoria Contabil e Fiscal Continua", area: "Tributario / Consultivo", responsible: "Jose Rafael Feiteiro", status: "Ativo", startDate: "01/03/2026" },
    { id: "2", number: "CA-2026-002", client: "TechCorp BR", title: "Planejamento Tributario 2026", area: "Tributario / Planejamento", responsible: "Carlos Oliveira", status: "Ativo", startDate: "25/02/2026" },
    { id: "3", number: "CA-2025-089", client: "Logistica ABC", title: "Revisao de Passivo Trabalhista", area: "Trabalhista", responsible: "Ana Souza", status: "Em Pausa", startDate: "10/11/2025" },
];

// --- Proposals ---
export type MockProposal = {
    id: string;
    title: string;
    client: string;
    status: "Em Revisao" | "Aprovada";
    date: string;
    value: string;
};

export const MOCK_PROPOSALS: MockProposal[] = [
    { id: "1", title: "Assessoria Contabil e Fiscal", client: "Grupo Sequoia", status: "Em Revisao", date: "26/02/2026", value: "R$ 11.150,00" },
    { id: "2", title: "Planejamento Tributario", client: "TechCorp BR", status: "Aprovada", date: "20/02/2026", value: "R$ 45.000,00" },
];

// --- Financeiro (AR) ---
export type MockReceivable = {
    id: string;
    cliente: string;
    descricao: string;
    valor: string;
    vencimento: string;
    status: "A Receber" | "Recebido";
    banco: string;
    approvalStatus: ReceivableApprovalStatus;
    requestedBy?: string;
    requestedAction?: "desconto" | "baixa";
    requestedValue?: string;
    requestedReason?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionComment?: string;
};

export const MOCK_RECEIVABLES: MockReceivable[] = [
    { id: "1", cliente: "Grupo Sequoia", descricao: "Honorarios Mensais Fevereiro/26", valor: "R$ 13.045,51", vencimento: "10/03/2026", status: "A Receber", banco: "Itau", approvalStatus: "pendente" },
    { id: "2", cliente: "TechCorp BR", descricao: "Planejamento Tributario - Parcela Unica", valor: "R$ 45.000,00", vencimento: "15/03/2026", status: "A Receber", banco: "Itau", approvalStatus: "pendente" },
    { id: "3", cliente: "Logistica ABC", descricao: "Parecer Trabalhista", valor: "R$ 4.500,00", vencimento: "20/02/2026", status: "Recebido", banco: "BTG", approvalStatus: "aprovado" },
    { id: "4", cliente: "Industria Metal SP", descricao: "Assessoria Tributaria Jan/26", valor: "R$ 8.200,00", vencimento: "05/03/2026", status: "A Receber", banco: "Itau", approvalStatus: "desconto_solicitado", requestedBy: "Financeiro", requestedAction: "desconto", requestedValue: "R$ 6.560,00", requestedReason: "Cliente solicitou desconto de 20% por atraso na entrega do parecer" },
    { id: "5", cliente: "Construtora Horizonte", descricao: "Consultoria Trabalhista Dez/25", valor: "R$ 3.800,00", vencimento: "15/01/2026", status: "A Receber", banco: "BTG", approvalStatus: "baixa_solicitada", requestedBy: "Financeiro", requestedAction: "baixa", requestedReason: "Cliente em recuperacao judicial — titulo incobravel" },
];

// --- Contas a Pagar (AP) ---
export type MockPayable = {
    id: string;
    fornecedor: string;
    categoria: string;
    valor: string;
    vencimento: string;
    status: "Pendente" | "Agendado" | "Atrasado" | "Pago";
    approvalStatus: PayableApprovalStatus;
    submittedBy?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionComment?: string;
};

export const MOCK_PAYABLES: MockPayable[] = [
    { id: "1", fornecedor: "Amazon Web Services (AWS)", categoria: "Infraestrutura / Servidores", valor: "R$ 1.250,00", vencimento: "05/03/2026", status: "Pendente", approvalStatus: "pendente", submittedBy: "Financeiro" },
    { id: "2", fornecedor: "WeWork (Escritorio SP)", categoria: "Aluguel & Condominio", valor: "R$ 8.500,00", vencimento: "10/03/2026", status: "Agendado", approvalStatus: "aprovado", submittedBy: "Financeiro", approvedBy: "Jose Rafael Feiteiro", approvedAt: "28/02/2026" },
    { id: "3", fornecedor: "Google Workspace", categoria: "Licencas de Software", valor: "R$ 850,00", vencimento: "01/03/2026", status: "Pago", approvalStatus: "pago", submittedBy: "Financeiro", approvedBy: "Jose Rafael Feiteiro", approvedAt: "25/02/2026" },
    { id: "4", fornecedor: "Thomson Reuters (RT)", categoria: "Assinaturas & Livros", valor: "R$ 450,00", vencimento: "15/02/2026", status: "Atrasado", approvalStatus: "pendente", submittedBy: "Financeiro" },
    { id: "5", fornecedor: "Alura Cursos", categoria: "Treinamento & Capacitacao", valor: "R$ 2.400,00", vencimento: "12/03/2026", status: "Pendente", approvalStatus: "rejeitado", submittedBy: "Financeiro", rejectionComment: "Aguardar aprovacao do plano de capacitacao anual antes de contratar" },
];

// --- Faturamento ---
export type MockInvoice = {
    id: string;
    month: string;
    client: string;
    caseName: string;
    value: string;
    status: "Rascunho" | "Pendente Aprovacao" | "Aprovado" | "Faturado" | "Rejeitado" | "Cancelado";
    type: string;
    nfseNumber?: string;
    nfsePdfUrl?: string;
};

export const MOCK_INVOICES: MockInvoice[] = [
    { id: "1", month: "02/2026", client: "Grupo Sequoia", caseName: "Assessoria Contabil e Fiscal", value: "R$ 13.045,51", status: "Pendente Aprovacao", type: "Fixo Mensal" },
    { id: "2", month: "02/2026", client: "TechCorp BR", caseName: "Planejamento Tributario 2026", value: "R$ 45.000,00", status: "Faturado", type: "Exito / Unica" },
    { id: "3", month: "02/2026", client: "Industria Metal SP", caseName: "Consultoria Trabalhista HR", value: "R$ 8.540,00", status: "Rascunho", type: "Horas (Time & Material)" },
];

// --- Workflows ---
export type MockWorkflow = {
    id: string;
    code: string;
    name: string;
    entity: string;
    responsible: string;
    completedSteps: number;
    totalSteps: number;
    dueDate: string;
    status: "Atrasado" | "Aguardando Aprovacao" | "Em Andamento" | "Concluido";
};

export const MOCK_WORKFLOWS: MockWorkflow[] = [
    { id: "1", code: "WF-2026-001", name: "Onboarding de Cliente", entity: "Grupo Sequoia", responsible: "Jose Rafael Feiteiro", completedSteps: 2, totalSteps: 5, dueDate: "06/03/2026", status: "Em Andamento" },
    { id: "2", code: "WF-2026-002", name: "Aprovacao de Proposta", entity: "TechCorp BR", responsible: "Ana Souza", completedSteps: 1, totalSteps: 3, dueDate: "28/02/2026", status: "Aguardando Aprovacao" },
    { id: "3", code: "WF-2026-003", name: "Fechamento Contabil Mensal", entity: "Competencia Fev/2026", responsible: "Financeiro", completedSteps: 3, totalSteps: 6, dueDate: "01/03/2026", status: "Atrasado" },
    { id: "4", code: "WF-2026-004", name: "Encerramento de Caso", entity: "Logistica ABC", responsible: "Ana Souza", completedSteps: 5, totalSteps: 5, dueDate: "17/02/2026", status: "Concluido" },
];

// --- Time Entries ---
export type MockTimeEntry = {
    id: string;
    caseNumber: string;
    caseTitle: string;
    clientName: string;
    activityType: "reuniao" | "pesquisa" | "elaboracao" | "revisao" | "audiencia" | "administrativo";
    description: string;
    durationMinutes: number;
    date: string;
    startTime: string;
    isBillable: boolean;
    approvalStatus: TimeEntryApprovalStatus;
    submittedBy?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionComment?: string;
};

export const MOCK_TIME_ENTRIES: MockTimeEntry[] = [
    { id: "1", caseNumber: "CA-2026-001", caseTitle: "Assessoria Contabil e Fiscal", clientName: "Grupo Sequoia", activityType: "revisao", description: "Revisao dos balancetes mensais e conferencia de IRPJ", durationMinutes: 90, date: "2026-03-01", startTime: "09:00", isBillable: true, approvalStatus: "pendente", submittedBy: "Carlos Oliveira" },
    { id: "2", caseNumber: "CA-2026-001", caseTitle: "Assessoria Contabil e Fiscal", clientName: "Grupo Sequoia", activityType: "reuniao", description: "Call mensal com cliente — checkpoint de fechamento", durationMinutes: 45, date: "2026-03-01", startTime: "11:00", isBillable: true, approvalStatus: "pendente", submittedBy: "Carlos Oliveira" },
    { id: "3", caseNumber: "CA-2026-002", caseTitle: "Planejamento Tributario 2026", clientName: "TechCorp BR", activityType: "pesquisa", description: "Pesquisa jurisprudencia STJ sobre creditos PIS/COFINS", durationMinutes: 120, date: "2026-03-01", startTime: "14:00", isBillable: true, approvalStatus: "aprovado", submittedBy: "Ana Souza", approvedBy: "Jose Rafael Feiteiro", approvedAt: "01/03/2026" },
    { id: "4", caseNumber: "CA-2026-001", caseTitle: "Assessoria Contabil e Fiscal", clientName: "Grupo Sequoia", activityType: "administrativo", description: "Organizacao de pastas no Drive e atualizacao de status", durationMinutes: 30, date: "2026-03-01", startTime: "17:00", isBillable: false, approvalStatus: "aprovado", submittedBy: "Carlos Oliveira", approvedBy: "Jose Rafael Feiteiro", approvedAt: "01/03/2026" },
    { id: "5", caseNumber: "CA-2026-002", caseTitle: "Planejamento Tributario 2026", clientName: "TechCorp BR", activityType: "elaboracao", description: "Elaboracao do parecer sobre reorganizacao societaria", durationMinutes: 180, date: "2026-02-28", startTime: "09:00", isBillable: true, approvalStatus: "aprovado", submittedBy: "Ana Souza", approvedBy: "Jose Rafael Feiteiro", approvedAt: "28/02/2026" },
    { id: "6", caseNumber: "CA-2025-089", caseTitle: "Revisao de Passivo Trabalhista", clientName: "Logistica ABC", activityType: "audiencia", description: "Participacao em audiencia de conciliacao — TRT 2a Regiao", durationMinutes: 240, date: "2026-02-27", startTime: "13:00", isBillable: true, approvalStatus: "faturado", submittedBy: "Ana Souza", approvedBy: "Jose Rafael Feiteiro", approvedAt: "27/02/2026" },
    { id: "7", caseNumber: "CA-2026-001", caseTitle: "Assessoria Contabil e Fiscal", clientName: "Grupo Sequoia", activityType: "elaboracao", description: "Elaboracao de relatorio de compliance fiscal Q1", durationMinutes: 150, date: "2026-03-01", startTime: "08:00", isBillable: true, approvalStatus: "rejeitado", submittedBy: "Carlos Oliveira", rejectionComment: "Descricao insuficiente — detalhar escopo do compliance" },
];

// --- Case selector (for timer) ---
export const MOCK_CASE_OPTIONS = [
    { id: "c-001", number: "CA-2026-001", title: "Assessoria Contabil e Fiscal", client: "Grupo Sequoia" },
    { id: "c-002", number: "CA-2026-002", title: "Planejamento Tributario 2026", client: "TechCorp BR" },
    { id: "c-003", number: "CA-2025-089", title: "Revisao de Passivo Trabalhista", client: "Logistica ABC" },
];

// --- Unified Pending Approvals (for Dashboard widget) ---
export type MockPendingApproval = {
    id: string;
    entityType: "payable" | "receivable" | "time_entry" | "proposal" | "pre_invoice" | "distribution";
    label: string;
    client: string;
    value: string;
    date: string;
};

export const MOCK_PENDING_APPROVALS: MockPendingApproval[] = [
    { id: "ap-1", entityType: "payable", label: "Amazon Web Services (AWS)", client: "Infraestrutura", value: "R$ 1.250", date: "05/03/2026" },
    { id: "ap-4", entityType: "payable", label: "Thomson Reuters (RT)", client: "Assinaturas", value: "R$ 450", date: "15/02/2026" },
    { id: "ar-4", entityType: "receivable", label: "Desconto — Industria Metal SP", client: "Industria Metal SP", value: "R$ 8.200", date: "05/03/2026" },
    { id: "ar-5", entityType: "receivable", label: "Baixa — Construtora Horizonte", client: "Construtora Horizonte", value: "R$ 3.800", date: "15/01/2026" },
    { id: "te-1", entityType: "time_entry", label: "Revisao balancetes (1h30)", client: "Grupo Sequoia", value: "01:30", date: "01/03/2026" },
    { id: "te-2", entityType: "time_entry", label: "Call mensal cliente (0h45)", client: "Grupo Sequoia", value: "00:45", date: "01/03/2026" },
    { id: "prop-1", entityType: "proposal", label: "Assessoria Contabil e Fiscal", client: "Grupo Sequoia", value: "R$ 11.150", date: "26/02/2026" },
    { id: "pf-1", entityType: "pre_invoice", label: "Pre-Fatura Fev/26", client: "Nexus Participacoes", value: "R$ 18.500", date: "26/02/2026" },
];

// --- Conciliacao Bancaria ---
export type MockBankEntry = {
    id: string;
    date: string;
    description: string;
    value: number;
    balance: number;
    reconciled: boolean;
    matchedPayableId?: string;
    matchedReceivableId?: string;
};

export const MOCK_BANK_ENTRIES: MockBankEntry[] = [
    { id: "bk-1", date: "2026-02-03", description: "TED RECEBIDA — GRUPO SEQUOIA PART LTDA", value: 13045.51, balance: 145320.51, reconciled: true, matchedReceivableId: "1" },
    { id: "bk-2", date: "2026-02-05", description: "PAG BOLETO — AMAZON WEB SERVICES", value: -1250.00, balance: 144070.51, reconciled: true, matchedPayableId: "1" },
    { id: "bk-3", date: "2026-02-07", description: "TED RECEBIDA — TECHCORP BR TECNOLOGIA", value: 45000.00, balance: 189070.51, reconciled: true, matchedReceivableId: "2" },
    { id: "bk-4", date: "2026-02-10", description: "DEB AUTOMATICO — WEWORK COWORKING SP", value: -8500.00, balance: 180570.51, reconciled: true, matchedPayableId: "2" },
    { id: "bk-5", date: "2026-02-12", description: "PIX RECEBIDO — INDUSTRIA METAL SP LTDA", value: 8200.00, balance: 188770.51, reconciled: false },
    { id: "bk-6", date: "2026-02-14", description: "PAG BOLETO — GOOGLE CLOUD PLATFORM", value: -850.00, balance: 187920.51, reconciled: true, matchedPayableId: "3" },
    { id: "bk-7", date: "2026-02-18", description: "TED RECEBIDA — CONSTRUTORA HORIZONTE SA", value: 3800.00, balance: 191720.51, reconciled: false },
    { id: "bk-8", date: "2026-02-20", description: "DEB AUTOMATICO — NET VIRTUA INTERNET", value: -389.90, balance: 191330.61, reconciled: false },
    { id: "bk-9", date: "2026-02-25", description: "PAG BOLETO — THOMSON REUTERS BRASIL", value: -450.00, balance: 190880.61, reconciled: false },
    { id: "bk-10", date: "2026-02-28", description: "RENDIMENTO POUPANCA — APLICACAO AUTO", value: 312.45, balance: 191193.06, reconciled: false },
];

// --- Notifications (Dashboard) ---

export type MockNotification = {
    id: string;
    tipo: "warning" | "info" | "success";
    mensagem: string;
    hora: string;
};

export const MOCK_NOTIFICATIONS: MockNotification[] = [
    { id: "n1", tipo: "warning", mensagem: "Proposta 'TechCorp BR' aguardando aprovacao ha 3 dias", hora: "Hoje, 10:45" },
    { id: "n2", tipo: "success", mensagem: "NFSe #4092 emitida com sucesso", hora: "Hoje, 09:12" },
    { id: "n3", tipo: "info", mensagem: "Backup automatico concluido", hora: "Ontem, 03:00" },
    { id: "n4", tipo: "warning", mensagem: "Certificado Digital vence em 30 dias", hora: "27/02" },
    { id: "n5", tipo: "info", mensagem: "Novo lead atribuido: Grupo Beta S.A.", hora: "26/02" },
];

// --- Events / Agenda (Dashboard) ---

export type MockEvent = {
    id: string;
    data: string;
    titulo: string;
    tipo: "audiencia" | "reuniao" | "prazo" | "vencimento";
};

export const MOCK_EVENTS: MockEvent[] = [
    { id: "e1", data: "2026-03-01", titulo: "Audiencia TechCorp — 2a Vara Civel", tipo: "audiencia" },
    { id: "e2", data: "2026-03-03", titulo: "Reuniao alinhamento Nexus Participacoes", tipo: "reuniao" },
    { id: "e3", data: "2026-03-05", titulo: "Prazo recurso — Processo 0012345", tipo: "prazo" },
    { id: "e4", data: "2026-03-10", titulo: "Vencimento NFSe lote Marco", tipo: "vencimento" },
    { id: "e5", data: "2026-03-15", titulo: "Deadline proposta Grupo Alfa", tipo: "prazo" },
    { id: "e6", data: "2026-03-20", titulo: "Reuniao socios — planejamento Q2", tipo: "reuniao" },
];
