# SYSTEM BASELINE – V1
Status: CONGELADO
Objetivo: Documentar exatamente o que está implementado após commit atual.
Regra: Nenhuma alteração estrutural deve ser sugerida sem justificativa crítica.

---

# 1. VISÃO GERAL DO SISTEMA

## 1.1 Objetivo do Sistema

ERP interno para o escritório Peixoto Feiteiro Advogados, cobrindo gestão de leads/CRM, propostas comerciais, casos jurídicos, controle de horas, faturamento, contas a pagar/receber, fluxo de caixa (DRE), cofre dos sócios e workflows operacionais. O público é exclusivamente a equipe interna (sócios, advogados, financeiro, administrativo). O escopo atual é um **frontend completo com dados mock** — toda a UI está funcional, mas nenhuma página se conecta ao banco de dados ainda.

## 1.2 Stack Tecnológica
- **Frontend:** Next.js 16.1.6 (App Router, Turbopack), React 19.2.3, TypeScript 5
- **Estilo:** Tailwind CSS v4 (`@theme inline`), fontes Inter / JetBrains Mono / Zen Dots
- **Backend:** Next.js Server Components + Server Actions (stubs definidos, não conectados)
- **Banco:** PostgreSQL via Drizzle ORM 0.45.1 (schema completo com 24 tabelas, **não conectado**)
- **Autenticação:** NextAuth v5 beta (Credentials mock, preparado para Azure AD)
- **Infra:** Localhost (dev), sem deploy em produção. CSP + HSTS + security headers configurados no `next.config.ts`
- **Testes:** Vitest 4.0.18 (79 testes passando)
- **Ícones:** lucide-react 0.575.0

---

# 2. ARQUITETURA DE DADOS (IMPLEMENTADA)

## 2.1 Entidades Criadas

Schema completo em `src/lib/db/schema.ts` (PostgreSQL + Drizzle ORM). Todas as tabelas usam UUID como primary key.

### roles
- `id` (uuid, PK)
- `name` (varchar 50, unique) — socio, advogado, financeiro, admin
- `permissions` (jsonb, default {})

### users
- `id` (uuid, PK)
- `email` (varchar 255, unique, not null)
- `name` (varchar 255, not null)
- `azure_id` (varchar 255, unique) — para integração Azure AD
- `role_id` (uuid, FK → roles)
- `avatar_url` (text)
- `hourly_rate` (decimal 10,2, default 0)
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

### leads
- `id` (uuid, PK)
- `company_name` (varchar 255)
- `contact_name` (varchar 255, not null)
- `contact_email` (varchar 255)
- `contact_phone` (varchar 50)
- `origin` (varchar 100)
- `responsible_id` (uuid, FK → users)
- `temperature` (varchar 20, default "morno") — quente/morno/frio
- `probability` (integer, default 50)
- `status` (varchar 50, default "novo")
- `next_steps` (text)
- `follow_up_date` (date)
- `notes` (text)
- `metadata` (jsonb, default {})
- `created_at`, `updated_at` (timestamptz)

### meetings
- `id` (uuid, PK)
- `lead_id` (uuid, FK → leads)
- `case_id` (uuid, FK → cases)
- `fireflies_id` (varchar 255) — integração Fireflies.ai
- `title` (varchar 255)
- `date` (timestamptz)
- `transcript` (text)
- `ai_summary` (text)
- `ai_brief` (jsonb)
- `participants` (jsonb)
- `recording_url` (text)
- `created_at` (timestamptz)

### proposals
- `id` (uuid, PK)
- `lead_id` (uuid, FK → leads)
- `client_id` (uuid, FK → clients)
- `version` (integer, default 1)
- `status` (varchar 50, default "draft") — draft/sent/approved/rejected
- `template_id` (varchar 100)
- `content` (jsonb, not null)
- `total_value` (decimal 12,2)
- `billing_type` (varchar 50)
- `valid_until` (date)
- `approved_by` (uuid, FK → users)
- `approved_at` (timestamptz)
- `pdf_url` (text)
- `created_by` (uuid, FK → users)
- `created_at`, `updated_at` (timestamptz)

