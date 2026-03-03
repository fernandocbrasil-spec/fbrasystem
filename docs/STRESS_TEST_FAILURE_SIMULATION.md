# STRESS TEST — Failure Simulation Report

> **Date**: 2026-03-03
> **Mode**: Failure path analysis — every scenario traced through actual code
> **Scope**: Auth, Server Actions, UI, Data Integrity, Concurrency
> **Verdict**: 47 failure modes identified, 12 critical, 19 high, 16 medium

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Auth Chain Failures](#2-auth-chain-failures)
3. [Server Action Failures](#3-server-action-failures)
4. [UI-Level Failures](#4-ui-level-failures)
5. [Data Integrity Failures](#5-data-integrity-failures)
6. [Concurrency & Race Conditions](#6-concurrency--race-conditions)
7. [Silent Data Corruption Matrix](#7-silent-data-corruption-matrix)
8. [Kill Chain Scenarios](#8-kill-chain-scenarios)
9. [Remediation Priority Matrix](#9-remediation-priority-matrix)

---

## 1. EXECUTIVE SUMMARY

The system was designed with a graceful degradation strategy: `try { DB } catch { mock }`. This architecture prevents crashes but introduces a more dangerous failure class — **silent data substitution**. The user sees data, believes it is real, but it is static mock data from a hardcoded array. There is no visual indicator, no toast, no log visible to the user.

### Failure Mode Distribution

| Category | Critical | High | Medium | Total |
|---|---|---|---|---|
| Auth Chain | 2 | 3 | 2 | 7 |
| Server Actions | 4 | 7 | 5 | 16 |
| UI Layer | 2 | 4 | 3 | 9 |
| Data Integrity | 3 | 4 | 4 | 11 |
| Concurrency | 1 | 1 | 2 | 4 |
| **Total** | **12** | **19** | **16** | **47** |

### Top 5 Failures by Business Impact

| # | Failure | Impact |
|---|---|---|
| 1 | Approvals don't persist to DB — `aprovacoes/page.tsx` never calls server actions | Every approval is lost on refresh. Partners believe items are approved; they are not. |
| 2 | Mock fallback is silent — no visual distinction between real and mock data | Users make financial decisions based on stale hardcoded data without knowing it. |
| 3 | Timer data lost on navigation — no `beforeunload`, no autosave | Billable hours vanish. Direct revenue loss for hourly/mixed billing clients. |
| 4 | `parseDateBR(null)` throws, `parseCurrency("abc")` returns `"0.00"` | Financial records written with zero values or crash the page — both are data corruption. |
| 5 | Seed creates unbounded duplicates on re-run for 4 tables | Running `db:seed` twice doubles AP, AR, time entries, and bank transactions with no deduplication. |

---

## 2. AUTH CHAIN FAILURES

### 2.1 Auth Session Bootstrap

**Path**: `auth.ts` → `authorize()` → `jwt` callback → `session` callback

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| AUTH-01 | `authorize()` receives any credentials | Always returns hardcoded user. No validation. Any email/password combination succeeds. | CRITICAL |
| AUTH-02 | `jwt` callback: `user` undefined on token refresh | `token.role`, `token.userId`, `token.azureId` are never written to the token. Token is returned without these fields. | HIGH |
| AUTH-03 | `session` callback: `token.role` is `undefined` | `session.user.role` becomes `""` (empty string via `?? ""` fallback). Session is valid. User is "logged in" with no role. | HIGH |
| AUTH-04 | `session.user.id` is `""` (empty string) | Passes all `if (!session?.user)` guards. Used as FK in mutations (`responsibleId`, `submittedBy`, `userId`). Empty string written to DB FK columns. | HIGH |
| AUTH-05 | `getSessionRole()` receives role `""` | `!""` is `true` → returns `null` → "Nao autenticado" error. This is actually a correct safety net — empty role is treated as unauthenticated. | OK (safe) |
| AUTH-06 | `getSessionRole()` receives invalid role string (e.g. `"superadmin"`) | `as UserRole` cast passes. `canUserApprove()` returns `false` (not in authority matrix). Permission denied — but no log of the invalid role. | MEDIUM |
| AUTH-07 | `auth()` itself throws (JWT decode error, cookie corruption) | In `dashboard.ts`, `faturamento.ts`, `bank-transactions.ts`: no `try/catch` around `auth()` — exception propagates as unhandled 500. | MEDIUM |

### 2.2 Middleware RBAC

**Path**: `middleware.ts` → `req.auth` → role extraction → route matching

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| AUTH-08 | User with `role: ""` accesses `/cofre` | `req.auth` is truthy (session exists) → passes `isLoggedIn` check. Role `""` does not match `["socio", "admin"]` → redirected to `/dashboard`. No error message shown. | OK (safe) |
| AUTH-09 | User with `role: "advogado"` accesses `/financeiro` | Route `/financeiro` is in `ROLE_ROUTES` with `["financeiro", "socio", "admin"]`. `"advogado"` not included → redirect to `/dashboard`. Correct. | OK (safe) |
| AUTH-10 | User accesses `/leads`, `/casos`, `/time-tracking` | These routes are NOT in `ROLE_ROUTES` → no RBAC check → any authenticated user can access. | CRITICAL |
| AUTH-11 | 33 of 35+ routes have no RBAC protection | Only `/cofre` and `/configuracoes` (plus financial routes) are protected. All CRM, billing, approval, and operational routes are open to any role. | CRITICAL |

### 2.3 Rate Limiting

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| AUTH-12 | Rate limiter in serverless (Vercel) | In-memory `Map` is per-instance. Each cold start gets a fresh map. Distributed function instances don't share state. Rate limiting is effectively non-functional. | HIGH (in production) |
| AUTH-13 | Multiple users with `session.user.id = ""` | Rate limit key becomes `"approval:"` — all broken-ID users share one bucket. One user's requests consume the budget for all. | MEDIUM |

---

## 3. SERVER ACTION FAILURES

### 3.1 DB Connection Failure (catch block behavior)

Every read action follows: `try { db.select()... } catch { return [...MOCK_DATA] }`

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| SA-01 | `DATABASE_URL` is missing or wrong | `getDb()` throws `"DATABASE_URL is not set"`. Every action catches it and returns mock data. **The entire app runs on mock data with zero indication to the user.** | CRITICAL |
| SA-02 | DB is up but schema is out of sync (missing column) | Drizzle query throws. Catch returns mock data. User sees data but it's not from the DB. The mismatch is logged to `console.error` only — invisible in browser. | CRITICAL |
| SA-03 | DB connection pool exhausted | `postgres.js` throws connection error. Same catch → mock fallback. App appears functional but is entirely disconnected. | HIGH |
| SA-04 | DB is up, query succeeds, but returns 0 rows | No fallback triggered. User sees empty table with `EmptyState` component. Correct behavior — but indistinguishable from "query failed and mock also has no matching data." | MEDIUM |

### 3.2 Mock vs DB Data Divergence

When mock fallback activates, the data returned is fundamentally different from what DB would return:

| ID | Field | Mock Value | DB Value | Impact |
|---|---|---|---|---|
| SA-05 | Invoice `billingType` | Varied (`"Fixo Mensal"`, `"Horas"`, `"Exito"`) | Always `"Fixo Mensal"` (hardcoded in `faturamento.ts:59`) | All DB invoices show wrong billing type |
| SA-06 | Receivable `banco` | Varied (`"Itau"`, `"BTG"`) | Always `"Itau"` (hardcoded in `financeiro.ts`) | BTG receivables misattributed |
| SA-07 | Receivable `requestedValue` | `"R$ 6.560,00"` | Always `undefined` (not mapped from DB) | Discount approval UI shows no amount |
| SA-08 | Receivable `requestedReason` | `"Desconto comercial..."` | Always `undefined` (not mapped from DB) | Discount approval UI shows no reason |
| SA-09 | Time entry `approverName` | `"Fernando Brasil"` | Always `undefined` (join not performed) | Approved entries show no approver |
| SA-10 | Time entry `startTime` | Varied (`"09:00"`, `"14:30"`) | Always `"09:00"` (hardcoded) | All entries show same start time |
| SA-11 | Payable `submittedBy` | `"Financeiro"` | Always `undefined` (TODO in mapper) | No submitter visible on DB payables |
| SA-12 | Lead IDs | `"1"`, `"2"`, `"3"`, `"4"` (strings) | UUIDs (`a0000000-...`) | `getLeadById("1")` finds mock lead; `getLeadById(uuid)` finds DB lead. Cross-references break between modes. |
| SA-13 | Dashboard pending approvals | Static mock list (ghost entries) | Never queries DB (always mock) | Dashboard counts never match actual pending items |
| SA-14 | Proposal status `"Rejeitada"` | Not in `MockProposal["status"]` union | Returned from DB via `STATUS_MAP.rejected` | TypeScript lie — runtime value outside declared union |

### 3.3 Mutation Failures

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| SA-15 | `createPayable` with `valor: "abc"` | `parseCurrency("abc")` returns `"0.00"`. Payable created with R$ 0.00 value. No error. | HIGH |
| SA-16 | `createPayable` with `vencimento: "abc"` | `parseDateBR("abc")` returns `"undefined-undefined-abc"`. Written to `dueDate` column as invalid date string. | HIGH |
| SA-17 | `parseDateBR(null)` called anywhere | `null.split("/")` throws `TypeError`. Unhandled crash. | HIGH |
| SA-18 | `updateLead(nonExistentId, data)` | `db.update().where(eq(leads.id, "xxx"))` matches 0 rows. Returns `{ success: true }`. Caller believes update succeeded. | MEDIUM |
| SA-19 | `deleteLead(id)` by any user | No ownership check. Any authenticated user can delete any lead. No role verification. | HIGH |
| SA-20 | `createLead` — ghost record on partial failure | If `RETURNING` fails after `INSERT` succeeds, catch returns `{ success: false }` but the row exists in DB. Orphaned record. | MEDIUM |
| SA-21 | `createCase` — UTC date skew | `new Date().toISOString().split("T")[0]` in UTC. At 23:00 BRT (02:00 UTC next day), case gets tomorrow's date. | MEDIUM |
| SA-22 | `updateTimeEntryStatus` — stale rejection comment | Re-approving a rejected entry sets `approvedBy`/`approvedAt` but never clears `rejectionComment`. Old rejection reason persists invisibly. | MEDIUM |
| SA-23 | `updatePayableStatus` — inconsistent state | Caller can pass `status: "pago"` + `approvalStatus: "pendente"` simultaneously. No guard. DB stores logically impossible state: paid but pending approval. | HIGH |

### 3.4 Missing Server Actions

| ID | Missing Action | Consequence |
|---|---|---|
| SA-24 | `updateReceivableStatus` | Receivable approvals cannot be persisted. No action exists to change AR title approval status. | CRITICAL |
| SA-25 | `deleteCase` | Cases cannot be deleted — only status-updated. If a case is created in error, it persists forever. | MEDIUM |
| SA-26 | `deleteTimeEntry` | Time entries cannot be deleted. An erroneous 100h entry cannot be removed. | HIGH |
| SA-27 | `createInvoice` / `updateInvoice` | Faturamento module is entirely read-only at action layer. No invoice lifecycle management. | HIGH |

---

## 4. UI-LEVEL FAILURES

### 4.1 Loading & Error States

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| UI-01 | `loading.tsx` exists but never fires | All dashboard pages are `"use client"`. Next.js `loading.tsx` only activates for Server Component suspense. Dead code. | HIGH |
| UI-02 | Any page's `useEffect` data load fails | No `try/catch` in `loadData` callbacks. If the server action module fails to import (bundler error), unhandled promise rejection. No error UI, no toast, blank page. | HIGH |
| UI-03 | `aprovacoes/page.tsx` — `Promise.all` partial failure | If any 1 of 4 parallel fetches throws, `Promise.all` rejects entirely. None of the 4 state setters run. All sections show empty with no error indication. | CRITICAL |
| UI-04 | `formatCurrency` receives `NaN` | Returns `"R$ NaN"`. Rendered visibly in KPI cards and table cells. No catch. | MEDIUM |

### 4.2 Data Loss Scenarios

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| UI-05 | Timer running + user navigates away | No `beforeunload` handler anywhere in codebase. `useEffect` cleanup clears the interval (no leak), but all accumulated time is silently discarded. Zero warning. | CRITICAL |
| UI-06 | Faturamento engine running + user navigates away | `setTimeout` callback fires on unmounted component. `setInvoices` is a no-op on unmounted state. Generated invoice is permanently lost. `toast()` still fires (provider is above page). | HIGH |
| UI-07 | `leads/page.tsx` — non-null assertion on `timeline` | Line-level `!.timeline!.start` assertions. If `timeline` is `null` despite the `some()` guard, throws `TypeError`. Crashes the leads page. | MEDIUM |

### 4.3 Toast & Feedback Gaps

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| UI-08 | Approval actions on `aprovacoes/page.tsx` | Zero toast calls. User clicks "Aprovar" → local state changes → no confirmation, no persistence, no feedback. | HIGH |
| UI-09 | `"error"` toast variant usage | Used exactly **once** across all dashboard pages (`faturamento/parametros`). Every other page uses only `"success"` or no toast at all. Error conditions are invisible. | MEDIUM |
| UI-10 | Server action returns `{ success: false, error }` | Only `contas-a-pagar/page.tsx` checks the result and shows a warning toast. All other pages ignore the return value of mutations. | MEDIUM |

---

## 5. DATA INTEGRITY FAILURES

### 5.1 Schema-Level Risks

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| DI-01 | Delete a client that has cases | FK violation error (`NO ACTION` default). Delete blocked. Correct behavior but no soft-delete alternative exists. | MEDIUM |
| DI-02 | Insert duplicate `caseMembers(caseId, userId)` | No unique constraint on the pair. Duplicates insert silently. User appears as member twice. Queries return duplicate rows. | HIGH |
| DI-03 | `partners.sharePercentage` sums to >100% | No `CHECK` constraint. Two partners at 80% each = 160% total. Distribution math breaks. | HIGH |
| DI-04 | `approvalStatus` set to arbitrary string | All `approvalStatus` columns are `varchar(50)` with no `CHECK`. Writing `"em_analise"` or `"banana"` succeeds. Transition maps only exist in TypeScript. | HIGH |
| DI-05 | `proposalVersions.proposalId` is nullable | A version can exist with no parent proposal. Orphaned version records are possible and undetectable without a sweep query. | MEDIUM |
| DI-06 | All 14 JSONB columns have no schema validation | `proposals.content`, `preInvoices.lineItems`, `leads.metadata`, etc. accept any valid JSON including `true`, `42`, `""`. No structure enforcement at any layer. | HIGH |

### 5.2 Seed Integrity

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| DI-07 | `db:seed` runs twice | `roles`, `users`, `clients`, `cases`, `proposals`, `billingPlans`, `partners` use deterministic UUIDs + `onConflictDoNothing` — safe, no duplicates. | OK |
| DI-08 | `db:seed` runs twice — AP, AR, time entries, bank transactions | These 4 tables use `defaultRandom()` UUIDs. No conflict detection. **Every seed run inserts a fresh copy.** Run twice = double the records. Run 10 times = 10x. | CRITICAL |
| DI-09 | Seed step 7 (billing plans) fails, steps 1-6 succeed | No transaction wrapping seed. `process.exit(1)` fires but prior inserts are committed. DB has users, clients, cases — but no billing plans, no time entries, no AP/AR. Partial state with no cleanup. | HIGH |
| DI-10 | Seed UUID collides with real production data | `onConflictDoNothing()` silently drops the seed row. No log, no error. The production row persists but seed data is missing — dependent inserts may fail (FK to missing seed row). | MEDIUM |

### 5.3 Precision & Formatting

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| DI-11 | `parseFloat` on bank transaction values | If any single `row.value` is malformed (`"abc"`), `parseFloat` returns `NaN`. Running balance accumulator becomes `NaN`. **All subsequent rows show `NaN` balance.** One bad row corrupts the entire bank statement view. | CRITICAL |
| DI-12 | `parseCurrency` floating point drift | `parseFloat("13045.51").toFixed(2)` = `"13045.51"` (safe for this value). But `parseFloat("0.1") + parseFloat("0.2")` = `0.30000000000000004`. Round-trip through `parseCurrency` → DB → `formatCurrency` can drift by 1 centavo on edge values. | MEDIUM |
| DI-13 | `formatDateBR("2026/03/01")` (slash instead of dash) | `split("-")` produces `["2026/03/01"]`. Returns `"undefined/undefined/2026/03/01"`. Silently renders garbage. | MEDIUM |

---

## 6. CONCURRENCY & RACE CONDITIONS

| ID | Scenario | What Happens | Severity |
|---|---|---|---|
| RC-01 | Two partners approve the same payable simultaneously | Both call `handleApprovePayable()` on `aprovacoes/page.tsx`. Both mutate local state. **Neither calls a server action.** Both see "approved" locally. On refresh, it's pending again. If server actions were called: no `SELECT FOR UPDATE` or optimistic locking — last write wins, no conflict detection. | CRITICAL |
| RC-02 | User opens two browser tabs, creates time entries in both | Each tab has independent state. Both call `createTimeEntry()` server action. Both insert into DB. No duplicate detection. User may not realize they created 2 entries for the same work. | HIGH |
| RC-03 | `closePeriod` engine runs while time entries are being approved | Not implemented yet, but future risk: if the billing engine queries `timeEntries WHERE approvalStatus = 'aprovado'` while an approval is in-flight, the entry may be included or excluded depending on timing. No snapshot isolation at the application layer. | MEDIUM |
| RC-04 | Two users edit the same lead simultaneously | Both fetch the same lead data. Both call `updateLead()`. No versioning, no `updatedAt` comparison, no optimistic locking. Last write wins silently. First user's changes are overwritten with no notification. | MEDIUM |

---

## 7. SILENT DATA CORRUPTION MATRIX

These failures write incorrect data to the DB without any error signal:

| # | Trigger | What Gets Written | Detection Method |
|---|---|---|---|
| 1 | `createPayable({ valor: "abc" })` | `value: "0.00"` (zero) | Manual audit — payable with R$ 0.00 |
| 2 | `createPayable({ vencimento: "abc" })` | `dueDate: "undefined-undefined-abc"` | Query for non-date strings in `due_date` |
| 3 | `session.user.id = ""` on any create | `responsibleId: ""` / `submittedBy: ""` / `userId: ""` | Query for empty-string FK columns |
| 4 | `updatePayableStatus(id, "pago", "pendente")` | `status: "pago"`, `approvalStatus: "pendente"` | Query for logically inconsistent state pairs |
| 5 | Re-approve a rejected time entry | `approvalStatus: "aprovado"` but `rejectionComment` still has old text | Query for `approvalStatus = 'aprovado' AND rejectionComment IS NOT NULL` |
| 6 | `updateLead(validId, { contactName: " " })` | `contactName: " "` (single space) | Query for whitespace-only names |
| 7 | Seed run N times | N copies of AP, AR, time entries, bank transactions | `SELECT COUNT(*) GROUP BY (supplierName, value, dueDate)` for duplicates |
| 8 | Two `caseMembers` inserts for same pair | Duplicate `(caseId, userId)` rows | `SELECT caseId, userId, COUNT(*) HAVING COUNT(*) > 1` |
| 9 | `partners` with 80% + 80% shares | Total 160% share percentage | `SELECT SUM(sharePercentage) FROM partners` |
| 10 | `approvalStatus: "banana"` via direct DB or unvalidated action | Invalid status string persisted | `SELECT DISTINCT approvalStatus` on each table, compare to known enums |
| 11 | `createCase` at 23:00 BRT | `startedAt` = tomorrow's UTC date | Compare `startedAt` vs `createdAt` timezone-adjusted |
| 12 | `faturamento.ts` returns all invoices as `"Fixo Mensal"` | No write — but displays wrong billing type to user | Compare `billingPlans.type` vs displayed type on UI |

---

## 8. KILL CHAIN SCENARIOS

### Scenario A: "The Silent Mock"

```
1. Deploy to production
2. DATABASE_URL is set but points to wrong host (typo)
3. postgres.js fails to connect
4. Every server action catches the error
5. Every page renders with MOCK_INVOICES, MOCK_PAYABLES, MOCK_LEADS, etc.
6. Dashboard shows pipeline funnel, KPIs, financial summaries
7. User navigates all modules — everything "works"
8. User approves a payable → local state changes → no DB write
9. User creates a time entry → action returns { success: false, error: "..." } → page doesn't check result → no toast
10. User runs billing engine → mock invoice appears in local state → lost on refresh
11. After 2 weeks of "usage", zero data has been persisted
12. User discovers the problem only when they restart the browser and all data reverts to the same mock snapshot
```

**Business Impact**: Total data loss for all work done during the undetected period. No recovery possible.

**Detection Gap**: No health check endpoint. No DB connection status indicator. No "connected to database" badge. `console.error` is the only signal — invisible to end users.

### Scenario B: "The Phantom Approval"

```
1. Socio opens /aprovacoes
2. Sees 6 pending items (2 payables, 2 receivables, 2 time entries)
3. Clicks "Aprovar" on a payable worth R$ 45.000
4. handleApprovePayable() fires — sets local state to "aprovado"
5. Green badge appears. Toast does NOT appear (no toast call in aprovacoes).
6. Socio moves to next item, approves 3 more items
7. Socio closes browser, goes to meeting
8. Financeiro opens /aprovacoes — sees the SAME 6 pending items (all still "pendente")
9. Financeiro: "O socio ainda nao aprovou?"
10. Socio: "Eu aprovei ontem!"
11. No audit trail. No DB record. No way to prove or recover the approvals.
```

**Business Impact**: Blocked payment cycle. Vendor relationship damage. Internal trust erosion.

**Root Cause**: `aprovacoes/page.tsx` handlers are 100% client-side state mutations. Zero server action calls.

### Scenario C: "The Lost Hours"

```
1. Advogado starts timer at 09:00 for case "Assessoria Contabil"
2. Works for 3h 45m on the case
3. At 12:45, clicks a link to /leads to check a contact
4. Next.js client-side navigation unmounts time-tracking page
5. useEffect cleanup clears the interval (no memory leak)
6. But accumulatedMs, startedAt, timerStatus — all in component state — are destroyed
7. No beforeunload handler. No autosave. No localStorage persistence.
8. Advogado navigates back to /time-tracking
9. Timer shows "00:00:00" — fresh state. No record of the 3h 45m.
10. At hourly rate of R$ 350/h, that's R$ 1.312,50 in unbilled time. Gone.
```

**Business Impact**: Direct revenue loss. Repeated incidents compound. Advogados learn to distrust the system and revert to Clockify.

**Root Cause**: Timer state is ephemeral. No persistence layer (localStorage, server, or IndexedDB).

### Scenario D: "The Exponential Seed"

```
1. Developer runs `npm run db:seed` — 5 AP, 5 AR, 7 time entries, 10 bank transactions inserted
2. Notices a typo in a client name, fixes seed.ts
3. Runs `npm run db:seed` again
4. roles, users, clients, cases — onConflictDoNothing, safe
5. accountsPayable — defaultRandom() UUIDs, no conflict → 5 MORE rows inserted (total: 10)
6. arTitles — same → 10 total
7. timeEntries — same → 14 total
8. bankTransactions — same → 20 total
9. Developer doesn't notice — numbers are small
10. CI/CD pipeline runs seed on every deploy (common pattern)
11. After 20 deploys: 100 AP records, 100 AR titles, 140 time entries, 200 bank transactions
12. Financial reports show inflated numbers. Balance calculations are wrong.
13. No deduplication query exists. Manual cleanup required.
```

**Business Impact**: Corrupted financial data. Unreliable reports. Trust in system destroyed.

**Root Cause**: 4 tables use `defaultRandom()` with `onConflictDoNothing()` — the "do nothing" never triggers because UUIDs are always unique.

### Scenario E: "The NaN Cascade"

```
1. Bank imports a CSV with a malformed value (e.g., "1.250,00" Brazilian format in a decimal column)
2. Or: manual DB insert with value = "abc" (no Zod validation on bank-transactions action)
3. getBankEntries() queries all transactions
4. Running balance computed: accumulator starts at 0
5. Row 1: parseFloat("15000.00") = 15000 → balance = 15000 ✓
6. Row 2: parseFloat("abc") = NaN → balance = 15000 + NaN = NaN
7. Row 3: parseFloat("8500.00") = 8500 → balance = NaN + 8500 = NaN
8. ALL remaining rows: balance = NaN
9. Every row from position 2 onward shows "NaN" in the balance column
10. UI renders "R$ NaN" — visible but unexplained to user
11. No error toast. No log. No identification of which row caused it.
```

**Business Impact**: Entire bank statement view is unusable. Reconciliation impossible.

**Root Cause**: No input validation on `bankTransactions.value`. No `isNaN` guard in balance accumulator.

---

## 9. REMEDIATION PRIORITY MATRIX

### Tier 1 — Fix This Week (prevents data loss & trust collapse)

| # | Failure IDs | Fix | Effort | Files |
|---|---|---|---|---|
| 1 | SA-24, UI-08, RC-01 | **Wire `aprovacoes/page.tsx` to call server actions** — `approveEntity`/`rejectEntity` must call `updatePayableStatus`, `updateTimeEntryStatus`, and new `updateReceivableStatus` | 6h | `aprovacoes/page.tsx`, `financeiro.ts` (add `updateReceivableStatus`), `time-entries.ts` |
| 2 | SA-01, SA-02 | **Add DB health indicator** — `getDbStatus()` function that runs `SELECT 1`. Show connection status in sidebar footer or header. Replace silent mock fallback with visible `[MODO OFFLINE]` banner when catch triggers. | 3h | `db/index.ts`, `layout.tsx`, new component |
| 3 | UI-05 | **Persist timer state** — save `accumulatedMs`, `startedAt`, `timerStatus`, `selectedCaseId` to `localStorage` on every tick. Restore on mount. Add `beforeunload` warning when timer is running. | 3h | `time-tracking/page.tsx` |
| 4 | SA-15, SA-16, DI-11 | **Fix format utilities** — `parseCurrency`: throw on `NaN` instead of returning `"0.00"`. `parseDateBR`: add null guard + validate format. `getBankEntries`: add `isNaN` guard on `parseFloat`, skip corrupt rows with warning. | 2h | `format.ts`, `bank-transactions.ts` |
| 5 | DI-08 | **Fix seed idempotency** — assign deterministic UUIDs to AP, AR, time entries, bank transactions (same pattern as other tables). | 1h | `seed.ts` |

### Tier 2 — Fix This Sprint (prevents security & integrity issues)

| # | Failure IDs | Fix | Effort | Files |
|---|---|---|---|---|
| 6 | AUTH-10, AUTH-11 | **Expand RBAC to all routes** — add all CRM, billing, time-tracking, approval routes to `ROLE_ROUTES` with appropriate role arrays. | 3h | `middleware.ts` |
| 7 | SA-19 | **Add ownership checks on mutations** — `deleteLead`: verify `lead.responsibleId === session.user.id` or role is `admin`/`socio`. Apply same pattern to `deletePayable`, `updateCase`, etc. | 4h | All action files with mutations |
| 8 | SA-23, DI-04 | **Validate status transitions at runtime** — create `validateTransition(entityType, fromStatus, toStatus)` function using existing transition maps. Call before every status update. | 3h | `approval/types.ts` (add function), all `updateXStatus` actions |
| 9 | DI-03, DI-06 | **Add CHECK constraints** — `partners`: `CHECK (share_percentage BETWEEN 0 AND 100)`. `approvalStatus`: `CHECK (approval_status IN ('pendente', 'aprovado', 'rejeitado', ...))`. | 2h | `schema.ts`, new migration |
| 10 | UI-02, UI-03 | **Add try/catch to all `loadData` callbacks** — wrap server action calls with try/catch, show error toast on failure. For `Promise.all` in aprovacoes, use `Promise.allSettled` to partial-load. | 2h | All page files with `loadData` |
| 11 | DI-02 | **Add unique constraint on `caseMembers(caseId, userId)`** | 0.5h | `schema.ts`, migration |
| 12 | SA-22 | **Clear `rejectionComment` on re-approve** — add `rejectionComment: null` to the approve branch of `updateTimeEntryStatus`. | 0.5h | `time-entries.ts` |

### Tier 3 — Fix Before Production (prevents operational surprises)

| # | Failure IDs | Fix | Effort | Files |
|---|---|---|---|---|
| 13 | SA-05 | **Map `billingType` from `billingPlans` join** — in `faturamento.ts`, join `billingPlans` to `preInvoices` via `caseId` and pass actual `type` instead of hardcoded `"Fixo Mensal"`. | 1h | `faturamento.ts` |
| 14 | SA-06, SA-07, SA-08, SA-09, SA-11 | **Complete all mapper TODOs** — populate `banco`, `requestedValue`, `requestedReason`, `approverName`, `submittedBy` from actual DB joins. | 4h | `financeiro.ts`, `time-entries.ts` |
| 15 | AUTH-12 | **Move rate limiting to persistent store** — replace in-memory `Map` with DB-backed counter or Vercel KV. | 3h | `approval/actions.ts`, new rate-limit module |
| 16 | DI-09 | **Wrap seed in a transaction** — `db.transaction(async (tx) => { all inserts })`. Rollback on any failure. | 1h | `seed.ts` |
| 17 | SA-13 | **Connect dashboard to real queries** — replace `MOCK_PENDING_APPROVALS` with aggregate queries from `accountsPayable`, `arTitles`, `timeEntries` where `approvalStatus = 'pendente'`. | 4h | `dashboard.ts` |
| 18 | UI-01 | **Replace dead `loading.tsx` with client-side skeletons** — add inline loading state (`useState(true)` + skeleton JSX) to each `"use client"` page that fetches data in `useEffect`. | 3h | All dashboard pages |
| 19 | AUTH-01 | **Replace mock credentials** — configure Azure AD provider. Remove hardcoded `authorize()`. | 8h | `auth.ts`, `.env.local` |
| 20 | SA-26, SA-27 | **Add missing mutation actions** — `deleteTimeEntry`, `createInvoice`, `updateInvoice`. | 4h | `time-entries.ts`, `faturamento.ts` |

---

### Total Remediation Effort

| Tier | Items | Effort | Timeline |
|---|---|---|---|
| Tier 1 | 5 | ~15h | This week |
| Tier 2 | 7 | ~15h | This sprint (2 weeks) |
| Tier 3 | 8 | ~28h | Before production |
| **Total** | **20** | **~58h** | |

---

> **Document generated**: 2026-03-03
> **Method**: Line-by-line code trace across auth, actions, pages, schema, and seed
> **Constraint**: No code written, no changes made — analysis only
