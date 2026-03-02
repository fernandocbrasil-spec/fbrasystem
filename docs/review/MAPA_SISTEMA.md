# PF Advogados ERP — Mapa Visual do Sistema

**Data**: 2026-03-02

---

## 1. Visao Geral — Fluxo de Negocio

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        FLUXO PRINCIPAL DO ESCRITORIO                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  ┌──────────┐     ┌────────────┐     ┌─────────────┐     ┌──────────────┐
  │          │     │            │     │             │     │              │
  │  LEAD    │────▶│  PROPOSTA  │────▶│  CLIENTE +  │────▶│  EXECUCAO    │
  │  (CRM)   │     │  (Editor)  │     │  CASO       │     │  (Tarefas +  │
  │          │     │            │     │             │     │   Horas)     │
  └──────────┘     └────────────┘     └─────────────┘     └──────┬───────┘
       │                │  ▲                │                     │
       │                │  │ Aprovacao      │                     │
       │                ▼  │                │                     ▼
       │           ┌────────────┐           │              ┌──────────────┐
       │           │  APROVACAO │           │              │ FATURAMENTO  │
       │           │  Proposta  │           │              │ (Engine)     │
       │           └────────────┘           │              └──────┬───────┘
       │                                    │                     │
       │                                    │                     ▼
       │                                    │              ┌──────────────┐
       │                                    │              │ PRE-FATURA   │
       │                                    │              │ → APROVACAO  │
       │                                    │              │ → NFSe       │
       │                                    │              └──────┬───────┘
       │                                    │                     │
       │                                    ▼                     ▼
       │                              ┌───────────┐       ┌──────────────┐
       │                              │ CONTAS A  │       │ CONTAS A     │
       │                              │ PAGAR     │       │ RECEBER      │
       │                              │ (Despesas)│       │ (Receitas)   │
       │                              └─────┬─────┘       └──────┬───────┘
       │                                    │                     │
       │                                    │  ┌─────────────┐    │
       │                                    └─▶│ CONCILIACAO │◀───┘
       │                                       │ BANCARIA    │
       │                                       └──────┬──────┘
       │                                              │
       ▼                                              ▼
  ┌──────────┐                                 ┌──────────────┐
  │ DASHBOARD│◀────────────────────────────────│ FLUXO DE     │
  │ (Home)   │                                 │ CAIXA        │
  └──────────┘                                 └──────────────┘
                                                      │
                                                      ▼
                                               ┌──────────────┐
                                               │ COFRE DOS    │
                                               │ SOCIOS       │
                                               └──────────────┘