### proposal_versions
- `id` (uuid, PK)
- `proposal_id` (uuid, FK → proposals)
- `version` (integer, not null)
- `content` (jsonb, not null)
- `changed_by` (uuid, FK → users)
- `change_reason` (text)
- `created_at` (timestamptz)

### clients
- `id` (uuid, PK)
- `company_name` (varchar 255, not null)
- `trade_name` (varchar 255)
- `cnpj` (varchar 18)
- `cpf` (varchar 14)
- `address` (jsonb)
- `contact_name` (varchar 255)
- `contact_email` (varchar 255)
- `contact_phone` (varchar 50)
- `lead_id` (uuid, FK → leads) — convertido de
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

### cases
- `id` (uuid, PK)
- `client_id` (uuid, FK → clients, not null)
- `title` (varchar 255, not null)
- `description` (text)
- `case_number` (varchar 50)
- `status` (varchar 50, default "active")
- `area` (varchar 100) — área de atuação
- `responsible_id` (uuid, FK → users)
- `cost_center` (varchar 50)
- `drive_folder_id` (varchar 255)
- `drive_folder_url` (text)
- `proposal_id` (uuid, FK → proposals)
- `started_at`, `closed_at` (date)
- `created_at`, `updated_at` (timestamptz)

### case_members
- `id` (uuid, PK)
- `case_id` (uuid, FK → cases, not null)
- `user_id` (uuid, FK → users, not null)
- `role` (varchar 50, default "member")
- `added_at` (timestamptz)

