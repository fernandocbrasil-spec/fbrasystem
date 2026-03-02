# PF Advogados ERP — Revisao Tecnica Completa

**Data**: 2026-03-02
**Versao**: 1.0
**Escopo**: Leitura completa do repositorio + diagnostico de prontidao SaaS

---

## 1. Mapa do Sistema

### Stack

| Camada         | Tecnologia                                      |
|----------------|--------------------------------------------------|
| Framework      | Next.js 16.1.6 (App Router, Turbopack)           |
| React          | 19.2.3                                           |
| Linguagem      | TypeScript 5 (strict)                            |
| CSS            | Tailwind CSS v4 (`@theme inline` tokens)         |
| Auth           | NextAuth v5 beta (mock Credentials)              |
| ORM            | Drizzle ORM 0.45.1                               |
| DB planejado   | PostgreSQL (schema definido, sem conexao ativa)   |
| Validacao      | Zod 4.3.6 (schemas definidos, nao enforced)      |
| Icons          | lucide-react 0.575.0                             |
| Fonts          | Inter (UI), JetBrains Mono (mono), Zen Dots (logo)|

### Metricas do Repositorio

| Metrica                     | Valor    |
|-----------------------------|----------|
| Arquivos `.tsx`             | 53       |
| Arquivos `.ts`              | 16       |
| Total arquivos fonte        | 69       |
| Rotas (pages)               | 35       |
| Componentes compartilhados  | 15       |
| Tabelas no schema           | 27       |
| Schemas Zod                 | 11       |
| Server actions              | 5 arquivos |
| Testes automatizados        | 0        |
| Pipelines CI/CD             | 0        |
| Dockerfiles                 | 0        |

### Modulos Funcionais

| Modulo              | Rotas | Status           |
|---------------------|-------|------------------|
| Dashboard (Home)    | 1     | UI completa, dados mock |
| CRM / Leads         | 1     | UI completa, dados mock |
| Propostas           | 3     | Editor 4-tabs, aprovacao |
| Casos               | 2     | Detalhe + membros |
| Financeiro          | 3     | Aprovacoes, listagem |
| Contas a Pagar      | 3     | CRUD, aprovacoes |
| Faturamento         | 2     | Parametros billing |
| Fluxo de Caixa      | 1     | Visualizacao mock |
| Conciliacao Bancaria| 1     | UI placeholder |
| Contabilidade       | 1     | UI placeholder |
| Time Tracking       | 3     | Apontamentos + aprovacao |
| Workflows           | 1     | Motor de regras UI |
| Aprovacoes          | 1     | Hub centralizado |
| Cofre dos Socios    | 1     | Protegido RBAC |
| Configuracoes       | 1     | Protegido RBAC |
| Seguranca & Logs    | 1     | UI placeholder |
| Cadastros (6 sub)   | 7     | CRUD completo cada |
| Login               | 1     | Mock credentials |

### Schema do Banco (27 tabelas — Drizzle ORM)

**Core**: roles, users
**CRM**: leads, meetings
**Propostas**: proposals, proposalVersions
**Clientes/Casos**: clients, cases, caseMembers
**Execucao**: tasks
**Horas**: timeEntries
**Faturamento**: billingPlans, preInvoices, invoices
**Contas a Receber**: arTitles
**Conciliacao**: bankTransactions, reconciliationMatches
**Fluxo de Caixa**: cashflowDaily
**Contas a Pagar**: accountsPayable
**Cofre**: partners, partnerLedger, distributions
**Auditoria**: auditLogs
**Excecoes**: exceptionQueue
**Drive**: driveFolders
**Regras**: rules

---

## 2. Checklist ERP SaaS — Avaliacao

### 2.1 Multi-tenancy

| Item | Status | Nota |
|------|--------|------|
| Isolamento de dados por tenant | NAO IMPLEMENTADO | Schema sem `tenantId` em nenhuma tabela |
| Tenant-aware queries | NAO IMPLEMENTADO | Nenhum filtro de tenant nas actions |
| Onboarding de novo tenant | NAO IMPLEMENTADO | - |
| Separacao de storage/files | NAO IMPLEMENTADO | - |

**Veredicto**: O sistema e single-tenant. Toda a camada de multi-tenancy precisa ser projetada.

### 2.2 Autenticacao & Autorizacao