```

---

## 2. Mapa de Rotas e Modulos

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        ARVORE DE ROTAS (35 paginas)                         ║
╚═══════════════════════════════════════════════════════════════════════════════╝

src/app/
├── login/page.tsx .......................... Autenticacao (mock)
├── page.tsx ............................... Redirect → /dashboard
│
└── (dashboard)/ ........................... Layout: Sidebar + Header
    │
    ├── dashboard/page.tsx ................. Portal Home
    │
    ├── ─── COMERCIAL & CRM ───────────────────────────────────
    ├── leads/page.tsx ..................... Pipeline de Leads
    ├── propostas/
    │   ├── page.tsx ....................... Lista de Propostas
    │   ├── nova/page.tsx ................. Editor 4-tabs
    │   └── [id]/aprovacao/page.tsx ....... Aprovar → Gerar Caso
    │
    ├── ─── OPERACIONAL ────────────────────────────────────────
    ├── casos/
    │   ├── page.tsx ....................... Lista de Casos
    │   └── [id]/page.tsx ................. Detalhe (tarefas, horas, docs)
    ├── time-tracking/
    │   ├── page.tsx ....................... Apontamento de Horas
    │   ├── aprovacoes/page.tsx ........... Fila de Aprovacao
    │   └── [id]/aprovacao/page.tsx ....... Detalhe Aprovacao
    ├── workflows/page.tsx ................. Motor de Regras
    │
    ├── ─── FINANCEIRO ─────────────────────────────────────────
    ├── financeiro/
    │   ├── page.tsx ....................... Contas a Receber
    │   ├── aprovacoes/page.tsx ........... Aprovacao Descontos/Baixas
    │   └── [id]/aprovacao/page.tsx ....... Detalhe Aprovacao
    ├── contas-a-pagar/
    │   ├── page.tsx ....................... Lista de Despesas
    │   ├── aprovacoes/page.tsx ........... Fila Aprovacao (com batch)
    │   └── [id]/aprovacao/page.tsx ....... Detalhe Aprovacao
    ├── faturamento/
    │   ├── page.tsx ....................... Engine de Faturamento
    │   └── parametros/page.tsx ........... Planos de Billing
    ├── fluxo-de-caixa/page.tsx ........... Grafico DRE
    ├── conciliacao-bancaria/page.tsx ...... Matching Bancario
    ├── contabilidade/page.tsx ............. Balancete (placeholder)
    │
    ├── ─── CADASTROS ──────────────────────────────────────────
    ├── cadastros/
    │   ├── page.tsx ....................... Redirect → /empresas
    │   ├── empresas/page.tsx ............. CRUD + filtro Tipo
    │   ├── socios/page.tsx ............... CRUD + busca
    │   ├── colaboradores/page.tsx ........ CRUD + filtros Depto/Status
    │   ├── centros-de-custo/page.tsx ..... CRUD + filtro Tipo
    │   ├── contas-bancarias/page.tsx ..... CRUD + filtro Tipo
    │   └── fornecedores/page.tsx ......... CRUD + filtro Categoria
    │
    ├── ─── ADMINISTRACAO ──────────────────────────────────────
    ├── aprovacoes/page.tsx ................ Hub Global (todos modulos)
    ├── cofre/page.tsx ..................... Cofre dos Socios [RBAC]
    ├── seguranca-logs/page.tsx ........... Audit Logs (placeholder)
    └── configuracoes/page.tsx ............. Config Sistema [RBAC]
```

---

## 3. Modelo de Dados — Relacoes entre Tabelas

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                  SCHEMA (27 tabelas — Drizzle ORM / PostgreSQL)             ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                                 ┌────────┐
                                 │ roles  │
                                 └───┬────┘
                                     │ 1:N
                                     ▼
┌────────┐   1:N    ┌───────────────────────────────────┐
│ leads  │─────────▶│              users                │◀─── (16 FKs apontam aqui)
└───┬────┘          └───────────────────────────────────┘
    │                    │           │            │
    │ 1:N                │ 1:N       │ 1:N        │ 1:N
    ▼                    ▼           ▼            ▼
┌──────────┐      ┌──────────┐  ┌────────┐  ┌────────────┐
│ meetings │      │ proposals│  │  tasks │  │ timeEntries│
└──────────┘      └────┬─────┘  └───┬────┘  └─────┬──────┘
    ▲                  │            │              │
    │                  │ 1:N        │              │
    │           ┌──────▼──────┐     │              │
    │           │ proposal    │     │              │
    │           │ Versions    │     │              │
    │           └─────────────┘     │              │
    │                               │              │
    │   ┌────────┐                  │              │
    │   │clients │◀── leadId ──── leads            │
    │   └───┬────┘                  │              │
    │       │                       │              │
    │       │ 1:N (8 FKs)          │              │
    │       ▼                       │              │
    │   ┌────────────┐              │              │
    └───│   cases    │◀── proposalId ── proposals  │
        └────┬───────┘                             │
             │                                     │
             │ (9 FKs apontam aqui)                │
             │                                     │
     ┌───────┼──────────┬──────────┬───────────┐   │
     │       │          │          │           │   │
     ▼       ▼          ▼          ▼           ▼   │