### tasks
- `id` (uuid, PK)
- `case_id` (uuid, FK → cases, not null)
- `title` (varchar 255, not null)
- `description` (text)
- `status` (varchar 50, default "todo") — todo/in_progress/done
- `priority` (varchar 20, default "medium")
- `assignee_id` (uuid, FK → users)
- `due_date` (date)
- `checklist` (jsonb, default [])
- `attachments` (jsonb, default [])
- `position` (integer, default 0)
- `completed_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

### time_entries
- `id` (uuid, PK)
- `user_id` (uuid, FK → users, not null)
- `case_id` (uuid, FK → cases, not null)
- `task_id` (uuid, FK → tasks)
- `activity_type` (varchar 100, not null)
- `description` (text, not null)
- `duration_minutes` (integer, not null)
- `date` (date, not null)
- `hourly_rate` (decimal 10,2)
- `is_billable` (boolean, default true)
- `pre_invoice_id` (uuid, FK → pre_invoices)
- `approval_status` (varchar 50, default "pendente")
- `submitted_at` (timestamptz, default now)
- `approved_by` (uuid, FK → users)
- `approved_at` (timestamptz)
- `rejection_comment` (text)
- `created_at`, `updated_at` (timestamptz)

### billing_plans
- `id` (uuid, PK)
- `case_id` (uuid, FK → cases, not null)
- `client_id` (uuid, FK → clients, not null)
- `type` (varchar 50, not null) — fixed/hourly/success-based/mixed
- `monthly_value` (decimal 12,2)
- `hourly_rate` (decimal 10,2)
- `monthly_hours_included` (integer)
- `excess_rate` (decimal 10,2)
- `success_percentage` (decimal 5,2)
- `tax_rate` (decimal 5,2, default 14.53)
- `billing_day` (integer, default 1)
- `payment_terms` (integer, default 30)
- `is_active` (boolean, default true)
- `notes` (text)
- `created_at`, `updated_at` (timestamptz)

### pre_invoices
- `id` (uuid, PK)
- `case_id` (uuid, FK → cases, not null)
- `client_id` (uuid, FK → clients, not null)
- `billing_plan_id` (uuid, FK → billing_plans)
- `reference_period` (varchar 7) — YYYY-MM
- `base_value` (decimal 12,2, not null)
- `tax_value` (decimal 12,2, default 0)
- `total_value` (decimal 12,2, not null)
- `status` (varchar 50, default "draft") — draft/pending/approved/invoiced
- `line_items` (jsonb, not null)
- `approved_by` (uuid, FK → users)
- `approved_at` (timestamptz)
- `notes` (text)
- `created_at`, `updated_at` (timestamptz)

### invoices
- `id` (uuid, PK)
- `pre_invoice_id` (uuid, FK → pre_invoices)
- `client_id` (uuid, FK → clients, not null)
- `case_id` (uuid, FK → cases)
- `nfse_number` (varchar 50)
- `nfse_verification_code` (varchar 100)
- `nfse_xml` (text)
- `nfse_pdf_url` (text)
- `issue_date` (date, not null)
- `value` (decimal 12,2, not null)
- `tax_value` (decimal 12,2)
- `status` (varchar 50, default "pending") — pending/sent/paid/cancelled
- `provider_response` (jsonb)
- `sent_to_client_at` (timestamptz)
- `created_at` (timestamptz)

### ar_titles (contas a receber)
- `id` (uuid, PK)
- `invoice_id` (uuid, FK → invoices)
- `client_id` (uuid, FK → clients, not null)
- `case_id` (uuid, FK → cases)
- `value` (decimal 12,2, not null)
- `due_date` (date, not null)
- `paid_date` (date)
- `paid_value` (decimal 12,2)
- `status` (varchar 50, default "open") — open/partial/paid/overdue/cancelled
- `bank_transaction_id` (uuid, FK → bank_transactions)
- `approval_status` (varchar 50, default "pendente")
- `requested_action` (varchar 50)
- `requested_by` (uuid, FK → users)
- `approved_by` (uuid, FK → users)
- `approved_at` (timestamptz)
- `rejection_comment` (text)
- `notes` (text)
- `created_at`, `updated_at` (timestamptz)

### accounts_payable (contas a pagar)
- `id` (uuid, PK)
- `supplier_id` (varchar 255)
- `supplier_name` (varchar 255, not null)
- `category` (varchar 100)
- `value` (decimal 12,2, not null)
- `due_date` (date, not null)
- `paid_date` (date)
- `status` (varchar 50, default "pending")
- `approval_status` (varchar 50, default "pendente")
- `submitted_by` (uuid, FK → users)
- `approved_by` (uuid, FK → users)
- `approved_at` (timestamptz)
- `rejection_comment` (text)
- `notes` (text)
- `created_at`, `updated_at` (timestamptz)

### bank_transactions
- `id` (uuid, PK)
- `bank` (varchar 50, default "itau")
- `account` (varchar 50)
- `date` (date, not null)
- `description` (text)
- `value` (decimal 12,2, not null)
- `type` (varchar 10) — D (débito) ou C (crédito)
- `document_number` (varchar 100)
- `is_reconciled` (boolean, default false)
- `import_batch` (varchar 50)
- `raw_data` (jsonb)
- `created_at` (timestamptz)

### reconciliation_matches
- `id` (uuid, PK)
- `bank_transaction_id` (uuid, FK → bank_transactions)
- `ar_title_id` (uuid, FK → ar_titles)
- `match_type` (varchar 50) — exact/partial/suggested
- `confidence` (decimal 5,2)
- `matched_by` (uuid, FK → users)
- `matched_at` (timestamptz)
- `notes` (text)

### cashflow_daily
- `id` (uuid, PK)
- `date` (date, unique, not null)
- `opening_balance` (decimal 14,2)
- `total_receipts` (decimal 14,2, default 0)
- `total_payments` (decimal 14,2, default 0)
- `closing_balance` (decimal 14,2)
- `projected_receipts` (decimal 14,2, default 0)
- `projected_payments` (decimal 14,2, default 0)
- `notes` (text)
- `updated_at` (timestamptz)

### partners
- `id` (uuid, PK)
- `user_id` (uuid, FK → users, not null)
- `share_percentage` (decimal 5,2, not null)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

### partner_ledger
- `id` (uuid, PK)
- `partner_id` (uuid, FK → partners, not null)
- `type` (varchar 50, not null) — distribution/adjustment/contribution
- `value` (decimal 12,2, not null)
- `balance_after` (decimal 14,2)
- `description` (text)
- `approved_by` (uuid, FK → users)
- `reference_date` (date)
- `created_at` (timestamptz)

### distributions
- `id` (uuid, PK)
- `period` (varchar 7) — YYYY-MM
- `total_value` (decimal 12,2, not null)
- `status` (varchar 50, default "simulated") — simulated/pending/approved/executed
- `min_cash_rule` (decimal 12,2)
- `cash_after` (decimal 14,2)
- `breakdown` (jsonb)
- `approved_by` (uuid, FK → users)
- `approved_at` (timestamptz)
- `created_at` (timestamptz)

### audit_logs
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `action` (varchar 100, not null)
- `entity_type` (varchar 100)
- `entity_id` (uuid)
- `old_data` (jsonb)
- `new_data` (jsonb)
- `ip_address` (text)
- `created_at` (timestamptz)

### exception_queue
- `id` (uuid, PK)
- `type` (varchar 100, not null)
- `source` (varchar 100)
- `data` (jsonb, not null)
- `status` (varchar 50, default "pending")
- `resolved_by` (uuid, FK → users)
- `resolved_at` (timestamptz)
- `notes` (text)
- `created_at` (timestamptz)

### drive_folders
- `id` (uuid, PK)
- `case_id` (uuid, FK → cases)
- `client_id` (uuid, FK → clients)
- `folder_id` (varchar 255, not null)
- `folder_url` (text)
- `folder_path` (text)
- `created_at` (timestamptz)

### rules (configurações do sistema)
- `id` (uuid, PK)
- `key` (varchar 100, unique, not null)
- `value` (jsonb, not null)
- `description` (text)
- `updated_by` (uuid, FK → users)
- `updated_at` (timestamptz)

---

## 2.2 Relacionamentos Implementados

Hierarquia principal:

```
Lead → (converte em) → Cliente → Caso → Tarefa
                                    ↓
                              Time Entry → Pré-Fatura → Invoice → AR Title
                                                                      ↓
                                                              Bank Transaction