| Item | Status | Nota |
|------|--------|------|
| Provider de producao (Azure AD) | PLANEJADO | TODO no codigo, .env.example preparado |
| Mock credentials removiveis | OK | Isolado em `src/auth.ts` |
| JWT com claims customizados | OK | azureId, role, userId propagados |
| RBAC middleware | PARCIAL | Apenas 2 rotas protegidas (/cofre, /configuracoes) |
| RBAC em server actions | CRITICO | `userRole` vem do CLIENT, nao da sessao |
| Authority matrix | OK | `APPROVAL_AUTHORITY` definida com roles |
| Session expiration | DEFAULT | NextAuth defaults, sem config custom |
| MFA | NAO IMPLEMENTADO | - |

### 2.3 Seguranca

| Item | Severidade | Detalhe |
|------|-----------|---------|
| AUTH_SECRET fraco | CRITICA | `.env.local` tem string legivel, nao criptografica |
| Role enviado do client | CRITICA | `approval/actions.ts` recebe `userRole` como parametro em vez de ler da sessao |
| Zod nao enforced | ALTA | 11 schemas definidos, zero `.parse()` em server actions |
| Sem rate limiting | ALTA | Nenhum rate limit em auth ou API |
| Sem CSP header | ALTA | `next.config.ts` sem `headers()` |
| Sem CSRF protection custom | MEDIA | NextAuth tem basico, server actions nao tem |
| .env.local no .gitignore | OK | Verificado, esta ignorado |
| Sem secrets em codigo | OK | Nenhum hardcoded secret encontrado |
| XSS via dangerouslySetInnerHTML | NAO ENCONTRADO | Nenhum uso |
| SQL injection | N/A | Drizzle ORM parametriza queries |

### 2.4 Banco de Dados

| Item | Status | Nota |
|------|--------|------|
| Schema Drizzle definido | OK | 27 tabelas, relations, types |
| Conexao ativa | NAO | Nenhum `DATABASE_URL` real, nenhum pool |
| Migrations | NAO | Drizzle Kit instalado mas sem migrations geradas |
| Seeds | NAO | Todos os dados sao mock in-memory |
| Indexes | PARCIAL | Apenas PKs, sem indexes em FKs ou campos de busca |
| Soft-delete | NAO | Nenhuma coluna `deletedAt` |
| Audit trail DB | SCHEMA ONLY | Tabela `auditLogs` definida, nunca populada |

### 2.5 Qualidade de Codigo

| Item | Status | Nota |
|------|--------|------|
| TypeScript strict | OK | Configurado no tsconfig |
| ESLint | INSTALADO | eslint-config-next, sem regras custom |
| Prettier | NAO | Nenhuma config encontrada |
| Testes unitarios | ZERO | Nenhum test runner instalado |
| Testes e2e | ZERO | Sem Playwright/Cypress |
| Testes de integracao | ZERO | - |
| Error boundaries | NAO | Nenhum `error.tsx` em rotas |
| Loading states | NAO | Nenhum `loading.tsx` em rotas |
| Not-found pages | NAO | Nenhum `not-found.tsx` custom |

### 2.6 UI/UX

| Item | Status | Nota |
|------|--------|------|
| Design tokens | OK | `@theme inline` com pf-blue, pf-black, pf-grey, background |
| Componentes reutilizaveis | PARCIAL | 15 componentes, mas sem Button, Input, Modal base |
| Responsividade mobile | NAO | Nenhum breakpoint mobile testado, sidebar nao colapsa |
| Acessibilidade (a11y) | MINIMA | Poucos `aria-*`, sem skip-to-content, sem focus management |
| Dark mode | NAO | Sem suporte |
| i18n | NAO | Strings hardcoded em pt-BR |
| Skeleton/Loading | PARCIAL | Componente `skeleton.tsx` existe, pouco usado |
| Toast feedback | OK | Sistema de toast global implementado |

### 2.7 Performance & Observabilidade

| Item | Status | Nota |
|------|--------|------|
| SSR / RSC | MINIMO | Quase tudo "use client", pouco server component |
| Code splitting | DEFAULT | Next.js automatico por rota |
| Image optimization | N/A | Poucas imagens, sem `next/image` custom |
| Logging estruturado | NAO | `console.log` apenas |
| APM / Tracing | NAO | Sem Sentry, DataDog, etc. |
| Health check endpoint | NAO | - |
| Metricas de negocio | NAO | - |

### 2.8 Infra & Deploy

| Item | Status | Nota |
|------|--------|------|
| Dockerfile | NAO | - |
| docker-compose | NAO | - |
| CI/CD pipeline | NAO | Sem `.github/workflows/` |
| Deploy automatico | NAO | - |
| Environments (staging/prod) | NAO | Apenas .env.local |
| Backup strategy | NAO | - |

---

## 3. O que esta Bom (Top 10)

