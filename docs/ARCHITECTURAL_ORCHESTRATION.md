# FULL ARCHITECTURAL ORCHESTRATION — PF Advogados ERP

> **Date**: 2026-03-03
> **Mode**: Strategic Analysis — No Code Generation
> **Source of Truth**: AGENT.md (domain), SYSTEM_BASELINE_V1.md (structural invariants), schema.ts (24 tables)
> **Current State**: 79 tests passing, 13/17 pages migrated, 28 server actions, zero DB connections active

---

## TABLE OF CONTENTS

1. [Specialist Analyses](#1-specialist-analyses)
2. [Consolidated Risk Map](#2-consolidated-risk-map)
3. [Backlog P0/P1/P2](#3-backlog-p0p1p2)
4. [6-Week Execution Roadmap](#4-6-week-execution-roadmap)
5. [Definition of Done per Module](#5-definition-of-done-per-module)
6. [Executive Validation Checklist](#6-executive-validation-checklist)
7. [Minimal Architecture Diagram](#7-minimal-architecture-diagram)

---

## 1. SPECIALIST ANALYSES

### 1.1 Domain Architect

**System State Assessment**

The system implements a correct domain model for a law firm back-office: Lead → Client → Case is enforced as a mandatory hierarchy (SYSTEM_BASELINE_V1.md invariant #1). The 24-table schema covers CRM, execution, billing, finance, and partner vault — all domains specified in AGENT.md. Drizzle relations are fully defined, enabling type-safe joins across the entire graph.

**Cross-Reference with Domain Constraints**

| AGENT.md Requirement | Schema Coverage | Gap |
|---|---|---|
| Lead → Client → Case hierarchy | `leads`, `clients`, `cases` with correct FKs | No automated conversion trigger |
| 4 billing types (mensal, hora, misto, exito) | `billingPlans.type` varchar supports all | No DB-level enum constraint |
| NFS-e SP (14.53%) | `billingPlans.taxRate` defaults to "14.53" | No NFS-e emission logic |
| Conciliation Itau/BTG | `bankTransactions.bank` field, `reconciliationMatches` | No import pipeline, no auto-match |
| Cofre (min cash rule) | `distributions.minCashRule` decimal | No enforcement logic |
| Audit on sensitive ops | `auditLogs` table with oldData/newData JSONB | Table exists, zero writes |
| AI never writes final records | N/A (Phase 2) | Not scoped |

**5 Structural Risks**

1. **Entity lifecycle has no state machine enforcement at DB level** — transitions are defined in TypeScript (`approval/types.ts`) but nothing prevents a direct SQL update bypassing the transition map. A `CHECK` constraint or trigger would harden this.
2. **`proposals.content` is untyped JSONB** — the 4-tab proposal editor writes arbitrary JSON. Schema evolution of this blob is unmanaged. A breaking change in the editor could corrupt existing proposals silently.
3. **`supplierId` on `accountsPayable` is varchar, not FK** — no `suppliers` table exists. This means no normalized supplier management, no deduplication, no supplier-level reporting.
4. **No `workflows` table in schema** — the Workflows page has full UI but zero backend support. Adding this table later will be the only schema addition required outside the existing 24 tables.
5. **`caseMembers` junction table is empty and untested** — AGENT.md mandates "advogado sees only cases where member", but the membership mechanism has no seed data and no query integration.

**5 Execution Gaps**

1. `proposal.won` automation (creates client + case + cost_center + drive_folder + billing_plan) exists only as a specification in AGENT.md — zero implementation.
2. `pre_invoice.approved` automation (emit NFS-e + create ar_title + send email) — zero implementation.
3. Case cost center allocation — `cases.costCenter` field exists but is never populated or used.
4. Drive folder creation — `cases.driveFolderId` and `driveFolders` table exist but are never written to.
5. Exception queue — `exceptionQueue` table exists but no automation writes failures to it.

**5 Tactical Actions**

1. Add `CHECK` constraints on `approvalStatus` columns to restrict to valid values per entity type.
2. Define a TypeScript interface for `proposals.content` JSONB and validate on read/write.
3. Seed `caseMembers` with membership data for the 3 existing cases and 4 users.
4. Create a `workflows` table with `id`, `name`, `trigger`, `steps` (JSONB), `active` (boolean), `createdAt` — minimal design.
5. Add a `stage` enum field to `leads` table (or use existing `status` field consistently) to align the DB column with the page's pipeline grouping logic.

**Acceptance Validation**

- [ ] Every FK in schema.ts resolves to an existing table
- [ ] Every AGENT.md entity has a corresponding table
- [ ] Seed data covers at least one row per table with active FKs
- [ ] `SYSTEM_BASELINE_V1.md` invariants (#1-#9) are not violated by any proposed change

---

### 1.2 ERP Product Owner

**System State Assessment**

The ERP covers 100% of the UI surface described in AGENT.md across 17 dashboard pages + 6 cadastro sub-pages + approval sub-routes. Users can navigate every module, see realistic mock data, and perform CRUD operations (client-side only). The backend activation work (13 pages migrated to server actions with fallback) brings the system to a point where `docker-compose up` + `db:push` + `db:seed` would immediately activate 60% of read operations.

**Cross-Reference with Client Pain Points (AGENT.md)**

| Pain Point | Module | Status |
|---|---|---|
| Replace Monday for project management | Casos + Tasks | UI complete, DB not connected |
| Replace Clockify for time tracking | Time Tracking | UI complete, timer works, no persistence |
| Replace Zapier automations | Workflows + Server Actions | UI mock only, no automation engine |
| Manual billing generates errors | Faturamento + Billing Engine | UI complete, engine is mock simulation |
| No financial visibility | Financeiro + Cofre + Fluxo de Caixa | UI complete, data is static |
| Proposal generation is manual | Propostas + Editor | 4-tab editor works, no PDF generation |
| No time approval workflow | Aprovacoes | Full approval UI + authority matrix, no DB write |

**5 Structural Risks**

1. **Timer data loss** — The time tracking timer runs client-side. If the user closes the browser, the running timer and its accumulated time are lost. There is no heartbeat or autosave mechanism.
2. **Billing engine is pure simulation** — "Rodar Engine de Fechamento" generates a mock invoice from a hardcoded array. It does not query time entries, does not calculate hours, does not create real pre-invoices.
3. **Proposal versioning is unused** — `proposalVersions` table exists but the proposal editor always overwrites the current version. No version history is accessible to the user.
4. **Approval actions return success without persistence** — The user clicks "Aprovar", sees a toast "Aprovado com sucesso", but nothing is written to the database. The next page load reverts the status.
5. **Dashboard KPIs are hardcoded** — Pipeline funnel, financial summary, and cashflow chart show static numbers that don't reflect actual data state.

**5 Execution Gaps**

1. No "Create Client from Lead" button or flow — the conversion trigger specified in AGENT.md doesn't exist.
2. No "Convert Proposal to Case" with automatic billing plan — the button exists on `propostas/page.tsx` but navigates to a blank form.
3. No recurring billing plan execution — monthly fixed billing should auto-generate pre-invoices on a schedule.
4. No overdue alerts — `ar_titles` and `accounts_payable` have due dates but no notification when past due.
5. No partner distribution calculation — Cofre page shows mock distribution but doesn't compute from real financial data.

**5 Tactical Actions**

1. Implement `approveEntity` / `rejectEntity` DB mutations — replace the TODOs in `approval/actions.ts` with actual `db.update()` calls.
2. Add `createTimeEntry()` call on timer stop — persist the accumulated time to DB immediately.
3. Build `generatePreInvoicesForPeriod(period)` — query approved time entries for the period, group by case, create pre_invoices with calculated line items.
4. Connect Dashboard KPIs to aggregate queries: `SUM(ar_titles.value)`, `COUNT(leads) GROUP BY status`, `SUM(accounts_payable.value) WHERE status = 'pendente'`.
5. Implement `convertLeadToClient(leadId)` — create client record, link to lead, optionally create initial case.

**Acceptance Validation**

- [ ] Every module listed in AGENT.md has: working list view, working detail/edit view, working create form, working server action with DB persistence
- [ ] Approval workflow persists across page reload
- [ ] Timer data survives browser close (or warns user before losing data)
- [ ] At least one full business cycle works end-to-end: Lead → Client → Case → Time Entry → Approval → Pre-Invoice → Invoice

---

### 1.3 Workflow Systems Architect

**System State Assessment**

The system has two distinct workflow mechanisms:

1. **Approval state machine** (`approval/types.ts`) — Well-defined with `PAYABLE_TRANSITIONS`, `RECEIVABLE_TRANSITIONS`, `TIME_ENTRY_TRANSITIONS`. Authority matrix restricts approve/reject to `socio` and `admin`. Transition validation exists in TypeScript but not at DB level.

2. **Workflows module** (`workflows/page.tsx`) — Pure UI with draggable step definitions. No backend table, no execution engine, no trigger system. This is entirely decorative.

AGENT.md defines 3 critical automations:
- `proposal.won` → 6 sequential side effects
- `pre_invoice.approved` → 3 sequential side effects (NFS-e + AR title + email)
- `daily_bank_import` → match → settle → update cashflow

None of these exist beyond specification.

**5 Structural Risks**

1. **No event bus or trigger mechanism** — There is no pub/sub, no event emitter, no webhook handler. Automations have no infrastructure to fire on entity state changes.
2. **Approval transitions are not atomic** — `approveEntity` in `actions.ts` does not use a DB transaction. If the status update succeeds but the audit log write fails, the system is in an inconsistent state.
3. **No retry or idempotency on automations** — If `pre_invoice.approved` fires NFS-e emission and it fails mid-way, there is no mechanism to retry or detect partial completion.
4. **No compensation logic** — If a step in `proposal.won` (6 steps) fails at step 4, there is no rollback for steps 1-3.
5. **`exceptionQueue` table exists but has no consumer** — Failed automation steps would be written here (per AGENT.md), but nothing reads this table, renders it in UI, or retries the failed step.

**5 Execution Gaps**

1. No `onStatusChange` hook — entity status changes (payable, receivable, time_entry) don't trigger any side effects.
2. No scheduled job runner — `daily_bank_import` and `monthly_billing_run` need a cron mechanism (Vercel Cron, external scheduler, or in-app poller).
3. No workflow definition storage — the `/workflows` page creates workflow definitions client-side but has nowhere to persist them.
4. No workflow execution history — even if workflows existed, there's no `workflow_runs` or `workflow_logs` table to track executions.
5. No email/notification delivery — multiple automations end with "send email" but there is no email provider integration (SendGrid, SES, Resend).

**5 Tactical Actions**

1. Implement approval DB persistence as a transactional operation: `db.transaction(async (tx) => { update status, insert auditLog })`.
2. Create a `triggerPostApproval(entityType, entityId, newStatus)` function that dispatches side effects based on entity type and new status — this is the minimal "event bus" without infrastructure overhead.
3. Add `workflows` table to schema: `{ id, name, triggerType, triggerEntityType, steps: jsonb, isActive, createdAt }`.
4. Create `exceptionQueue` reader in aprovacoes page — show failed automation items alongside pending approvals.
5. Use Next.js Route Handlers (`app/api/cron/`) for scheduled jobs, protected by a secret header — no external infrastructure needed.

**Acceptance Validation**

- [ ] `approveEntity` + `rejectEntity` use `db.transaction()` with audit log
- [ ] Status change on any entity triggers `triggerPostApproval`
- [ ] `exceptionQueue` has at least one test scenario (insert + read)
- [ ] Workflow definitions persist in DB (create, list, toggle active)
- [ ] Approval revert (reject → pendente) works correctly through transition map

---

### 1.4 Billing & Financial Engine Specialist

**System State Assessment**

The billing domain has the most complete schema design and the largest implementation gap:

**Schema readiness**: `billingPlans` supports all 4 types, `preInvoices` has JSONB line items, `invoices` has NFS-e fields, `arTitles` tracks receivables, `cashflowDaily` stores projections. Tax rate is configurable per plan (default 14.53%).

**Implementation reality**: The "Engine de Fechamento" button on `/faturamento` appends a hardcoded mock invoice to local state. No calculation, no time entry aggregation, no billing plan lookup.

**Financial data flow (intended vs actual)**:

```
INTENDED: TimeEntries(approved) → BillingPlan(lookup) → PreInvoice(generated) → Approval → Invoice(NFS-e) → AR Title → Bank Reconciliation → Cashflow
ACTUAL:   TimeEntries(mock) → [nothing] → PreInvoice(mock) → [approval returns success, no DB write] → [nothing] → AR Title(mock) → [nothing] → Cashflow(hardcoded)
```

**5 Structural Risks**

1. **`preInvoices.lineItems` is untyped JSONB** — No TypeScript interface defines the shape of line items. Each UI component could write a different structure. Aggregation queries will break on inconsistent JSON.
2. **No billing plan ↔ time entry linkage logic** — `timeEntries.preInvoiceId` FK exists but nothing populates it. The closing engine should: query approved entries for case, look up billing plan, calculate values, set `preInvoiceId` on matched entries.
3. **Mixed billing (`misto`) has no cap enforcement** — AGENT.md specifies a cap-of-hours: fixed monthly fee covers X hours, excess is billed hourly. `billingPlans` has `value` (monthly) and `hourlyRate` but no `includedHours` or `hourCap` field.
4. **Success fee (`exito`) has no trigger condition** — The billing plan type "exito" exists but there's no mechanism to define what "success" means (case outcome, threshold, date) or trigger the fee.
5. **NFS-e emission is entirely absent** — Invoice table has `nfseNumber`, `nfseVerificationCode`, `nfseXml`, `nfsePdfUrl`, `providerResponse` — all null, all waiting for Focus NFe or Enotas integration that doesn't exist.

**5 Execution Gaps**

1. No `generatePreInvoice(caseId, period)` function — the core billing engine operation.
2. No hourly rate calculation: `SUM(timeEntries.duration WHERE approved AND case=X AND period=Y) * billingPlan.hourlyRate`.
3. No discount/writeoff workflow — `arTitles` has `requestedAction` (desconto/baixa) and `requestedBy` fields, and the approval types support it, but no UI flow to request or process these.
4. No reconciliation matching logic — `reconciliationMatches.confidence` field exists for auto-matching bank transactions to AR titles, but zero implementation.
5. No cashflow projection — `cashflowDaily` has `projectedIn` and `projectedOut` fields but nothing computes projections from billing plans + payable schedules.

**5 Tactical Actions**

1. Define `PreInvoiceLineItem` TypeScript interface: `{ description, quantity, unitValue, totalValue, timeEntryIds[], type: 'fixed'|'hourly'|'success' }`. Validate on write.
2. Implement `closePeriod(caseId, period)`:
   - Query `billingPlans WHERE caseId AND active`
   - Query `timeEntries WHERE caseId AND period AND approvalStatus='aprovado' AND preInvoiceId IS NULL`
   - Calculate: fixed → use plan value; hourly → sum(duration) × rate; mixed → fixed + max(0, sum(duration) - cap) × rate
   - Insert `preInvoices` with computed `lineItems` and `totalValue`
   - Update matched `timeEntries.preInvoiceId`
3. Add `includedHours` (integer, nullable) to `billingPlans` for mixed billing cap enforcement.
4. Build bank reconciliation auto-match: `SELECT bt.*, art.* FROM bankTransactions bt, arTitles art WHERE ABS(bt.amount - art.value) < 0.01 AND bt.date BETWEEN art.dueDate - 3 AND art.dueDate + 7 AND bt.reconciled = false`.
5. Implement cashflow projection query: for each future month, sum billing plan monthly values (projected in) + sum scheduled payables (projected out).

**Acceptance Validation**

- [ ] `closePeriod` generates accurate pre-invoice for each billing type (fixed, hourly, mixed)
- [ ] Pre-invoice line items match time entry hours with rounding to 2 decimal places
- [ ] `preInvoiceId` is set on all time entries included in the pre-invoice
- [ ] Bank reconciliation matches at least the seed data (10 transactions → 5 AR titles)
- [ ] Cashflow projections for next 3 months are non-zero when billing plans exist

---

### 1.5 UX Simplicity Engineer

**System State Assessment**

The interface follows a consistent flat design language: `#F4F5F7` background, no card wrappers on list pages, rows hover to white, collapsible groups with chevron rotation. Typography is well-executed: Inter for body, JetBrains Mono for numbers, Zen Dots only for the logo mark.

Page structure is standardized: `PageHeader` → KPI strip → `ReportToolbar` (search + filters + density + column visibility) → collapsible table. This pattern is replicated across 13+ pages with minor variations.

**Cross-Reference with Domain Constraints**

AGENT.md targets 4 user roles with very different needs:
- **Socio**: Needs dashboard overview, approval queue, cofre visibility — executive view
- **Advogado**: Needs time tracking, case details, task management — operational view
- **Financeiro**: Needs billing, receivables, payables, reconciliation — financial view
- **Admin**: Needs everything + configuration

Current UI shows ALL modules to ALL users. There is no role-based menu filtering.

**5 Structural Risks**

1. **Information overload on sidebar** — 16+ menu items visible to every role. A `financeiro` user doesn't need Time Tracking; an `advogado` doesn't need Cofre. No progressive disclosure.
2. **No loading states on async pages** — 13 pages now load data via `useEffect` but show empty tables during the fetch. No skeleton, no spinner, no `loading.tsx` global fallback.
3. **Leads page is 1500+ lines** — This monolith includes inline types, data, grouping logic, inline editing, star/select/notes, timeline, and Kanban column mapping. Any change risks regressions.
4. **No mobile responsiveness** — All pages assume desktop width. `grid-cols-4` KPI strips and wide tables break on mobile. Law firm partners often check dashboards on phones.
5. **No error boundaries** — A single failed server action can crash the entire page. No `error.tsx` exists at any route level.

**5 Execution Gaps**

1. No role-based sidebar filtering — all users see all menu items regardless of their role.
2. No confirmation dialogs on destructive actions — delete lead, reject invoice, reject time entry have no "Are you sure?" step.
3. No empty state illustrations — `EmptyState` component exists but uses text-only. A brief illustration or icon would improve scannability.
4. No keyboard shortcuts — power users (especially advogados tracking time) would benefit from `Ctrl+T` for timer, `Ctrl+S` for save.
5. No breadcrumb navigation — sub-pages (`/casos/novo`, `/propostas/nova`, `/leads/[id]`) have no clear path back to parent.

**5 Tactical Actions**

1. Create `loading.tsx` at `(dashboard)/` layout level with skeleton pattern matching the `PageHeader` → KPI → table structure.
2. Create `error.tsx` at `(dashboard)/` layout level that catches errors gracefully with "Ocorreu um erro" + retry button.
3. Filter sidebar menu items based on `session.user.role` — hide Cofre for non-socio, hide Configuracoes for non-admin.
4. Add `ConfirmDialog` component (modal with "Confirmar" / "Cancelar") and require it for: delete, reject, and any irreversible status change.
5. Add responsive breakpoints to KPI grids: `grid-cols-2 lg:grid-cols-4` (already partially done on some pages — standardize across all).

**Acceptance Validation**

- [ ] Every page with `useEffect` data loading shows a skeleton or spinner during load
- [ ] Error on any page renders `error.tsx` instead of crashing
- [ ] Sidebar shows only role-appropriate menu items
- [ ] Destructive actions require confirmation
- [ ] KPI strip is readable on 375px viewport width

---

### 1.6 QA / Failure Mode Analyst

**System State Assessment**

79 tests passing (Vitest), all in `src/lib/approval/__tests__/`. Coverage is focused on the approval module: authority matrix, transition validation, schema parsing, rate limiting, role-based access. No integration tests, no component tests, no E2E tests.

**Test Coverage Map**

| Domain | Unit Tests | Integration Tests | E2E Tests |
|---|---|---|---|
| Approval types | 36 | 0 | 0 |
| Approval actions | 43 | 0 | 0 |
| Server actions (8 files) | 0 | 0 | 0 |
| DB queries | 0 | 0 | 0 |
| Components (15+) | 0 | 0 | 0 |
| Pages (17+) | 0 | 0 | 0 |
| Auth flow | 0 | 0 | 0 |

**5 Structural Risks**

1. **Zero test coverage on server actions** — 28 functions across 8 files process user input, query databases, and return sensitive data. None are tested. A Zod schema change or Drizzle query change could silently break any of them.
2. **Mock fallback masks real failures** — Every server action has `try { db query } catch { return mock }`. This means a database misconfiguration, a schema mismatch, or a query error will silently return mock data instead of failing. In production, users would see stale/incorrect data without any error signal.
3. **No boundary testing on financial calculations** — `formatCurrency`, `parseBRL` (used in faturamento page inline), and billing calculations involve decimal arithmetic. No tests verify rounding, edge cases (zero, negative, very large values), or locale formatting correctness.
4. **Rate limiting is time-based with no persistence** — `rateLimitApproval` uses an in-memory `Map`. Server restart clears all rate limit state. In a serverless environment (Vercel), each function instance has its own map — rate limiting is effectively non-functional.
5. **No test for auth session mock** — `auth.ts` returns a mock session with hardcoded UUID. If this UUID doesn't match seed data, every server action that uses `session.user.id` as a FK will silently fail (insert with invalid FK → catch → return mock).

**5 Execution Gaps**

1. No integration test harness — no test database, no Docker test environment, no `beforeAll` setup that creates tables and seeds.
2. No test for `toMockLead`, `toMockInvoice`, `toMockPayable` mappers — these adapter functions are critical path (every server action uses one) but untested.
3. No test for `formatCurrency`, `formatDateBR`, `formatPercent` — utility functions used across all financial displays.
4. No component snapshot tests — no guarantee that UI rendering hasn't regressed after code changes.
5. No test for role-based access denial — server actions return `[]` for unauthenticated users but this path is untested.

**5 Tactical Actions**

1. Create `src/lib/db/__tests__/format.test.ts` — test `formatCurrency`, `formatDateBR`, `formatPercent` with edge cases (null, zero, negative, large numbers, undefined).
2. Create `src/lib/actions/__tests__/` for each action file — mock `auth()` and `db`, test: auth denial returns empty, Zod validation rejects bad input, mapper produces correct output shape.
3. Replace mock fallback `catch {}` with `catch (err) { console.error(...); return []; }` and add a `DATABASE_CONNECTED` health flag — if the DB is expected to be connected, throw instead of falling back.
4. Add integration test setup: `vitest.setup.integration.ts` that uses `postgres` driver to create a test schema, run seed, and clean up after. Guard behind `TEST_DATABASE_URL` env var.
5. Test the auth UUID chain: `auth().user.id` → exists in `users` table → can be used as FK in `leads.responsibleId`, `timeEntries.userId`, etc.

**Acceptance Validation**

- [ ] Every server action has at least 3 tests: auth denial, valid input, invalid input
- [ ] Financial format utilities have edge case coverage (null, zero, negative, >1M)
- [ ] At least one integration test proves: action → DB query → mapper → correct return type
- [ ] Mock fallback is logged (not silent) and flaggable
- [ ] Rate limiting works across multiple requests in a single test run

---

### 1.7 Security & RBAC Specialist

**System State Assessment**

**Fixed since initial review**:
- Role now read from `session` via `getSessionRole()` (was client parameter)
- Rate limiting implemented on approval actions (user-level)
- Zod validation on approval action inputs
- 79 tests covering approval authority matrix

**Still vulnerable**:
- RBAC middleware covers only 2 of 35+ routes (`/cofre`, `/configuracoes`)
- No CSP headers in `next.config.ts`
- AUTH_SECRET is a readable string (not cryptographically strong)
- Approval DB mutations are TODOs — approve/reject/batch don't write to DB
- No audit log writes anywhere in the system

**5 Structural Risks**

1. **33 unprotected routes** — Any authenticated user can access any page including `/cofre` (partner financials), `/configuracoes` (system settings), `/aprovacoes` (approval queue). The middleware at `src/middleware.ts` only checks if a session exists, not the user's role.
2. **No input sanitization beyond Zod on server actions** — While Zod validates shape, it doesn't sanitize HTML/script content in free-text fields like `notes`, `description`, `caseName`. If these are rendered with `dangerouslySetInnerHTML` anywhere (currently they're not, but future risk).
3. **Session role is derived from DB query but not cached** — `getSessionRole()` calls `auth()` on every action invocation. In NextAuth v5 beta, this hits the JWT callback. If the JWT doesn't contain the role (it does in current mock), the role lookup would fail.
4. **No row-level security** — AGENT.md mandates "advogado sees only cases where member". Currently, every query returns ALL records regardless of user. An advogado can see all cases, all time entries, all financial data.
5. **Rate limiting is per-instance, not shared** — Vercel serverless functions each have their own memory space. The in-memory `Map` for rate limiting is not shared across instances. An attacker can bypass rate limits by hitting different function instances.

**5 Execution Gaps**

1. No `userId` filtering on queries — `getCases()`, `getTimeEntries()`, `getLeads()` return all rows, not just those assigned to or visible by the current user.
2. No audit log implementation — `auditLogs` table exists with `userId`, `action`, `entityType`, `entityId`, `oldData`, `newData`, `ipAddress` — all ready. Zero writes.
3. No CSRF protection beyond NextAuth's built-in — server actions are POST by default in Next.js (good), but no custom CSRF token validation.
4. No session invalidation on role change — if an admin downgrades a user from `socio` to `advogado`, the existing JWT session retains `socio` privileges until it expires.
5. No IP-based blocking or geographic restrictions — Cloudflare Zero Trust is mentioned in AGENT.md but not configured.

**5 Tactical Actions**

1. Expand RBAC middleware to cover all route groups:
   - `/cofre`, `/configuracoes` → `admin`, `socio` only
   - `/financeiro`, `/contas-a-pagar`, `/faturamento`, `/fluxo-de-caixa`, `/conciliacao-bancaria` → `financeiro`, `socio`, `admin`
   - `/aprovacoes` → `socio`, `admin` (matches authority matrix)
   - All other routes → any authenticated user
2. Add `userId` WHERE clause to all queries that should be role-scoped: `timeEntries` (user's own + cases where member), `cases` (member-of), `leads` (responsible).
3. Implement audit log writes in a reusable `logAudit(userId, action, entityType, entityId, oldData?, newData?)` utility. Call it in every mutation server action.
4. Replace in-memory rate limiting with a simple DB-based approach: `INSERT INTO rate_limits (userId, action, timestamp)` and `COUNT WHERE timestamp > now() - interval '1 minute'`. Alternatively use Vercel KV if deployed there.
5. Add security headers in `next.config.ts`: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.

**Acceptance Validation**

- [ ] Non-admin user receives 403 when accessing `/cofre` or `/configuracoes`
- [ ] Advogado user cannot see cases they're not a member of
- [ ] Every mutation (create/update/delete) generates an audit log entry
- [ ] Rate limiting blocks >10 approval attempts per minute per user across deployments
- [ ] `next.config.ts` includes CSP, X-Frame-Options, HSTS headers

---

### 1.8 Future Multi-Tenancy Strategist

**System State Assessment**

Current system is explicitly single-tenant. AGENT.md describes an internal tool for PF Advogados. The ERP_SAAS_BACKLOG classifies multi-tenancy as P3 (lowest priority, GG effort). No `tenantId` column exists on any of the 24 tables.

However, the system architecture is being documented as "ERP SaaS" in review documents, suggesting future aspiration to offer this as a product to other law firms.

**5 Structural Risks**

1. **Retrofitting `tenantId` requires touching all 24 tables** — Every table needs a `tenantId` column, every query needs a `WHERE tenantId = ?` filter, every index needs `tenantId` as prefix. This is a massive migration that cannot be done incrementally.
2. **No tenant isolation at any layer** — No DB-level RLS policies, no application-level tenant context, no middleware tenant detection. A multi-tenant deploy would require all three.
3. **`rules` table is global** — System configuration (billing parameters, tax rates, approval rules) is stored without tenant context. Different firms would need different configurations.
4. **Auth mock is single-user** — `auth.ts` returns a hardcoded user. Azure AD integration would need to map external identity to tenant + user.
5. **File storage has no tenant namespace** — `driveFolders`, `proposals.pdfUrl`, `invoices.nfsePdfUrl` all store paths/URLs without tenant prefixing. Shared storage would leak data between tenants.

**5 Execution Gaps**

1. No tenant model defined — is it database-per-tenant, schema-per-tenant, or row-level isolation?
2. No tenant provisioning flow — how does a new law firm onboard?
3. No billing/subscription model for the SaaS itself — how are tenants charged?
4. No data migration tooling — existing PF Advogados data would need to become tenant #1.
5. No tenant admin vs system admin distinction — current `admin` role is system-wide.

**5 Tactical Actions (preparation, not implementation)**

1. **Decision: choose isolation model NOW** before DB goes live. Recommendation: row-level isolation (`tenantId` on every table) — simplest for a small SaaS, Drizzle supports it natively with query wrappers. Document this decision in `SYSTEM_BASELINE_V1.md`.
2. **If multi-tenancy is confirmed as a goal**: add `tenantId` column to schema BEFORE running first `db:push`. Adding it later to a live database with data is orders of magnitude harder.
3. **If multi-tenancy is NOT a goal**: explicitly document this in `SYSTEM_BASELINE_V1.md` as a constraint: "This system is single-tenant by design. Multi-tenancy is not supported and not planned."
4. Create a `TenantContext` provider pattern (even if single-tenant): all queries pass through a function that adds `WHERE tenantId = ctx.tenantId`. For single-tenant, this is hardcoded to a constant. For multi-tenant, it reads from session.
5. Namespace all file storage paths with a prefix: `/tenantId/proposals/`, `/tenantId/invoices/`. This costs nothing now and prevents data leakage later.

**Acceptance Validation**

- [ ] Multi-tenancy decision is documented (yes/no/deferred)
- [ ] If yes: `tenantId` column added to schema before first `db:push`
- [ ] If no: constraint is documented; no `tenantId` columns needed
- [ ] File storage paths include at least an organizational prefix
- [ ] `rules` table has a scope mechanism (global vs tenant-specific)

---

## 2. CONSOLIDATED RISK MAP

### Technical Risks

| # | Risk | Severity | Probability | Impact | Source |
|---|---|---|---|---|---|
| T1 | Mock fallback silently masks DB failures in production | CRITICAL | HIGH | Data integrity — users see stale data, believe it's current | QA Analyst |
| T2 | 33 routes have no RBAC protection | CRITICAL | HIGH | Unauthorized access to financial data, partner vault | Security |
| T3 | Approval actions don't persist to DB | HIGH | CERTAIN | Every approval is lost on page reload | Product Owner |
| T4 | No audit log writes | HIGH | CERTAIN | Compliance failure — no trail for financial decisions | Security |
| T5 | In-memory rate limiting ineffective in serverless | HIGH | HIGH | Brute force possible on approval endpoints | QA Analyst |
| T6 | No loading/error states on async pages | MEDIUM | HIGH | Blank screens, unhandled crashes | UX Engineer |
| T7 | Timer data loss on browser close | MEDIUM | HIGH | Lost billable hours — direct revenue impact | Product Owner |
| T8 | Leads page type mismatch blocks migration | MEDIUM | CERTAIN | Largest module stuck on mock data | Domain Architect |
| T9 | No integration test infrastructure | MEDIUM | CERTAIN | DB query correctness untested | QA Analyst |
| T10 | `preInvoices.lineItems` has no type contract | MEDIUM | MEDIUM | JSON schema drift corrupts billing data | Billing Specialist |

### Business Risks

| # | Risk | Severity | Probability | Impact | Source |
|---|---|---|---|---|---|
| B1 | No end-to-end business cycle works | CRITICAL | CERTAIN | System cannot replace Monday/Clockify/Zapier | Product Owner |
| B2 | Billing engine is simulation only | HIGH | CERTAIN | Manual billing continues, errors persist | Billing Specialist |
| B3 | No NFS-e integration | HIGH | CERTAIN | Invoices cannot be legally issued | Billing Specialist |
| B4 | No bank reconciliation logic | HIGH | CERTAIN | Manual bank matching continues | Billing Specialist |
| B5 | Multi-tenancy decision unresolved | MEDIUM | LOW | Architectural debt if SaaS goal emerges | MT Strategist |
| B6 | No email/notification delivery | MEDIUM | HIGH | Users must check the system manually | Workflow Architect |
| B7 | `proposal.won` automation doesn't exist | MEDIUM | CERTAIN | Manual client/case creation continues | Workflow Architect |
| B8 | No proposal PDF generation | LOW | CERTAIN | Proposals exported as .txt, not professional PDF | Product Owner |

---

## 3. BACKLOG P0 / P1 / P2

### P0 — Blocks Any Production Use

| ID | Item | Effort | Risk Addressed | Specialist |
|---|---|---|---|---|
| P0-01 | Activate DB: `docker-compose up` + `db:push` + `db:seed` + validate 13 pages | 2h | T1, B1 | Domain |
| P0-02 | Implement approval DB mutations (`approveEntity`, `rejectEntity`, `batchApprove`) with `db.transaction` + audit log insert | 4h | T3, T4 | Workflow |
| P0-03 | Expand RBAC middleware to all 35 routes with role-based access table | 4h | T2 | Security |
| P0-04 | Replace silent mock fallback with logged fallback + `DB_CONNECTED` health flag | 2h | T1 | QA |
| P0-05 | Create `loading.tsx` and `error.tsx` at dashboard layout level | 2h | T6 | UX |
| P0-06 | Add security headers (CSP, X-Frame-Options, HSTS) in `next.config.ts` | 1h | T2 | Security |
| P0-07 | Fix AUTH_SECRET to cryptographically strong value | 0.5h | — | Security |

**P0 Total Effort: ~15.5h**

### P1 — Required for First Business Cycle

| ID | Item | Effort | Risk Addressed | Specialist |
|---|---|---|---|---|
| P1-01 | Implement `closePeriod(caseId, period)` billing engine (fixed + hourly) | 8h | B2 | Billing |
| P1-02 | Persist timer data on stop (`createTimeEntry` server action call) | 2h | T7 | Product |
| P1-03 | Connect Dashboard KPIs to aggregate queries | 4h | B1 | Product |
| P1-04 | Implement `convertLeadToClient(leadId)` + create initial case | 4h | B7 | Workflow |
| P1-05 | Add `userId` filtering on role-scoped queries (cases, time entries) | 4h | T2 | Security |
| P1-06 | Seed `caseMembers` data + integrate into case visibility queries | 2h | T2 | Domain |
| P1-07 | Create server action tests (auth denial, Zod rejection, mapper output) for all 8 action files | 8h | T9 | QA |
| P1-08 | Create `format.test.ts` for financial utilities (edge cases) | 2h | T10 | QA |
| P1-09 | Implement discount/writeoff request flow on AR titles | 4h | — | Billing |
| P1-10 | Migrate leads page (enrich `MockLead` return type or create `PageLead` mapper) | 6h | T8 | Domain |
| P1-11 | Bank reconciliation auto-match (amount + date proximity) | 6h | B4 | Billing |
| P1-12 | Add `ConfirmDialog` for destructive actions (delete, reject) | 2h | — | UX |
| P1-13 | Move rate limiting to DB-backed or KV-backed storage | 3h | T5 | Security |
| P1-14 | Implement `logAudit()` utility + call in all mutation actions | 4h | T4 | Security |

**P1 Total Effort: ~59h**

### P2 — Production Polish

| ID | Item | Effort | Risk Addressed | Specialist |
|---|---|---|---|---|
| P2-01 | Azure AD provider configuration + real auth flow | 8h | — | Security |
| P2-02 | NFS-e SP integration (Focus NFe or Enotas) | 16h | B3 | Billing |
| P2-03 | Proposal PDF generation (React-PDF or Puppeteer) | 8h | B8 | Product |
| P2-04 | Email notification integration (Resend or SES) | 6h | B6 | Workflow |
| P2-05 | Add `workflows` table + persist workflow definitions | 4h | — | Workflow |
| P2-06 | Cashflow projection from billing plans + payables | 6h | — | Billing |
| P2-07 | Role-based sidebar menu filtering | 2h | — | UX |
| P2-08 | Mobile responsive KPI grids + table horizontal scroll | 4h | — | UX |
| P2-09 | Integration test setup (test DB, seed, cleanup) | 6h | T9 | QA |
| P2-10 | Cofre page: aggregate queries for partner distribution | 6h | — | Billing |
| P2-11 | Add DB indexes on FK columns (all 24 tables) | 2h | — | Domain |
| P2-12 | Add `includedHours` to `billingPlans` for mixed billing cap | 1h | — | Billing |
| P2-13 | Multi-tenancy decision documentation | 1h | B5 | MT Strategy |
| P2-14 | `exceptionQueue` reader in aprovacoes page | 3h | — | Workflow |
| P2-15 | Daily bank import via API route handler (OFX parser) | 12h | B4 | Billing |
| P2-16 | Google Drive folder creation on case creation | 8h | — | Workflow |

**P2 Total Effort: ~93h**

---

## 4. 6-WEEK EXECUTION ROADMAP

### Week 1 — Foundation & Safety Net

| Day | Deliverable | Items |
|---|---|---|
| Mon | DB live + validated | P0-01 |
| Tue | Approval persistence + audit | P0-02 |
| Wed | RBAC middleware expansion | P0-03 |
| Thu | Error/loading states + health flag | P0-04, P0-05 |
| Fri | Security headers + AUTH_SECRET | P0-06, P0-07 |

**Week 1 Exit Criteria**: All P0 items complete. App connects to DB. Approvals persist. RBAC blocks unauthorized routes. Errors render gracefully.

### Week 2 — First Business Cycle (Billing Core)

| Day | Deliverable | Items |
|---|---|---|
| Mon | Timer persistence + time entry creation | P1-02 |
| Tue-Wed | Billing engine (closePeriod) | P1-01 |
| Thu | Dashboard KPIs connected | P1-03 |
| Fri | Confirm dialog + format tests | P1-12, P1-08 |

**Week 2 Exit Criteria**: Time entries persist. Billing engine generates real pre-invoices from approved time entries. Dashboard shows live numbers. Financial format utilities tested.

### Week 3 — CRM & Security Hardening

| Day | Deliverable | Items |
|---|---|---|
| Mon | Lead → Client conversion | P1-04 |
| Tue | Leads page migration | P1-10 |
| Wed | userId filtering + caseMembers | P1-05, P1-06 |
| Thu | Audit log utility + integration | P1-14 |
| Fri | Rate limiting to persistent store | P1-13 |

**Week 3 Exit Criteria**: Full CRM cycle (Lead → Client → Case) works. Users see only their authorized data. Every mutation is audit-logged. Rate limiting is persistent.

### Week 4 — Financial Operations

| Day | Deliverable | Items |
|---|---|---|
| Mon-Tue | Bank reconciliation auto-match | P1-11 |
| Wed | Discount/writeoff flow on AR titles | P1-09 |
| Thu-Fri | Server action test suite (all 8 files) | P1-07 |

**Week 4 Exit Criteria**: Bank transactions match to AR titles. Discount requests flow through approval. All server actions have baseline test coverage.

### Week 5 — Integration & Polish

| Day | Deliverable | Items |
|---|---|---|
| Mon-Tue | Azure AD + real auth | P2-01 |
| Wed | Sidebar role filtering + mobile KPIs | P2-07, P2-08 |
| Thu | Workflows table + persistence | P2-05 |
| Fri | Cashflow projection + Cofre aggregation | P2-06, P2-10 |

**Week 5 Exit Criteria**: Real authentication. Role-appropriate UI. Workflow definitions persist. Financial projections computed from real data.

### Week 6 — External Integrations & Validation

| Day | Deliverable | Items |
|---|---|---|
| Mon-Tue | NFS-e integration (Focus NFe) | P2-02 (start) |
| Wed | Integration test infrastructure | P2-09 |
| Thu | DB indexes + exception queue reader | P2-11, P2-14 |
| Fri | Multi-tenancy decision doc + review | P2-13, full system validation |

**Week 6 Exit Criteria**: NFS-e integration initiated. Integration tests run against real DB. Performance indexed. Architectural decisions documented.

---

## 5. DEFINITION OF DONE PER MODULE

### CRM (Leads)
- [ ] `getLeads()` returns DB data with enriched fields matching page `Lead` type
- [ ] `createLead()` persists to DB and returns the new lead
- [ ] `updateLead()` handles all 12+ fields including `metadata` JSONB
- [ ] `deleteLead()` removes from DB (or soft-deletes if `deletedAt` added)
- [ ] Lead-to-Client conversion creates `clients` row linked to lead
- [ ] Pipeline grouping works with DB data
- [ ] Filters (temperature, stage) execute as DB WHERE clauses
- [ ] Audit log written on create/update/delete

### Cases
- [ ] `getCases()` returns only cases the user is a member of (or all for socio/admin)
- [ ] `createCase()` creates case + initial caseMembers entry
- [ ] Case detail page loads tasks from DB
- [ ] Drive folder fields populated when integration is active
- [ ] Cost center allocated on case creation

### Time Tracking
- [ ] Timer stop persists to `timeEntries` table via `createTimeEntry()`
- [ ] Manual entry form persists via same action
- [ ] `getTimeEntries()` filtered by userId for advogado role
- [ ] Approval status change persists to DB (approve/reject)
- [ ] Approved entries visible to billing engine
- [ ] Total hours per period calculated from DB data

### Billing (Faturamento)
- [ ] `closePeriod()` generates pre-invoices from approved time entries + billing plans
- [ ] Fixed billing: uses `billingPlans.value` directly
- [ ] Hourly billing: `SUM(duration) * hourlyRate`
- [ ] Mixed billing: `fixedValue + MAX(0, totalHours - includedHours) * hourlyRate`
- [ ] Pre-invoice line items have typed structure
- [ ] `timeEntries.preInvoiceId` updated after pre-invoice generation
- [ ] Approval flow: Rascunho → Pendente → Faturado (with DB persistence)
- [ ] NFS-e fields populated when integration active

### Finance (Receivables + Payables)
- [ ] `getReceivables()` and `getPayables()` return DB data
- [ ] Approval status changes persist via `approveEntity`
- [ ] Discount/writeoff request flow works (request → approval → apply)
- [ ] Bank reconciliation matches transactions to AR titles
- [ ] Cashflow projection computed from billing plans + payables
- [ ] Audit log on every financial mutation

### Proposals
- [ ] `getProposals()` returns DB data (no localStorage dependency)
- [ ] `createProposal()` persists to DB with version tracking
- [ ] Proposal editor saves to `proposals.content` JSONB
- [ ] Version history accessible (proposalVersions table populated)
- [ ] PDF generation exports professional document
- [ ] "Convert to Case" creates case with billing plan from proposal

### Dashboard
- [ ] Pipeline funnel: `COUNT(leads) GROUP BY status`
- [ ] Total a Receber: `SUM(ar_titles.value) WHERE status IN ('pendente', 'desconto_solicitado')`
- [ ] Total a Pagar: `SUM(accounts_payable.value) WHERE status = 'pendente'`
- [ ] Pending approvals: real count from `getPendingApprovalCounts()`
- [ ] Recent events from audit log or dedicated events table
- [ ] Cashflow chart from `cashflowDaily` or projected data

### Approvals (Hub)
- [ ] Pending items fetched from all entity tables (payables, receivables, time entries)
- [ ] Approve/reject persists to DB with transaction + audit log
- [ ] Batch approval works for multiple items
- [ ] Exception queue items displayed with retry option
- [ ] Counts on sidebar badge reflect real pending counts

---

## 6. EXECUTIVE VALIDATION CHECKLIST

### For CEO Review Before Go-Live

**Data Integrity**
- [ ] All financial data (receivables, payables, invoices) is persisted in PostgreSQL — not browser memory
- [ ] Approval decisions survive server restart and browser refresh
- [ ] Time entries logged by advogados cannot be lost
- [ ] Bank reconciliation matches are stored and auditable

**Security**
- [ ] Only socios and admins can access partner vault (Cofre)
- [ ] Only socios and admins can approve financial items
- [ ] Advogados can only see their own cases and time entries
- [ ] Every financial decision has an audit trail (who, when, what changed)
- [ ] Authentication uses Azure AD (not mock credentials)

**Business Operations**
- [ ] Complete cycle works: Lead → Client → Case → Time Entry → Approval → Pre-Invoice → Invoice
- [ ] Monthly billing engine generates accurate pre-invoices based on contract type
- [ ] NFS-e can be emitted for approved invoices (São Paulo municipality)
- [ ] Bank statements can be imported and matched to receivables
- [ ] Partner distribution calculation reflects actual firm financials

**Reliability**
- [ ] System shows loading indicator during data fetch (not blank screen)
- [ ] System shows error message on failure (not crash)
- [ ] Destructive actions require confirmation
- [ ] Server action test suite covers all 28 functions
- [ ] No hardcoded mock data in production build

**Compliance**
- [ ] Audit log covers: approvals, rejections, financial mutations, user actions
- [ ] NFS-e emission complies with São Paulo municipal requirements
- [ ] Tax rate (14.53% default) is configurable per billing plan
- [ ] Data cannot be accessed by unauthorized roles

---

## 7. MINIMAL ARCHITECTURE DIAGRAM

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React 19)                            │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Dashboard  │  │   CRM      │  │  Billing   │  │  Finance     │  │
│  │  KPIs       │  │  Leads     │  │  Faturamento│  │  Receivables │  │
│  │  Pipeline   │  │  Proposals │  │  Time Track │  │  Payables    │  │
│  │  Cashflow   │  │  Cases     │  │  Engine     │  │  Reconcil.   │  │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └──────┬───────┘  │
│         │               │               │               │           │
│  ┌──────┴───────────────┴───────────────┴───────────────┴────────┐  │
│  │              ReportToolbar + PageHeader + Toast                │  │
│  │              EmptyState + ConfirmDialog + FilterDropdown       │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │ useEffect / useCallback              │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ Server Actions (RSC boundary)
┌──────────────────────────────┼──────────────────────────────────────┐
│                        NEXT.JS SERVER                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  MIDDLEWARE (src/middleware.ts)                               │   │
│  │  ├─ Auth check (NextAuth session)                            │   │
│  │  ├─ RBAC route protection (role → allowed routes)            │   │
│  │  └─ Security headers (CSP, HSTS, X-Frame)                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Auth Module  │  │ Approval    │  │ Server      │                 │
│  │ (NextAuth)   │  │ Module      │  │ Actions     │                 │
│  │              │  │             │  │ (8 files)   │                 │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │                 │
│  │ │Mock Cred│ │  │ │Authority│ │  │ │ leads   │ │                 │
│  │ │Azure AD │ │  │ │Matrix   │ │  │ │ cases   │ │                 │
│  │ │(future) │ │  │ │Transi-  │ │  │ │ proposa.│ │                 │
│  │ └─────────┘ │  │ │tions    │ │  │ │ financ. │ │                 │
│  │              │  │ │Rate     │ │  │ │ time-e. │ │                 │
│  │ session →    │  │ │Limit    │ │  │ │ fatura. │ │                 │
│  │  userId      │  │ └─────────┘ │  │ │ bank-t. │ │                 │
│  │  role        │  │             │  │ │ dashb.  │ │                 │
│  └──────┬──────┘  └──────┬──────┘  │ └─────────┘ │                 │
│         │               │          └──────┬──────┘                  │
│         │               │                 │                          │
│  ┌──────┴───────────────┴─────────────────┴──────────────────────┐  │
│  │  DATA LAYER                                                    │  │
│  │                                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │ Zod         │  │ Drizzle ORM │  │ Mappers             │   │  │
│  │  │ Validation  │→ │ Query       │→ │ DB Row → MockType   │   │  │
│  │  │ (11 schemas)│  │ Builder     │  │ (adapter pattern)   │   │  │
│  │  └─────────────┘  └──────┬──────┘  └─────────────────────┘   │  │
│  │                          │                                     │  │
│  │  ┌───────────────────────┴────────────────────────────────┐   │  │
│  │  │  try { DB query } catch { MOCK fallback + log }        │   │  │
│  │  └───────────────────────┬────────────────────────────────┘   │  │
│  └──────────────────────────┼────────────────────────────────────┘  │
│                              │                                       │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ postgres.js driver
┌──────────────────────────────┼──────────────────────────────────────┐
│                        POSTGRESQL 16                                 │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  CORE           CRM              EXECUTION                   │    │
│  │  ┌──────┐      ┌──────┐         ┌──────┐                   │    │
│  │  │roles │      │leads │         │tasks │                   │    │
│  │  │users │      │meet- │         │time- │                   │    │
│  │  │      │      │ings  │         │Entr. │                   │    │
│  │  └──────┘      └──────┘         └──────┘                   │    │
│  │                                                              │    │
│  │  CLIENTS        BILLING          FINANCE                     │    │
│  │  ┌──────┐      ┌──────┐         ┌──────┐                   │    │
│  │  │client│      │bill- │         │arTit.│                   │    │
│  │  │cases │      │Plans │         │bank- │                   │    │
│  │  │case- │      │preInv│         │Trans.│                   │    │
│  │  │Memb. │      │invoi.│         │recon.│                   │    │
│  │  └──────┘      └──────┘         │cashf.│                   │    │
│  │                                  │accts.│                   │    │
│  │  PROPOSALS      VAULT           │Payab.│                   │    │
│  │  ┌──────┐      ┌──────┐         └──────┘                   │    │
│  │  │propo.│      │partn.│                                     │    │
│  │  │propo.│      │partn.│         INFRA                       │    │
│  │  │Vers. │      │Ledger│         ┌──────┐                   │    │
│  │  └──────┘      │distr.│         │audit │                   │    │
│  │                └──────┘         │Logs  │                   │    │
│  │                                  │excep.│                   │    │
│  │  CONFIG                          │Queue │                   │    │
│  │  ┌──────┐                       │drive │                   │    │
│  │  │rules │                       │Fold. │                   │    │
│  │  └──────┘                       └──────┘                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  24 tables │ UUID PKs │ decimal(12,2) financials │ JSONB metadata   │
└──────────────────────────────────────────────────────────────────────┘

                    FUTURE INTEGRATIONS (not implemented)
┌──────────────────────────────────────────────────────────────────────┐
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐   │
│  │ Azure AD  │  │ NFS-e SP  │  │ Google    │  │ Itau/BTG      │   │
│  │ (Auth)    │  │ (Focus/   │  │ Drive API │  │ (OFX/CNAB)    │   │
│  │           │  │  Enotas)  │  │           │  │               │   │
│  └───────────┘  └───────────┘  └───────────┘  └───────────────┘   │
│  ┌───────────┐  ┌───────────┐                                      │
│  │Fireflies  │  │ Email     │                                      │
│  │(Meetings) │  │ (Resend)  │                                      │
│  └───────────┘  └───────────┘                                      │
└──────────────────────────────────────────────────────────────────────┘

LEGEND:
  → = data flow direction
  ┌─┐ = module/component boundary
  │ │ = containment
```

### Data Flow — Critical Business Cycle

```
Lead ──(conversion)──► Client ──(creation)──► Case
                                                │
                                    ┌───────────┤
                                    │           │
                                    ▼           ▼
                              BillingPlan   TimeEntries
                                    │           │
                                    │     (approval)
                                    │           │
                                    ▼           ▼
                              closePeriod() ◄───┘
                                    │
                                    ▼
                              PreInvoice ──(approval)──► Invoice
                                                            │
                                                    ┌───────┤
                                                    │       │
                                                    ▼       ▼
                                              NFS-e SP   AR Title
                                                            │
                                                    (reconciliation)
                                                            │
                                                            ▼
                                                    BankTransaction
                                                            │
                                                            ▼
                                                    CashflowDaily
                                                            │
                                                            ▼
                                                    Cofre/Distribution
```

---

> **Document generated**: 2026-03-03
> **Scope**: Strategic architectural analysis — no code, no refactor
> **Next action**: CEO review of this document, then execute Week 1 (P0 items)