```

**Regras de integridade no schema:**
- Caso **não pode existir** sem Cliente (`client_id` NOT NULL)
- Cliente **pode existir** sem Lead (campo `lead_id` é opcional)
- Time Entry **requer** User E Case (`user_id` e `case_id` NOT NULL)
- Task **requer** Case (`case_id` NOT NULL)
- Billing Plan vincula Case + Client (ambos NOT NULL)
- Invoice **requer** Client (`client_id` NOT NULL)
- Contrato (billing_plan) pode vincular múltiplos casos? **Não** — 1 billing_plan = 1 caso

**Relacionamentos secundários:**
- Proposal pode estar ligada a Lead OU Client (ambos opcionais)
- Meeting pode estar ligada a Lead OU Case (ambos opcionais)
- Case Members vincula múltiplos Users a um Case (many-to-many via tabela de junção)

---

# 3. FLUXOS JÁ IMPLEMENTADOS

⚠️ **IMPORTANTE:** Todos os fluxos abaixo funcionam **apenas no frontend com dados mock**. Nenhum persiste no banco de dados.

## 3.1 Fluxo de Lead
- ✅ Cadastro manual via formulário inline (8 campos: nome, responsável, estágio, status, prioridade, prazo, valor, notas)
- ✅ Mudança de status visual (agrupamento por estágio/status/prioridade/responsável)
- ✅ Star, notas inline, seleção em lote, busca e filtros
- ❌ Conversão automática em Cliente (não implementada — só existe botão "Converter" na página de propostas)
- ❌ Nenhuma persistência em banco

## 3.2 Fluxo de Propostas
- ✅ Listagem com filtros e busca
- ✅ Editor de proposta com 4 abas (estrutura criada)
- ✅ Pré-preenchimento de proposta a partir de Lead (via query params)
- ✅ Persistência em localStorage (`pf-proposals`)
- ✅ Botão "Converter para Caso" (navega para `/casos/novo` com query params)
- ❌ Geração real de PDF (gera texto simples)
- ❌ Fluxo de aprovação funcional

## 3.3 Fluxo Operacional (Casos)
- ✅ Listagem de casos com filtros por área e status
- ✅ Formulário de criação de caso (pré-preenchido de proposta)
- ✅ Seleção de área (6 opções) e responsável (4 membros)
- ❌ Criação automática de pastas (Google Drive) — campo existe no schema mas não implementado
- ❌ Integração com Clockify — não existe
- ❌ Pipeline de tarefas dentro do caso — página de detalhe é stub
- ❌ Persistência em banco

## 3.4 Fluxo de Horas (Time Tracking)
- ✅ Timer em tempo real (play/pause/stop) com display HH:MM:SS
- ✅ Lançamento manual (caso, tipo atividade, duração, descrição, faturável)
- ✅ 6 tipos de atividade: Reunião, Pesquisa, Elaboração, Revisão, Audiência, Administrativo
- ✅ KPIs calculados: Horas Hoje, Pendentes Aprovação, Meta Mensal %, Total do Mês
- ❌ Não existe bloqueio para finalizar tarefa sem hora
- ❌ Revisão/aprovação de horas — UI existe mas não persiste
- ❌ Persistência em banco

## 3.5 Fluxo Financeiro

### Faturamento (Pré-Faturas)
- ✅ "Rodar Engine de Fechamento" — gera pré-faturas mock
- ✅ Seletor de período (mês/ano)
- ✅ Fluxo de status: Rascunho → Revisar → Faturado
- ✅ Simulação de NFS-e (download de arquivo texto)
- ❌ Geração automática real de pré-fatura
- ❌ Integração NFS-e real

### Contas a Receber (Financeiro)
- ✅ KPIs: Saldo Projetado, A Receber 30d, Pendente Aprovação, Inadimplência
- ✅ Tabela com status de aprovação
- ✅ Botão importar OFX/CSV (mock)
- ❌ Import real de extratos bancários

### Contas a Pagar
- ✅ Formulário inline para adicionar despesa
- ✅ KPIs calculados em tempo real do state
- ✅ Filtro por categoria (5 categorias)
- ❌ Persistência em banco

### Fluxo de Caixa / DRE
- ✅ Modelo DRE completo com 12 meses (Jan–Dez 2026)
- ✅ Visões: Mensal, Trimestral, Semestral, Anual
- ✅ Toggle previsão (Real vs Previsão com AV% e AH%)
- ✅ Análise de variância (favorável/desfavorável)
- ❌ Dados todos hardcoded

## 3.6 Fluxo de Aprovações
- ✅ Hub unificado (`/aprovacoes`) agrupando todas as entidades
- ✅ Componentes: ApprovalBadge, ApprovalActions, ApprovalDialog, BatchApprovalBar
- ✅ Modal de rejeição com comentário obrigatório
- ✅ Aprovação em lote (batch)
- ❌ Não persiste decisões de aprovação

## 3.7 Cofre dos Sócios
- ✅ Acesso restrito por role (socio/admin)
- ✅ Resultado Líquido YTD, KPIs de faturamento/impostos/custos/margem
- ✅ Rentabilidade por caso (top 3)
- ✅ Simulação de distribuição (pro-labore, dividendos, retenção)
- ✅ Download relatório societário (CSV mock)
- ❌ Dados hardcoded

## 3.8 Workflows
- ✅ 4 templates: Onboarding, Aprovação Proposta, Fechamento Contábil, Encerramento Caso
- ✅ Barra de progresso visual (steps concluídos/total)
- ✅ Filtro por status
- ✅ Geração automática de código WF-YYYY-NNN
- ❌ Automação real (checklist manual apenas)

---

# 4. FUNCIONALIDADES ATIVAS

### UI 100% funcional (com dados mock)
- [x] Dashboard com gráficos (pipeline funnel, cashflow multi-line, agenda, pendências)
- [x] Leads — board estilo Monday.com com grupos colapsáveis, busca, filtros, ações inline
- [x] Propostas — listagem, editor 4-tab, persistência localStorage
- [x] Casos — listagem com filtros, formulário de criação
- [x] Time Tracking — timer em tempo real + lançamento manual
- [x] Faturamento — engine de fechamento, transição de status, download NFS-e mock
- [x] Financeiro (AR) — tabela com aprovação, KPIs
- [x] Contas a Pagar — CRUD inline, KPIs calculados
- [x] Fluxo de Caixa — DRE completo 12 meses, análise de variância
- [x] Aprovações — hub unificado com batch approve/reject
- [x] Cofre — simulação de distribuição, relatório
- [x] Workflows — criação e tracking de progresso
- [x] Configurações — dados da empresa, equipe, cadastros base (localStorage)
- [x] Cadastros/Empresas — CRUD inline
- [x] Autenticação mock + RBAC via middleware (proteção de rotas por role)
- [x] Segurança — CSP, HSTS, X-Frame-Options, Permissions-Policy

### Não implementado (backend)
- [ ] Conexão com banco PostgreSQL (schema existe, conexão não)
- [ ] Server Actions reais (stubs definidos em `src/lib/actions/`)
- [ ] API endpoints CRUD
- [ ] Upload de arquivos (OFX/CSV/PDF)
- [ ] Geração real de PDF (propostas, relatórios)
- [ ] Integração NFS-e (campos no schema, sem provider)
- [ ] Azure AD (NextAuth configurado mas usando mock Credentials)
- [ ] Integração Fireflies.ai (campo no schema, sem API)
- [ ] Integração Google Drive (campo no schema, sem API)
- [ ] Alertas automáticos (email/notificação)
- [ ] Controle automático de cap de horas
- [ ] Conciliação bancária real

### Páginas stub (apenas shell vazio)
- [ ] `/casos/[id]` — detalhe do caso
- [ ] `/propostas/[id]/aprovacao` — aprovação individual
- [ ] `/financeiro/[id]/aprovacao`, `/financeiro/aprovacoes`
- [ ] `/contas-a-pagar/[id]/aprovacao`, `/contas-a-pagar/aprovacoes`
- [ ] `/time-tracking/[id]/aprovacao`, `/time-tracking/aprovacoes`
- [ ] `/faturamento/parametros`
- [ ] `/contabilidade`
- [ ] `/conciliacao-bancaria`
- [ ] `/seguranca-logs`
- [ ] `/cadastros/colaboradores`, `/cadastros/fornecedores`, `/cadastros/socios`, `/cadastros/contas-bancarias`, `/cadastros/centros-de-custo`

---

# 5. LIMITAÇÕES ATUAIS (SEM MUDANÇA ESTRUTURAL)

- **Nenhum dado persiste em banco.** Tudo é estado React (useState) ou localStorage. Refresh da página perde alterações (exceto propostas e configurações que usam localStorage).
- **Horas dependem de cultura manual.** Não há bloqueio para finalizar tarefa sem hora lançada.
- **Não há alertas automáticos.** Nenhuma notificação por email, push ou webhook.
- **Faturamento é simulação.** A "engine de fechamento" gera dados mock, não calcula a partir de horas reais.
- **NFS-e é mock.** Download gera arquivo texto, não XML fiscal real.
- **Aprovações não persistem.** Aprovar/rejeitar atualiza estado local, perde no refresh.
- **Conciliação bancária não funciona.** Botão de import OFX/CSV existe mas não processa.
- **PDF de propostas não é real.** Gera texto simples, não PDF formatado.
- **Controle de cap de horas não existe.** billing_plans tem o campo, mas nada valida.
- **Workflows são manuais.** Progresso é atualizado manualmente, sem automação de steps.
- **Sem audit trail ativo.** Tabela audit_logs existe no schema mas nada grava nela.
- **Autenticação é mock.** Qualquer email/senha loga como "Fernando Brasil" com role "socio".

---

# 6. REGRAS ESTRUTURAIS QUE NÃO DEVEM SER ALTERADAS

🔒 Lead sempre vira Cliente antes de virar Caso (hierarquia Lead → Cliente → Caso).
🔒 Caso sempre pertence a Cliente (`client_id` NOT NULL no schema).
🔒 Time Entry sempre requer User + Case (ambos NOT NULL).
🔒 Task sempre pertence a Case (`case_id` NOT NULL).
🔒 Faturamento (pré-fatura) vinculado ao Caso + Cliente (ambos NOT NULL).
🔒 Billing Plan vincula 1 Caso a 1 Cliente (não é compartilhado).
🔒 UUID como primary key em todas as tabelas.
🔒 Timestamps com timezone em todas as entidades.
🔒 Valores financeiros em decimal(12,2), saldos em decimal(14,2).
🔒 Sistema deve manter simplicidade operacional — flat design, sem over-engineering.
🔒 Interface em português (pt-BR).
🔒 Design tokens: `--pf-blue: #212EC6`, `--pf-black`, `--pf-grey: #BDBDBD`, `--background: #F4F5F7`.