┌────────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌──────┐│
│case    │ │tasks │ │billing │ │pre     │ │drive ││
│Members │ │      │ │Plans   │ │Invoices│ │Folder││
└────────┘ └──┬───┘ └───┬────┘ └───┬────┘ └──────┘│
              │         │          │               │
              │         │          │ billingPlanId  │
              │         │          │◀──────────────┘
              │         │          │  preInvoiceId
              │         │          │◀─── timeEntries
              ▼         │          │
         timeEntries    │          ▼
          (taskId)      │    ┌──────────┐
                        │    │ invoices │
                        │    └────┬─────┘
                        │         │
                        │         ▼
                        │    ┌──────────┐      ┌──────────────────┐
                        │    │ arTitles │◀────▶│ bankTransactions │
                        │    │ (C.Rec.) │      └────────┬─────────┘
                        │    └──────────┘               │
                        │                               ▼
                        │                    ┌─────────────────────┐
                        │                    │reconciliationMatches│
                        │                    └─────────────────────┘
                        │
                        ▼
              ┌────────────────┐
              │accountsPayable │ (Contas a Pagar)
              └────────────────┘


─── TABELAS INDEPENDENTES ────────────────────────────

┌──────────┐   ┌──────────────┐   ┌───────────────┐
│ partners │   │ cashflowDaily│   │  auditLogs    │
└────┬─────┘   └──────────────┘   └───────────────┘
     │ 1:N
     ▼
┌──────────────┐   ┌───────────────┐   ┌───────┐
│partnerLedger │   │exceptionQueue │   │ rules │
└──────────────┘   └───────────────┘   └───────┘
     │
     ▼
┌───────────────┐
│ distributions │
└───────────────┘
```

---

## 4. Intersecoes entre Modulos

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║              QUEM USA O QUE — Entidades Compartilhadas                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝


                    ┌─────────────────────────┐
                    │         CASES           │  ← Entidade MAIS central
                    │    (9 FKs apontam)      │     do sistema inteiro
                    └────────────┬────────────┘
                                 │
          ┌──────────┬───────────┼───────────┬───────────┐
          │          │           │           │           │
          ▼          ▼           ▼           ▼           ▼
     ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌──────────┐
     │  Time   ││ Fatura- ││ Contas  ││ Billing ││  Drive   │
     │Tracking ││ mento   ││a Receber││  Plans  ││ Folders  │
     └─────────┘└─────────┘└─────────┘└─────────┘└──────────┘


                    ┌─────────────────────────┐
                    │        CLIENTS          │  ← Segunda entidade
                    │    (8 FKs apontam)      │     mais referenciada
                    └────────────┬────────────┘
                                 │
          ┌──────────┬───────────┼───────────┬───────────┐
          │          │           │           │           │
          ▼          ▼           ▼           ▼           ▼
     ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌──────────┐
     │  Cases  ││Propostas││ Fatura- ││ Contas  ││  Cofre   │
     │         ││         ││ mento   ││a Receber││ (socios) │
     └─────────┘└─────────┘└─────────┘└─────────┘└──────────┘


                    ┌─────────────────────────┐
                    │         USERS           │  ← Terceira entidade
                    │   (16 FKs apontam)      │     mais referenciada
                    └────────────┬────────────┘
                                 │
     ┌────────┬────────┬─────────┼────────┬────────┬─────────┐
     │        │        │         │        │        │         │
     ▼        ▼        ▼         ▼        ▼        ▼         ▼
  ┌──────┐┌──────┐┌───────┐┌────────┐┌──────┐┌───────┐┌────────┐
  │Leads ││Cases ││Time   ││Propos- ││Contas││Audit  ││Cofre   │
  │      ││      ││Entries││tas     ││a Pag.││ Logs  ││        │
  └──────┘└──────┘└───────┘└────────┘└──────┘└───────┘└────────┘
```

---

## 5. Sistema de Aprovacoes — Fluxo Transversal

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                   SISTEMA DE APROVACAO (camada horizontal)                   ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                         ┌──────────────────────────────┐
                         │     AUTHORITY MATRIX          │
                         │  socio + admin = pode aprovar │
                         │  payable, receivable,         │
                         │  time_entry                   │
                         └──────────────┬───────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   CONTAS A PAGAR    │  │   CONTAS A RECEBER  │  │   TIME TRACKING     │
