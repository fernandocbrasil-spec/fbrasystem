# PF Advogados ERP — Backlog de Evolucao

**Data**: 2026-03-02
**Gerado a partir de**: ERP_SAAS_REVIEW.md

---

## Legenda

- **Prioridade**: P0 (critico), P1 (alto), P2 (medio), P3 (baixo)
- **Tipo**: SEC (seguranca), INFRA (infraestrutura), QUAL (qualidade), UX (experiencia), FEAT (funcionalidade), DATA (banco/dados)
- **Esforco**: PP (< 2h), P (2-4h), M (4-8h), G (8-16h), GG (> 16h)

---

## SEC — Seguranca

### SEC-001: Corrigir role em server actions — ler da sessao
**Prioridade**: P0 | **Esforco**: PP

**Descricao**: As server actions de aprovacao (`src/lib/approval/actions.ts`) recebem `userRole` como parametro do client. Qualquer usuario pode enviar `"socio"` e aprovar tudo. O role deve ser lido da sessao no servidor.

**Criterios de Aceite**:
- [ ] `approveEntity`, `rejectEntity`, `batchApproveEntities` leem role via `await auth()`
- [ ] Parametro `userRole` removido da interface publica
- [ ] Componentes que chamam estas actions atualizados (remover envio de role)
- [ ] Teste unitario: chamar action sem sessao retorna erro 401

**Arquivos**: `src/lib/approval/actions.ts`, `src/components/approval/approval-actions.tsx`, `src/components/approval/batch-approval-bar.tsx`

---

### SEC-002: Gerar AUTH_SECRET criptografico
**Prioridade**: P0 | **Esforco**: PP

**Descricao**: `.env.local` usa string legivel como AUTH_SECRET. Gerar valor criptografico com `openssl rand -base64 32`.

**Criterios de Aceite**:
- [ ] AUTH_SECRET em `.env.local` substituido por valor gerado com `openssl rand -base64 32`
- [ ] `.env.example` mantem instrucao de geracao
- [ ] Documentado em CONTRIBUTING.md que AUTH_SECRET deve ser criptografico

---

### SEC-003: Expandir RBAC middleware para rotas sensiveis
**Prioridade**: P1 | **Esforco**: P

**Descricao**: Apenas `/cofre` e `/configuracoes` tem protecao RBAC. Expandir para rotas financeiras, aprovacoes e configuracoes de faturamento.

**Criterios de Aceite**:
- [ ] Rotas `/financeiro`, `/contas-a-pagar`, `/faturamento` restritas a `socio`, `admin`, `financeiro`
- [ ] Rotas de aprovacao (`*/aprovacoes`) restritas a `socio`, `admin`
- [ ] Redirect para /dashboard com toast informativo quando acesso negado
- [ ] Teste: usuario com role `advogado` nao acessa /financeiro

**Arquivos**: `src/middleware.ts`

---

### SEC-004: Enforced Zod validation em server actions
**Prioridade**: P1 | **Esforco**: P

**Descricao**: 11 schemas Zod definidos em `src/lib/schemas/index.ts` mas nenhum e usado para validar input nas server actions. Adicionar `.parse()` em todas as actions.

**Criterios de Aceite**:
- [ ] Todas as server actions em `src/lib/actions/` usam schema correspondente via `.parse()`
- [ ] Approval actions validam com `approvalActionSchema` e `batchApprovalSchema`
- [ ] Erros de validacao retornam mensagem amigavel em pt-BR
- [ ] Teste: enviar dados invalidos retorna erro de validacao

**Arquivos**: `src/lib/actions/*.ts`, `src/lib/approval/actions.ts`

---

### SEC-005: Adicionar CSP e security headers
**Prioridade**: P1 | **Esforco**: PP

**Descricao**: Sem Content-Security-Policy ou outros headers de seguranca. Adicionar via `next.config.ts`.