---

# 7. OBJETIVO DO PRÓXIMO CICLO (SEM REFATORAÇÃO)

### Prioridade 1 — Conexão com Banco
- Conectar Drizzle ORM ao PostgreSQL real
- Implementar server actions para CRUD de Leads, Clients, Cases
- Substituir mock data por queries reais

### Prioridade 2 — Autenticação Real
- Configurar Azure AD (Microsoft Entra ID) no NextAuth
- Mapear roles do Azure AD para roles do sistema

### Prioridade 3 — Fluxos Críticos
- Conversão Lead → Cliente → Caso (fluxo end-to-end)
- Lançamento de horas com persistência
- Aprovações com persistência

### Prioridade 4 — Automatizações
- Alertas de vencimento (contas a pagar/receber)
- Geração automática de pré-fatura a partir de horas aprovadas
- Controle de cap por billing plan

### Prioridade 5 — Integrações
- NFS-e (emissão de nota fiscal eletrônica)
- Google Drive (criação automática de pastas por caso)
- Fireflies.ai (transcrição de reuniões)

---

# 8. INSTRUÇÃO PARA ANÁLISE FUTURA

Qualquer sugestão deve:

1. **Não quebrar entidades existentes.** As 24 tabelas do schema são a base.
2. **Não alterar relacionamentos estruturais.** Lead → Cliente → Caso → Task → Time Entry → Faturamento.
3. **Não propor reescrita de banco.** Adicionar colunas/tabelas é OK, alterar existentes requer justificativa.
4. **Priorizar evolução incremental.** Conectar mock → banco antes de adicionar features.
5. **Listar conflitos antes de sugerir mudança.** Se uma alteração impacta múltiplos módulos, documentar.
6. **Manter simplicidade.** Flat design, sem abstrações prematuras, sem over-engineering.
7. **Nunca commitar sem autorização explícita do usuário.**