│                     │  │                     │  │                     │
│ pendente            │  │ (fluxo normal nao   │  │ pendente            │
│   ├→ aprovado       │  │  precisa aprovacao) │  │   ├→ aprovado       │
│   │    └→ agendado  │  │                     │  │   │    └→ faturado  │
│   │         └→ pago │  │ desconto_solicitado │  │   └→ rejeitado     │
│   └→ rejeitado      │  │   ├→ aprovado       │  │        └→ pendente │
│        └→ pendente  │  │   └→ rejeitado      │  │           (reenvio)│
│           (reenvio) │  │                     │  │                     │
│                     │  │ baixa_solicitada    │  │                     │
│ UI: ApprovalBadge   │  │   ├→ aprovado       │  │ UI: ApprovalBadge   │
│     ApprovalActions │  │   └→ rejeitado      │  │     ApprovalActions │
│     ApprovalDialog  │  │                     │  │     ApprovalDialog  │
│     BatchApprovalBar│  │ UI: ApprovalBadge   │  │     BatchApprovalBar│
└─────────┬───────────┘  │     ApprovalActions │  └─────────┬───────────┘
          │              │     ApprovalDialog  │            │
          │              └─────────┬───────────┘            │
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   /aprovacoes (HUB)      │
                    │   Agrega pendencias de   │
                    │   TODOS os modulos       │
                    └──────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │      DASHBOARD           │
                    │  Card "Pendencias"       │
                    │  mostra contadores       │
                    └──────────────────────────┘
```

---

## 6. Componentes Compartilhados — Quem Usa o Que

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║              COMPONENTES UI → PAGINAS QUE CONSOMEM                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

PageHeader ──────────────────── Usado em 22+ paginas (quase todas)
    │
FilterDropdown ──────────────── Usado em: Leads, Propostas, Casos,
    │                            Financeiro, Contas a Pagar, Faturamento,
    │                            Time Tracking, Workflows, Cadastros (6x)
    │
EmptyState ──────────────────── Usado em: Leads, Propostas, Casos,
    │                            Financeiro, Contas a Pagar, Faturamento,
    │                            Time Tracking, Workflows, Aprovacoes
    │
ReportToolbar ───────────────── Usado em: Leads, Propostas, Casos,
    │                            Financeiro, Contas a Pagar, Faturamento,
    │                            Time Tracking, Workflows, Fluxo de Caixa,
    │                            Conciliacao Bancaria, Aprovacoes
    │
Toast ───────────────────────── Usado em: Leads, Propostas, Casos/[id],
    │                            Contas a Pagar, Faturamento, Time Tracking,
    │                            Workflows, Cofre, Conciliacao, Config,
    │                            Cadastros (6x)
    │
ApprovalBadge ───────────────── Usado em 9 paginas:
    │                            Financeiro (3), Contas a Pagar (3),
    │                            Time Tracking (3)
    │
ApprovalActions ─────────────── Usado em 3 paginas:
    │                            */aprovacoes de Financeiro, C.Pagar,
    │                            Time Tracking
    │
ApprovalDialog ──────────────── Usado em 4 paginas:
    │                            */aprovacoes (3) + Hub /aprovacoes
    │
BatchApprovalBar ────────────── Usado em 2 paginas:
    │                            Contas a Pagar/aprovacoes,
    │                            Time Tracking/aprovacoes
    │
Skeleton ────────────────────── Definido mas pouco usado
    │
KanbanBoard ─────────────────── Usado apenas em: Leads (collapsible list)

ProposalEditor ──────────────── Usado apenas em: Propostas/nova
```

---