**Criterios de Aceite**:
- [ ] CSP header com `default-src 'self'`, script-src, style-src configurados
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Strict-Transport-Security` configurado para producao

**Arquivos**: `next.config.ts`

---

### SEC-006: Implementar rate limiting em auth e actions
**Prioridade**: P1 | **Esforco**: P

**Descricao**: Sem rate limiting em nenhum endpoint. Vulneravel a brute force no login e spam de aprovacoes.

**Criterios de Aceite**:
- [ ] Rate limit no endpoint de login (max 5 tentativas por IP em 15min)
- [ ] Rate limit em server actions de aprovacao (max 30 por minuto por sessao)
- [ ] Resposta com status 429 e mensagem amigavel
- [ ] Considerar `upstash/ratelimit` ou implementacao in-memory para MVP

---

## INFRA — Infraestrutura & CI/CD

### INFRA-001: Configurar GitHub Actions CI
**Prioridade**: P0 | **Esforco**: P

**Descricao**: Sem pipeline CI/CD. Criar workflow basico que rode em PRs e push para main.

**Criterios de Aceite**:
- [ ] `.github/workflows/ci.yml` com jobs: lint, type-check, test, build
- [ ] Roda em `push: main` e `pull_request: main`
- [ ] Cache de `node_modules` e `.next`
- [ ] Status check obrigatorio para merge

---

### INFRA-002: Conectar banco PostgreSQL + migrations
**Prioridade**: P1 | **Esforco**: M

**Descricao**: Schema Drizzle definido com 27 tabelas mas sem conexao real. Configurar pool e gerar migrations.

**Criterios de Aceite**:
- [ ] `src/lib/db/index.ts` exporta pool de conexao configuravel via `DATABASE_URL`
- [ ] `npx drizzle-kit generate` gera migrations a partir do schema
- [ ] `npx drizzle-kit push` aplica schema em banco local
- [ ] Script de seed com dados iniciais (roles, usuario admin)
- [ ] `docker-compose.yml` com PostgreSQL para desenvolvimento local

**Arquivos**: `src/lib/db/index.ts` (novo), `drizzle.config.ts`, `docker-compose.yml` (novo)

---

### INFRA-003: Dockerfile e docker-compose para dev
**Prioridade**: P2 | **Esforco**: P

**Descricao**: Sem containerizacao. Criar Dockerfile multi-stage e docker-compose para ambiente de desenvolvimento completo.

**Criterios de Aceite**:
- [ ] `Dockerfile` multi-stage (deps → build → runner)
- [ ] `docker-compose.yml` com app + PostgreSQL + volume persistente
- [ ] `.dockerignore` configurado
- [ ] `npm run docker:dev` como shortcut

---

### INFRA-004: Configurar environments (staging/production)
**Prioridade**: P2 | **Esforco**: P

**Descricao**: Apenas `.env.local`. Criar separacao de ambientes.

**Criterios de Aceite**:
- [ ] `.env.staging` e `.env.production` templates
- [ ] Variavel `NEXT_PUBLIC_ENV` para indicar ambiente na UI
- [ ] Log level diferente por ambiente
- [ ] Health check endpoint `/api/health`

---

## QUAL — Qualidade de Codigo

### QUAL-001: Instalar Vitest + primeiros testes
**Prioridade**: P0 | **Esforco**: P

**Descricao**: Zero testes no projeto. Instalar Vitest e criar testes para o modulo de aprovacao (mais critico).

**Criterios de Aceite**:
- [ ] `vitest` instalado e configurado com `vitest.config.ts`
- [ ] Testes para `canUserApprove()` — todas combinacoes role x entity
- [ ] Testes para transition maps (PAYABLE_TRANSITIONS, etc.)
- [ ] Testes para `approveEntity` / `rejectEntity` (mock de sessao)
- [ ] Coverage report gerado em CI
- [ ] Script `npm run test` funcional

---

### QUAL-002: Criar error.tsx e loading.tsx globais
**Prioridade**: P1 | **Esforco**: PP

**Descricao**: Nenhum error boundary ou loading state. Criar fallbacks no grupo (dashboard).

**Criterios de Aceite**:
- [ ] `src/app/(dashboard)/error.tsx` com mensagem amigavel + botao reset
- [ ] `src/app/(dashboard)/loading.tsx` com skeleton layout
- [ ] `src/app/(dashboard)/not-found.tsx` com mensagem 404

**Arquivos**: 3 novos arquivos no grupo `(dashboard)`

---

### QUAL-003: Configurar Prettier
**Prioridade**: P2 | **Esforco**: PP

**Descricao**: Sem formatter automatico. Adicionar Prettier com config consistente.

**Criterios de Aceite**:
- [ ] `.prettierrc` com `tabWidth: 4`, `printWidth: 120`, `singleQuote: false`
- [ ] `.prettierignore` com `.next`, `node_modules`
- [ ] Script `npm run format`
- [ ] Integrado no CI (check mode)

---

### QUAL-004: Adicionar testes e2e com Playwright
**Prioridade**: P2 | **Esforco**: M

**Descricao**: Sem testes end-to-end. Adicionar Playwright com fluxos criticos.

**Criterios de Aceite**:
- [ ] Playwright instalado e configurado
- [ ] Teste e2e: login flow
- [ ] Teste e2e: criar lead → enviar proposta → aprovar
- [ ] Teste e2e: criar conta a pagar → aprovar → marcar pago
- [ ] Roda no CI

---

## AUTH — Autenticacao

### AUTH-001: Implementar Azure AD provider
**Prioridade**: P0 | **Esforco**: P

**Descricao**: Auth e mock. Implementar Azure AD (Microsoft Entra ID) como provider real.

**Criterios de Aceite**:
- [ ] Provider Azure AD configurado em `src/auth.ts`
- [ ] Mock Credentials mantido apenas quando `NODE_ENV === "development"`
- [ ] JWT callbacks propagam claims do Azure AD (azureId, role, groups)
- [ ] Role mapeado a partir de groups do Azure AD
- [ ] Login redirect funcional para portal Microsoft
- [ ] Logout limpa sessao e redireciona

**Arquivos**: `src/auth.ts`

---

## DATA — Banco de Dados & Dados

### DATA-001: Substituir mock data por queries reais
**Prioridade**: P1 | **Esforco**: GG

**Descricao**: Todos os modulos usam `useState` com dados hardcoded. Migrar para queries Drizzle reais.

**Criterios de Aceite**:
- [ ] Cada modulo com server action que faz SELECT real
- [ ] Paginacao server-side (cursor ou offset)
- [ ] Filtros e busca executados no banco (WHERE/ILIKE)
- [ ] Mutacoes (create/update/delete) persistem no banco
- [ ] Prioridade de migracao: Leads → Casos → Contas a Pagar → Faturamento

---

### DATA-002: Adicionar indexes em FKs e campos de busca
**Prioridade**: P2 | **Esforco**: PP

**Descricao**: Schema sem indexes alem de PKs. Adicionar indexes para FKs e campos frequentemente filtrados.

**Criterios de Aceite**:
- [ ] Index em todos FKs (clientId, caseId, leadId, etc.)
- [ ] Index em `leads.status`, `leads.temperature`
- [ ] Index em `accountsPayable.approvalStatus`, `accountsPayable.dueDate`
- [ ] Index em `timeEntries.date`, `timeEntries.approvalStatus`
- [ ] Index em `auditLogs.createdAt`, `auditLogs.tableName`

**Arquivos**: `src/lib/db/schema.ts`

---

### DATA-003: Implementar soft-delete
**Prioridade**: P2 | **Esforco**: P

**Descricao**: Exclusao e permanente. Adicionar coluna `deletedAt` e filtro global.

**Criterios de Aceite**:
- [ ] Coluna `deletedAt` (timestamp, nullable) nas tabelas principais
- [ ] Helper `withSoftDelete()` que adiciona `WHERE deletedAt IS NULL`
- [ ] Server actions de delete setam `deletedAt` em vez de DELETE
- [ ] UI mostra opcao "Restaurar" para itens soft-deleted (apenas admin)

---

### DATA-004: Popular audit logs reais
**Prioridade**: P1 | **Esforco**: P

**Descricao**: Tabela `auditLogs` definida mas nunca populada. Implementar logging real.

**Criterios de Aceite**:
- [ ] Helper `logAudit({ table, recordId, action, userId, before, after })`
- [ ] Chamado em todas mutacoes (create, update, delete, approve, reject)
- [ ] Pagina `/seguranca-logs` exibe logs reais com filtros
- [ ] Dados sensibles mascarados (email, CNPJ parcial)

---

## UX — Experiencia do Usuario

### UX-001: Criar componentes base (Button, Input, Modal, Select)
**Prioridade**: P2 | **Esforco**: M

**Descricao**: Botoes e inputs com classes inline repetidas. Criar componentes base reutilizaveis.

**Criterios de Aceite**:
- [ ] `Button` com variants: primary, secondary, ghost, danger + sizes: sm, md
- [ ] `Input` com label, error state, icon slot
- [ ] `Select` com opcoes e estado controlado
- [ ] `Modal` / `Dialog` com overlay, close, focus trap
- [ ] Todos os componentes usam design tokens existentes
- [ ] Migrar botoes e inputs existentes para usar componentes base

**Arquivos**: `src/components/ui/button.tsx`, `input.tsx`, `select.tsx`, `modal.tsx`

---

### UX-002: Responsividade mobile
**Prioridade**: P2 | **Esforco**: G

**Descricao**: Sidebar fixa, tabelas sem scroll, sem breakpoints mobile. Tornar o app usavel em tablets e celulares.

**Criterios de Aceite**:
- [ ] Sidebar colapsa em hamburger menu abaixo de `lg`
- [ ] Tabelas com scroll horizontal em telas pequenas
- [ ] Dashboard grid responsivo (1 col em mobile, 2 em tablet, 3 em desktop)
- [ ] Forms empilham verticalmente em mobile
- [ ] Testado em 375px, 768px, 1024px, 1440px

---

### UX-003: Acessibilidade (a11y)
**Prioridade**: P2 | **Esforco**: M

**Descricao**: Poucos atributos ARIA, sem skip-to-content, sem focus management.

**Criterios de Aceite**:
- [ ] Skip-to-content link no layout
- [ ] Todos os botoes interativos com `aria-label` ou texto visivel
- [ ] Focus trap em modais e dropdowns
- [ ] Cores com contraste minimo WCAG AA (4.5:1)
- [ ] Navegacao por teclado em todas as tabelas e formularios

---

## FEAT — Funcionalidades

### FEAT-001: Implementar Azure AD SSO completo
**Prioridade**: P0 | **Esforco**: P

**Descricao**: Dependencia de AUTH-001. Apos provider configurado, implementar SSO completo com group mapping.

**Criterios de Aceite**:
- [ ] Login via Microsoft SSO funcional
- [ ] Groups do Azure AD mapeados para roles do sistema
- [ ] Provisioning automatico de usuario no primeiro login
- [ ] Profile photo do Azure AD exibida no header

---

### FEAT-002: Notificacoes em tempo real
**Prioridade**: P3 | **Esforco**: G

**Descricao**: Notificacoes no dashboard sao mock. Implementar sistema real.

**Criterios de Aceite**:
- [ ] Tabela `notifications` no schema
- [ ] Notificacao criada automaticamente em eventos de negocio (aprovacao, vencimento, etc.)
- [ ] Badge com contagem no header
- [ ] Dropdown de notificacoes com mark-as-read

---

### FEAT-003: Multi-tenancy
**Prioridade**: P3 | **Esforco**: GG

**Descricao**: Sistema e single-tenant. Projetar e implementar isolamento multi-tenant.

**Criterios de Aceite**:
- [ ] Coluna `tenantId` em todas tabelas de negocio
- [ ] Middleware que injeta tenant context na request
- [ ] Todas queries filtram por tenant automaticamente
- [ ] Onboarding de novo tenant via admin panel
- [ ] Dados de um tenant nunca visiveis para outro

---

## Ordem de Execucao Recomendada

### Sprint 1 — Fundacao (P0)
1. SEC-001: Role na sessao
2. SEC-002: AUTH_SECRET
3. QUAL-001: Vitest + testes aprovacao
4. INFRA-001: CI/CD
5. QUAL-002: Error/loading states

### Sprint 2 — Seguranca (P1)
6. SEC-003: RBAC expandido
7. SEC-004: Zod enforced
8. SEC-005: CSP headers
9. SEC-006: Rate limiting
10. AUTH-001: Azure AD

### Sprint 3 — Banco (P1)
11. INFRA-002: PostgreSQL + migrations
12. DATA-001: Queries reais (Leads, Casos)
13. DATA-004: Audit logs reais
14. DATA-001 (cont.): Queries reais (Financeiro)

### Sprint 4 — Polimento (P2)
15. UX-001: Componentes base
16. UX-002: Responsividade
17. DATA-002: Indexes
18. INFRA-003: Docker
19. QUAL-003: Prettier
20. DATA-003: Soft-delete