1. **Schema de banco robusto** — 27 tabelas bem modeladas com Drizzle ORM, relations e tipos exportados. Modelo de dados maduro para um ERP juridico.

2. **Modularidade de rotas** — 35 rotas organizadas no App Router com agrupamento logico `(dashboard)`. Cada modulo tem seu proprio diretorio.

3. **Sistema de aprovacoes bem desenhado** — Authority matrix (`APPROVAL_AUTHORITY`), transition maps por modulo (payable, receivable, time_entry), status labels e colors. Arquitetura pronta para workflow de aprovacao real.

4. **Schemas Zod completos** — 11 schemas de validacao cobrindo leads, clients, cases, tasks, time entries, proposals, billing plans, pre-invoices e approval actions. Validacao pronta para ser plugada.

5. **Design system consistente** — Tokens CSS bem definidos (`pf-blue`, `pf-black`, `pf-grey`), tipografia uniforme (Inter/JetBrains Mono), pattern de PageHeader + Toolbar + Table replicado em todas as paginas.

6. **Sidebar avancada** — Dual-panel (80px icons + 256px expandable), sistema de favoritos com localStorage, busca de modulos, agrupamento por categorias.

7. **Componentes de aprovacao reutilizaveis** — ApprovalBadge, ApprovalActions, ApprovalDialog, BatchApprovalBar formam um kit completo para qualquer modulo que precise de workflow de aprovacao.

8. **FilterDropdown reutilizavel** — Multi-select com keyboard navigation, usado consistentemente em Cadastros e outras listagens.

9. **Separacao clara de concerns** — Server actions isolados em `src/lib/actions/`, tipos em `src/lib/approval/types.ts`, schemas em `src/lib/schemas/`. Nao ha logica de negocio nos componentes de UI.

10. **Preparacao para Azure AD** — `.env.example` com variaveis Azure AD, JWT callbacks preparados para `azureId`, tipo `next-auth.d.ts` extendido. A troca de mock para real e cirurgica.

---

## 4. Riscos e Gaps

### P0 — Criticos (bloqueia deploy)

| # | Risco | Arquivo | Impacto |
|---|-------|---------|---------|
| P0-1 | **Role vem do client, nao da sessao** | `src/lib/approval/actions.ts:16` | Qualquer usuario pode se passar por "socio" e aprovar tudo. Escalacao de privilegio trivial. |
| P0-2 | **AUTH_SECRET nao criptografico** | `.env.local` | JWTs podem ser forjados se o secret vazar. String legivel `p3ix0t0f3it3ir0...` |
| P0-3 | **Auth mock em producao** | `src/auth.ts:9` | `authorize()` retorna usuario hardcoded sem verificar credenciais. Qualquer login funciona. |
| P0-4 | **Zero testes** | - | Nenhum test runner instalado. Impossivel validar regressoes. |
| P0-5 | **Sem CI/CD** | - | Deploy manual, sem gates de qualidade. |

### P1 — Altos (degradam seguranca/confiabilidade)

| # | Risco | Detalhe |
|---|-------|---------|
| P1-1 | **RBAC cobre apenas 2 de 35 rotas** | Middleware protege /cofre e /configuracoes. Outras 33 rotas acessiveis por qualquer role. |
| P1-2 | **Zod schemas nunca enforced** | 11 schemas definidos, mas nenhum `.parse()` em server actions. Dados nao validados. |
| P1-3 | **Sem rate limiting** | Nenhum rate limit em login, API ou server actions. Vulneravel a brute force. |
| P1-4 | **Sem error boundaries** | Nenhum `error.tsx`. Erro em qualquer rota crash a aplicacao inteira. |
| P1-5 | **Sem loading states** | Nenhum `loading.tsx`. Navegacao entre paginas pesadas sem feedback. |
| P1-6 | **Dados 100% mock** | Nenhum dado vem do banco. Toda operacao e in-memory e perde estado no refresh. |
| P1-7 | **Sem CSP header** | Vulneravel a XSS via scripts injetados de terceiros. |
| P1-8 | **Sem audit log real** | Tabela `auditLogs` definida no schema mas nunca populada. Logs vao para `console.log`. |

### P2 — Medios (debt tecnico / UX)