## 7. Camadas da Aplicacao — Corte Vertical

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                     STACK — DA UI AO BANCO                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                       │
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │   Sidebar   │  │  PageHeader  │  │ FilterDrop-  │  │   Toast       │   │
│  │  (layout)   │  │  (layout)    │  │ down (UI)    │  │   (feedback)  │   │
│  └─────────────┘  └──────────────┘  └──────────────┘  └───────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PAGE COMPONENTS ("use client")                    │   │
│  │  Dashboard, Leads, Propostas, Casos, Financeiro, Contas a Pagar,   │   │
│  │  Faturamento, Time Tracking, Workflows, Cadastros (6), Cofre, etc. │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │ useState + mock data                  │
│                                     │ (TODO: fetch real)                    │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼───────────────────────────────────────┐
│                              SERVER                                         │
│                                     │                                       │
│  ┌──────────────────────────────────▼──────────────────────────────────┐   │
│  │                      SERVER ACTIONS ("use server")                   │   │
│  │  src/lib/actions/   leads, cases, proposals, financeiro, time       │   │
│  │  src/lib/approval/  approveEntity, rejectEntity, batchApprove      │   │
│  │                                                                     │   │
│  │  ⚠ Atualmente: apenas console.log                                  │   │
│  │  ⚠ Role vem do client (vulnerabilidade)                            │   │
│  │  ⚠ Zod schemas nao enforced                                       │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
│  ┌──────────────────────────────────▼──────────────────────────────────┐   │
│  │                      MIDDLEWARE (auth + RBAC)                        │   │
│  │  NextAuth v5 session check em todas as rotas                        │   │
│  │  RBAC: apenas /cofre e /configuracoes protegidos por role           │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
│  ┌──────────────────────────────────▼──────────────────────────────────┐   │
│  │                      VALIDATION LAYER                               │   │
│  │  src/lib/schemas/   11 Zod schemas definidos                        │   │
│  │                                                                     │   │
│  │  ⚠ Existem mas NAO sao chamados (nenhum .parse())                 │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
│  ┌──────────────────────────────────▼──────────────────────────────────┐   │
│  │                      AUTH (NextAuth v5)                              │   │
│  │  src/auth.ts          Mock Credentials → retorna sempre mesmo user  │   │
│  │  JWT callbacks         Propaga azureId, role, userId                 │   │
│  │  .env.example          Preparado para Azure AD                      │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼───────────────────────────────────────┐
│                          DATABASE (nao conectado)                            │
│                                     │                                       │
│  ┌──────────────────────────────────▼──────────────────────────────────┐   │
│  │                      DRIZZLE ORM SCHEMA                             │   │
│  │  src/lib/db/schema.ts    27 tabelas, relations, types               │   │
│  │                                                                     │   │
│  │  ⚠ Schema definido mas SEM pool de conexao                        │   │
│  │  ⚠ Nenhuma migration gerada                                       │   │
│  │  ⚠ Nenhum seed criado                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│                              ┌──────▼──────┐                                │
│                              │ PostgreSQL  │  ← Planejado, nao conectado    │
│                              └─────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Cadeia Financeira Completa

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║           CADEIA DE VALOR: DO CASO ATE O COFRE DOS SOCIOS                   ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌───────────────┐
│    CASO       │ (area, responsavel, cliente)
└───────┬───────┘
        │
        ├─────────────────────────────────────────────┐
        │                                             │
        ▼                                             ▼
┌───────────────┐                            ┌────────────────┐
│ BILLING PLAN  │ (tipo: fixo/hora/exito/    │  TIME ENTRIES  │ (horas apontadas
│               │  hibrido, taxa, dia cobr.) │                │  por advogado)
└───────┬───────┘                            └───────┬────────┘
        │                                            │
        │  Roda Engine                               │ Aprovacao
        │  Mensal                                    │ (socio/admin)
        ▼                                            ▼
┌───────────────┐                            ┌────────────────┐
│  PRE-FATURA   │◀───── horas aprovadas ─────│  APROVADAS     │
│  (review)     │       alimentam valor      │                │
└───────┬───────┘                            └────────────────┘
        │
        │ Aprovacao (socio)
        ▼
┌───────────────┐
│   INVOICE     │ (NFSe emitida)
│   (NFSe)      │
└───────┬───────┘
        │
        │ Gera titulo
        ▼
┌───────────────┐                            ┌────────────────┐
│   AR TITLE    │ (Conta a Receber)          │ CONTAS A PAGAR │
│   (aberto)    │                            │ (despesas)     │
└───────┬───────┘                            └───────┬────────┘
        │                                            │
        │ Pagamento recebido                         │ Aprovacao + Pagamento
        ▼                                            ▼