---

# 9. INVENTÁRIO DE ARQUIVOS-CHAVE

| Arquivo | Propósito |
|---------|-----------|
| `src/lib/db/schema.ts` | Schema completo Drizzle (24 tabelas, 594 linhas) |
| `src/lib/mock-data.ts` | Dados mock centralizados (262 linhas) |
| `src/lib/actions/` | Server actions stubs (não utilizados) |
| `src/auth.ts` | Configuração NextAuth (mock Credentials) |
| `src/middleware.ts` | RBAC por rota |
| `src/app/(dashboard)/layout.tsx` | Layout principal (sidebar + header) |
| `src/components/layout/sidebar.tsx` | Navegação dual-panel (80px + 256px) |
| `src/components/ui/` | Componentes reutilizáveis (Button, Modal, Toast, FilterDropdown, etc.) |
| `src/components/approval/` | Sistema de aprovação (Badge, Actions, Dialog, BatchBar) |
| `src/app/globals.css` | Design tokens Tailwind v4 |
| `next.config.ts` | Security headers (CSP, HSTS) |
| `drizzle.config.ts` | Configuração Drizzle ORM |

---

# 10. MÉTRICAS DO CODEBASE

- **Tabelas no schema:** 24
- **Páginas implementadas:** ~20 (12 com UI completa, 8+ stubs)
- **Componentes reutilizáveis:** 15+
- **Testes:** 79 passando (Vitest)
- **TypeScript:** Strict mode, zero erros de compilação
- **Mock datasets:** 12 constantes em mock-data.ts
- **localStorage keys ativos:** 5 (proposals, settings, cost centers, bank accounts, report views)
