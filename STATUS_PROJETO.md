# PF Advogados ERP — Status do Projeto

**Data:** 03/03/2026
**Build:** TSC clean, 79/79 testes passando (vitest)

---

## 1. Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| React | React | 19.2.3 |
| CSS | Tailwind CSS v4 (`@theme inline`) | 4 |
| Auth | NextAuth v5 beta (Credentials mock, pronto p/ Azure AD) | 5.0.0-beta.30 |
| ORM | Drizzle ORM | 0.45.1 |
| DB Driver | postgres.js | 3.4.8 |
| Validacao | Zod | 4.3.6 |
| Icones | lucide-react | 0.575.0 |
| Testes | Vitest | 4.0.18 |
| Fontes | Inter (body), JetBrains Mono (mono), Zen Dots (logo) | — |

---

## 2. Banco de Dados — Schema (24 tabelas)

| # | Tabela | Descricao | FKs principais |
|---|--------|-----------|----------------|
| 1 | `roles` | Perfis (socio, advogado, financeiro, admin) | — |
| 2 | `users` | Usuarios do sistema | roles |
| 3 | `leads` | Pipeline CRM | users (responsible) |
| 4 | `meetings` | Reunioes agendadas | leads, users |
| 5 | `proposals` | Propostas de honorarios | leads, clients, users |
| 6 | `proposal_versions` | Historico de versoes | proposals |
| 7 | `clients` | Clientes do escritorio | — |
| 8 | `cases` | Casos/projetos juridicos | clients, users, proposals |
| 9 | `case_members` | Equipe do caso | cases, users |
| 10 | `tasks` | Tarefas de casos | cases, users |
| 11 | `time_entries` | Apontamento de horas | users, cases, pre_invoices |
| 12 | `billing_plans` | Planos de faturamento | cases |
| 13 | `pre_invoices` | Pre-faturas | cases, clients, billing_plans |
| 14 | `invoices` | Notas fiscais emitidas | pre_invoices, clients, cases |
| 15 | `ar_titles` | Contas a receber | clients, invoices |
| 16 | `bank_transactions` | Extrato bancario | — |
| 17 | `reconciliation_matches` | Conciliacao bancaria | bank_transactions, ar_titles, accounts_payable |
| 18 | `cashflow_daily` | Fluxo de caixa diario | — |
| 19 | `accounts_payable` | Contas a pagar | users |
| 20 | `partners` | Socios | users |
| 21 | `partner_ledger` | Movimento do socio | partners |
| 22 | `distributions` | Distribuicoes de lucro | partners, users |
| 23 | `audit_logs` | Log de auditoria | users |
| 24 | `exception_queue` | Fila de excecoes | users |
| 25 | `drive_folders` | Pastas GDrive | cases, clients |
| 26 | `rules` | Configuracoes (key-value) | — |

**Infraestrutura DB:**
- `src/lib/db/index.ts` — Client com Proxy lazy (nao quebra em ambiente sem DB)
- `src/lib/db/schema.ts` — Schema completo Drizzle ORM
- `src/lib/db/format.ts` — Utilitarios: `formatCurrency()`, `formatDateBR()`
- `src/lib/db/seed.ts` — Seed com roles + user Fernando Brasil (UUID deterministico)
- `drizzle.config.ts` — Configuracao do Drizzle Kit
- `docker-compose.yml` — PostgreSQL 16 Alpine (porta 5432, db: pf_advogados)
- `.env.local` — `DATABASE_URL=postgresql://pf:pf2026@localhost:5432/pf_advogados`

---

## 3. Server Actions (8 arquivos, 28 funcoes)

| Arquivo | Funcoes | DB Query | Mock Fallback |
|---------|---------|----------|---------------|
| `leads.ts` | `getLeads`, `getLeadById`, `createLead`, `updateLead`, `deleteLead` | sim | sim |
| `cases.ts` | `getCases`, `getCaseById`, `createCase`, `updateCase` | sim | sim |
| `proposals.ts` | `getProposals`, `getProposalById`, `createProposal`, `updateProposal` | sim | sim |
| `financeiro.ts` | `getReceivables`, `getPayables`, `createPayable`, `updatePayableStatus`, `deletePayable` | sim | sim |
| `time-entries.ts` | `getTimeEntries`, `createTimeEntry`, `updateTimeEntryStatus` | sim | sim |
| `bank-transactions.ts` | `getBankEntries`, `reconcileBankEntry` | sim | sim |
| `faturamento.ts` | `getInvoices` | sim | sim |
| `dashboard.ts` | `getPendingApprovals`, `getNotifications`, `getEvents` | nao (retorna mock) | sim |