| # | Risco | Detalhe |
|---|-------|---------|
| P2-1 | **Sem multi-tenancy** | Schema sem `tenantId`. Impossivel rodar multiplos escritorios na mesma instancia. |
| P2-2 | **Sem responsividade mobile** | Sidebar fixa, tabelas sem scroll horizontal, sem breakpoints. |
| P2-3 | **Sem componentes base (Button, Input, Modal)** | Botoes e inputs com classes inline repetidas. Inconsistencia visual potencial. |
| P2-4 | **Sem soft-delete** | Exclusao e permanente. Sem coluna `deletedAt` em nenhuma tabela. |
| P2-5 | **Sem indexes no schema** | Apenas PKs. FKs e campos de busca sem indexes = performance ruim em escala. |
| P2-6 | **Sem logging estruturado** | Apenas `console.log`. Sem Sentry, sem tracing, sem metricas. |
| P2-7 | **SSR subutilizado** | Quase tudo "use client". Server components apenas em header e layout. |
| P2-8 | **Sem Prettier** | Formatacao inconsistente potencial sem formatter automatico. |

---

## 5. Recomendacoes Arquiteturais

### 5.1 Corrigir Role na Sessao (P0-1)

```typescript
// ANTES (vulneravel):
export async function approveEntity({ entityType, entityId, userRole }) { ... }

// DEPOIS (seguro):
import { auth } from "@/auth";
export async function approveEntity({ entityType, entityId }) {
    const session = await auth();
    if (!session?.user?.role) throw new Error("Nao autenticado");
    const userRole = session.user.role as UserRole;
    // ...
}
```

### 5.2 Enforced Zod em Server Actions

Cada server action deve validar input com `.parse()` antes de qualquer operacao:

```typescript
import { createLeadSchema } from "@/lib/schemas";
export async function createLead(input: unknown) {
    const data = createLeadSchema.parse(input);
    // ...
}
```

### 5.3 Middleware RBAC Expandido

```typescript
const ROLE_ROUTES: Record<string, string[]> = {
    "/cofre": ["socio", "admin"],
    "/configuracoes": ["socio", "admin"],
    "/financeiro": ["socio", "admin", "financeiro"],
    "/contas-a-pagar": ["socio", "admin", "financeiro"],
    "/faturamento": ["socio", "admin", "financeiro"],
    "/time-tracking/aprovacoes": ["socio", "admin"],
    // ...
};
```

### 5.4 Error/Loading States

Criar `error.tsx` e `loading.tsx` no grupo `(dashboard)` como fallback global:

```
src/app/(dashboard)/error.tsx    — error boundary com reset
src/app/(dashboard)/loading.tsx  — skeleton layout
```

### 5.5 Conexao com Banco

Priorizar: pool de conexao → migrations → seeds → substituir mock data.

```
1. Configurar DATABASE_URL real
2. npx drizzle-kit generate  → gerar migrations
3. npx drizzle-kit push      → aplicar schema
4. Criar seeds com dados iniciais
5. Substituir useState por queries reais em cada modulo
```

---

## 6. Proximos 10 Passos (ordem de prioridade)

| # | Acao | Tipo | Esforco |
|---|------|------|---------|
| 1 | Corrigir role em server actions (ler da sessao) | Security P0 | 2h |
| 2 | Gerar AUTH_SECRET criptografico (`openssl rand -base64 32`) | Security P0 | 5min |
| 3 | Enforced Zod validation em todas server actions | Security P1 | 4h |
| 4 | Instalar Vitest + criar primeiros testes para approval module | Quality P0 | 4h |
| 5 | Criar error.tsx e loading.tsx no grupo (dashboard) | UX P1 | 1h |
| 6 | Expandir RBAC middleware para todas as rotas sensiveis | Security P1 | 2h |
| 7 | Conectar banco PostgreSQL + gerar migrations | Infra P1 | 4h |
| 8 | Configurar GitHub Actions CI (lint + type-check + test) | Quality P0 | 2h |
| 9 | Adicionar CSP e security headers em next.config.ts | Security P1 | 1h |
| 10 | Implementar Azure AD provider (substituir mock) | Auth P0 | 4h |

---

## 7. Conclusao

O sistema PF Advogados ERP demonstra **maturidade de modelagem** (schema de 27 tabelas, workflow de aprovacao, schemas Zod) e **consistencia de UI** (design tokens, patterns reutilizaveis, sidebar avancada). A arquitetura de modulos esta bem organizada no App Router.

No entanto, esta em fase de **prototipo funcional** — toda a camada de dados e mock, a autenticacao e simulada, e nao ha testes ou CI/CD. Os 5 riscos P0 identificados devem ser resolvidos antes de qualquer deploy em ambiente de teste.

A boa noticia e que a arquitetura facilita a evolucao: o mock auth e substituivel cirurgicamente, os schemas Zod ja cobrem os casos de uso, e o schema Drizzle esta pronto para migrations. O caminho de prototipo para MVP e claro e incremental.