┌────────────────────────────────────────────────────────────┐
│                    BANK TRANSACTIONS                        │
│              (extrato bancario importado)                   │
└───────────────────────────┬────────────────────────────────┘
                            │
                            │ Match automatico/manual
                            ▼
                ┌───────────────────────┐
                │ RECONCILIATION MATCH  │
                │ (AR ↔ Bank Entry)     │
                └───────────┬───────────┘
                            │
                            │ Agrega
                            ▼
                ┌───────────────────────┐
                │    FLUXO DE CAIXA     │
                │ (receita x despesa    │
                │  x projecao)          │
                └───────────┬───────────┘
                            │
                            │ Distribui lucro
                            ▼
                ┌───────────────────────┐
                │   COFRE DOS SOCIOS    │
                │  partners             │
                │  partnerLedger        │
                │  distributions        │
                └───────────────────────┘
```

---

## 9. Navegacao do Sidebar — Grupos e Intersecoes

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    SIDEBAR — 6 GRUPOS DE NAVEGACAO                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────┐
│  ★ FAVORITOS (dinamico, localStorage)                                    │
│     Itens fixados pelo usuario via ★ no menu                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Users]  COMERCIAL & CRM                                                │
│     ├── Leads ──────────────────── /leads                                │
│     └── Propostas ──────────────── /propostas                            │
│            └── Aprovacoes ──────── /propostas/aprovacao                   │
│                                                                          │
│  [Scale]  OPERACIONAL                                                    │
│     ├── Meus Casos ─────────────── /casos                                │
│     ├── Time Tracking ──────────── /time-tracking                        │
│     │      └── Aprovacoes ──────── /time-tracking/aprovacoes             │
│     └── Workflows ──────────────── /workflows                            │
│                                                                          │
│  [Library] FINANCEIRO                                                    │
│     ├── Contas a Receber ───────── /financeiro                           │
│     │      └── Aprovacoes ──────── /financeiro/aprovacoes                │
│     ├── Contas a Pagar ─────────── /contas-a-pagar                       │
│     │      └── Aprovacoes ──────── /contas-a-pagar/aprovacoes            │
│     └── Tesouraria                                                       │
│            ├── Conciliacoes ────── /conciliacao-bancaria                  │
│            └── Fluxo de Caixa ──── /fluxo-de-caixa                       │
│                                                                          │
│  [Calculator] FISCAL & CONTABILIDADE                                     │
│     ├── Fiscal ─────────────────── /faturamento                          │
│     │      ├── Emissao NFSe ────── /faturamento                          │
│     │      └── Parametros ──────── /faturamento/parametros               │
│     └── Contabilidade ──────────── /contabilidade                        │
│                                                                          │
│  [Database] CADASTROS                                                    │
│     ├── Empresas ───────────────── /cadastros/empresas                   │
│     ├── Socios ─────────────────── /cadastros/socios                     │
│     ├── Colaboradores ──────────── /cadastros/colaboradores              │
│     ├── Centro de Custo / Caso ─── /cadastros/centros-de-custo           │
│     ├── Contas Bancarias ───────── /cadastros/contas-bancarias           │
│     └── Fornecedores ──────────── /cadastros/fornecedores                │
│                                                                          │
│  [Crown] ADMINISTRACAO SOCIOS                                            │
│     ├── Aprovacoes ─────────────── /aprovacoes        [socio]            │
│     ├── Cofre dos Socios ───────── /cofre             [socio] RBAC      │
│     ├── Seguranca & Logs ───────── /seguranca-logs                       │
│     └── Configuracoes ──────────── /configuracoes     [admin] RBAC      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Legenda de Statusso

```
Simbolo    Significado
─────────────────────────────────────────
  ──▶      Fluxo de dados / navegacao
  ◀──▶     Relacao bidirecional
  ⚠        Risco ou vulnerabilidade
  [RBAC]   Rota protegida por role
  (mock)   Dados simulados, nao reais
  TODO     Funcionalidade planejada
```