**Padrao tecnico em todas as actions:**
1. `auth()` check — rejeita se nao autenticado
2. Zod validation dos filtros/inputs
3. DB query com joins (try)
4. Mock fallback no catch
5. Mapper: DB row → tipo Mock (display type)

---

## 4. Paginas — Status de Migracao

### Migradas para Server Actions (13 paginas)

| Pagina | Action usada | Tipo de migracao |
|--------|-------------|------------------|
| `/aprovacoes` | `getPayables` + `getReceivables` + `getTimeEntries` + `getProposals` | MOCK import → useEffect |
| `/contas-a-pagar` | `getPayables` | MOCK import → useEffect |
| `/contas-a-pagar/aprovacoes` | `getPayables` | MOCK import → useEffect |
| `/contas-a-pagar/[id]/aprovacao` | `getPayables` | MOCK import → useEffect + loading |
| `/financeiro/aprovacoes` | `getReceivables` | MOCK import → useEffect |
| `/financeiro/[id]/aprovacao` | `getReceivables` | MOCK import → useEffect + loading |
| `/time-tracking/aprovacoes` | `getTimeEntries` | MOCK import → useEffect |
| `/time-tracking/[id]/aprovacao` | `getTimeEntries` | MOCK import → useEffect + loading |
| `/conciliacao-bancaria` | `getBankEntries` | MOCK import → useEffect |
| `/casos` | `getCases` | Inline data → useEffect |
| `/propostas` | `getProposals` | localStorage → useEffect |
| `/faturamento` | `getInvoices` | Inline data → useEffect |
| `/dashboard` | `getPendingApprovals` + `getEvents` + `getNotifications` | MOCK import → useEffect |

### NAO migradas (4 paginas) — motivo tecnico

| Pagina | Motivo | Complexidade |
|--------|--------|-------------|
| `/leads` | Tipo `Lead` da pagina tem 12+ campos vs 6 do `MockLead`. Precisa de action enriquecida | ALTA |
| `/cofre` | Dados analiticos agregados (rentabilidade, margens, distribuicao) | MEDIA |
| `/fluxo-de-caixa` | DRE com 30 linhas x 12 meses, precisa query agregada | MEDIA |
| `/configuracoes` | Usa localStorage para settings, migrar p/ tabela `rules` | BAIXA |

### Paginas que nao precisam de migracao

| Pagina | Motivo |
|--------|--------|
| `/financeiro` | Ja usa `getReceivables()` (migrada em sessao anterior) |
| `/time-tracking` | Timer client-side + `MOCK_CASE_OPTIONS` (esperado) |
| `/workflows` | Nao existe tabela no schema — manter mock |
| `/cadastros/*` (6 paginas) | Cadastros basicos — a serem conectados quando houver CRUD |
| `/casos/novo`, `/casos/[id]` | Forms — funcionam com actions ja existentes |
| `/propostas/nova`, `/propostas/[id]/aprovacao` | Editor + aprovacao — funcionam com actions existentes |
| `/faturamento/parametros` | Configuracao de billing — manter mock |
| `/contabilidade` | Placeholder |
| `/seguranca-logs` | Placeholder (tabela `audit_logs` existe) |

---

## 5. Componentes

| Pasta | Componentes | Descricao |
|-------|------------|-----------|
| `ui/` | 15 componentes | Button, Input, Select, Modal, Badge, SearchInput, PageHeader, FilterDropdown, Table, EmptyState, Skeleton, Toast, ReportToolbar |
| `approval/` | 4 componentes | ApprovalActions, ApprovalBadge, ApprovalDialog, BatchApprovalBar |
| `layout/` | 3 componentes | Sidebar (dual-panel 80px+256px), Header (server component), MobileMenu |
| `leads/` | 1 componente | KanbanBoard (collapsible pipeline list) |
| `proposals/` | 1 componente | ProposalEditor (4 tabs) |

---

## 6. Testes

| Arquivo | Testes | Escopo |
|---------|--------|--------|
| `src/lib/schemas/index.test.ts` | 22 | Validacao Zod de todos os schemas |
| `src/lib/approval/actions.test.ts` | 19 | approveEntity, rejectEntity, batchApprove |
| `src/lib/approval/types.test.ts` | — | Tipos de aprovacao |
| `src/lib/actions/leads.test.ts` | 10 | getLeads, createLead, updateLead, deleteLead |
| `src/lib/rate-limit.test.ts` | 28 | Rate limiting por IP/user |
| **Total** | **79** | **Todos passando** |

---

## 7. Autenticacao

- **Provider:** Credentials (mock) — login com qualquer email/senha
- **User mock:** Fernando Brasil, role `socio`, UUID `a0000000-0000-4000-8000-000000000001`
- **Session:** JWT com `id`, `role`, `azureId`
- **Pronto para:** Azure AD (campos ja no schema, config placeholder no `.env.local`)

---

## 8. Design System

| Token | Valor |
|-------|-------|
| `--pf-blue` | `#212EC6` (primary) |
| `--pf-black` | `#000000` |
| `--pf-grey` | `#BDBDBD` |
| `--background` | `#F4F5F7` |
| Body font | Inter (`--font-sans`) |
| Mono font | JetBrains Mono (`--font-mono`) |
| Logo font | Zen Dots (`--font-display`) — apenas "PF" |

**Padroes UI:**
- Flat design, sem card wrappers em listas
- Rows com hover `bg-white` sobre `#F4F5F7`
- Status badges: `text-[10px] font-bold uppercase tracking-widest`
- KPIs: `font-sans text-xl/3xl font-bold` (nunca font-display)
- Tabular nums no body (`font-variant-numeric: tabular-nums`)

---

## 9. O que falta para producao

### Imediato (proximo passo)

1. **Subir PostgreSQL** — `docker-compose up -d`
2. **Aplicar schema** — `npm run db:push`
3. **Popular seed** — `npm run db:seed`
4. **Validar E2E** — navegar todas as 13 paginas migradas, confirmar dados reais

### Curto prazo

5. **Migrar leads/page.tsx** — criar action enriquecida com tipo `Lead` completo
6. **Migrar cofre + fluxo-de-caixa** — queries agregadas de financeiro
7. **Migrar configuracoes** — localStorage → tabela `rules`
8. **Enriquecer seed** — popular clients, cases, time_entries, receivables, payables, bank_transactions

### Medio prazo

9. **Azure AD** — trocar Credentials mock por Azure AD real
10. **Engine de Fechamento** — gerar pre-faturas reais a partir de time_entries aprovados
11. **Conciliacao bancaria** — matching automatico bank_transactions ↔ ar_titles/accounts_payable
12. **Audit logs** — persistir em `audit_logs` todas as acoes de aprovacao/rejeicao
13. **Workflows** — criar tabela dedicada ou usar engine de estado
14. **RBAC** — restringir acoes por role (socio vs advogado vs financeiro)
15. **Dashboard real** — substituir KPIs hardcoded por queries agregadas

### Longo prazo

16. **NFS-e real** — integracao com prefeitura para emissao fiscal
17. **Google Drive** — sincronizar pastas de casos (`drive_folders`)
18. **Notificacoes push** — via WebSocket ou SSE
19. **Mobile responsive** — refinamento do layout mobile
20. **Performance** — cache de queries, paginacao server-side, ISR

---

## 10. Estrutura de Arquivos (resumo)

```
src/
├── app/
│   ├── (dashboard)/          # 39 paginas (layout protegido)
│   │   ├── dashboard/
│   │   ├── leads/
│   │   ├── propostas/
│   │   ├── casos/
│   │   ├── financeiro/
│   │   ├── contas-a-pagar/
│   │   ├── faturamento/
│   │   ├── fluxo-de-caixa/
│   │   ├── cofre/
│   │   ├── time-tracking/
│   │   ├── workflows/
│   │   ├── conciliacao-bancaria/
│   │   ├── aprovacoes/
│   │   ├── cadastros/         # 6 sub-paginas
│   │   ├── configuracoes/
│   │   ├── contabilidade/
│   │   └── seguranca-logs/
│   ├── login/
│   └── layout.tsx
├── auth.ts                    # NextAuth config
├── components/
│   ├── ui/                    # 15 componentes reutilizaveis
│   ├── approval/              # 4 componentes de aprovacao
│   ├── layout/                # Sidebar, Header, MobileMenu
│   ├── leads/                 # KanbanBoard
│   └── proposals/             # ProposalEditor
├── lib/
│   ├── actions/               # 8 server action files + 1 test
│   ├── approval/              # Engine de aprovacao + testes
│   ├── db/                    # Schema, client, seed, format
│   ├── schemas/               # Zod schemas + testes
│   ├── mock-data.ts           # Dados mock centralizados
│   └── rate-limit.ts          # Rate limiting + teste
├── styles/
│   └── globals.css            # Tailwind v4 + tokens
docker-compose.yml
drizzle.config.ts
```

---

**Resumo em uma frase:** ERP funcional com 39 paginas, 24 tabelas, 28 server actions, 13 paginas conectadas ao backend via server actions com fallback mock — pronto para ativar o banco PostgreSQL.
