# DOMAIN CONSISTENCY VERIFICATION

> **Date**: 2026-03-03
> **Source of truth**: GOVERNANCE_HARDENING.md
> **Cross-referenced against**: `schema.ts`, `approval/types.ts`, all action files
> **Method**: Formal cross-check — every finding maps to two or more documents/files that contradict

---

## 1. STATE MACHINE CROSS-CHECK

### 1.1 Contradiction Matrix

Each cell compares what GOVERNANCE_HARDENING.md defines vs what actually exists in code.

| # | Machine | Governance Says | Code Says | Verdict |
|---|---|---|---|---|
| C01 | Lead | 6 states: `novo`, `contato_feito`, `proposta_enviada`, `negociacao`, `ganho`, `perdido` | `schema.ts:37` — `varchar(50)` with default `"novo"`, no enum. `mock-data.ts` — union includes `"negociacao"` and `"ganho"` but seed only uses 4 values: `novo`, `novo`, `contato_feito`, `proposta_enviada`. | **AMBIGUOUS** — `"negociacao"` and `"ganho"` exist in the type union but zero code paths produce them. No action writes these values. No seed creates them. They are phantom states. |
| C02 | Lead | Guard: `temperature` must be `"quente"` before `ganho` | No code enforces this. `updateLead` accepts any `status` string without checking `temperature`. | **CONTRADICTION** — guard exists only in doc. |
| C03 | Lead | Guard: cannot move to `proposta_enviada` if temperature is `"frio"` | No code enforces this. Temperature and status are independently writeable. | **CONTRADICTION** — guard exists only in doc. |
| C04 | Lead | Transition `perdido → novo` (reopen) | `approval/types.ts` — no lead transition map exists. `leads.ts updateLead` — accepts any status string. | **UNIMPLEMENTED** — neither blocked nor explicitly supported. Would work by accident since any string is accepted. |
| C05 | Proposal | 5 states: `draft`, `sent`, `approved`, `rejected`, `invoiced` | `schema.ts:68` — default `"draft"`. Seed uses `"draft"`, `"approved"`. `proposals.ts STATUS_MAP` — maps `draft`, `sent`, `approved`, `rejected`. But **no code path ever writes `"sent"`**. `createProposal` defaults to `"draft"`. `updateProposal` accepts any string. | **AMBIGUOUS** — `"sent"` is mapped but unreachable. No action or page transitions to `"sent"`. |
| C06 | Proposal | State `"invoiced"` = converted to case, terminal | `proposals.ts STATUS_MAP` uses `"invoiced"` in GOVERNANCE but code STATUS_MAP at line 34 does not include `"invoiced"`. Only `draft`, `sent`, `approved`, `rejected`. | **CONTRADICTION** — `"invoiced"` exists in governance doc but not in the existing STATUS_MAP code. |
| C07 | Proposal | Guard: content frozen on `"sent"` | No code enforces content immutability based on status. `updateProposal` writes `content` regardless of current status. | **CONTRADICTION** — guard exists only in doc. |
| C08 | Task | 5 states: `todo`, `in_progress`, `in_review`, `returned`, `done` | `schema.ts:144` — default `"todo"`. No seed data. No action file. No mock data. **Zero code references any task state machine.** | **UNIMPLEMENTED** — entire task lifecycle is theoretical. |
| C09 | Task | `cancelled` state reachable from any non-done state | No `cancelled` state exists anywhere in code. Not in schema defaults, not in any type. | **CONTRADICTION** — `"cancelled"` is doc-only. |
| C10 | Time Entry | 4 states: `pendente`, `aprovado`, `rejeitado`, `faturado` | `approval/types.ts:47-52` — matches exactly. `schema.ts:170` — default `"pendente"`. Seed uses all 4 values. | **CONSISTENT** |
| C11 | Time Entry | Guard: cannot approve own entries (`approvedBy !== userId`) | No code enforces this. `updateTimeEntryStatus` sets `approvedBy = session.user.id` without checking against `timeEntries.userId`. | **CONTRADICTION** — self-approval is possible. |
| C12 | Time Entry | Guard: `caseId` must reference active case | No code checks `cases.status` during time entry approval. The approval action only updates `timeEntries`, never joins/checks `cases`. | **CONTRADICTION** — inactive case entries can be approved. |
| C13 | Pre-Invoice | 5 states: `draft`, `review`, `approved`, `invoiced`, `rejected` | `schema.ts:209` — default `"draft"`. Seed uses `"pending"`, `"approved"`, `"draft"`. `faturamento.ts STATUS_MAP` maps `draft`, `review`, `approved`, `invoiced`. | **CONTRADICTION** — seed value `"pending"` is NOT in the governance state machine and NOT in the faturamento STATUS_MAP. It falls through to `"Rascunho"` default silently. |
| C14 | Pre-Invoice | Guard: `approvedBy !== createdBy` (cannot approve own) | `preInvoices` table has `approvedBy` but no `createdBy` column. | **CONTRADICTION** — the guard references a column that doesn't exist on the table. (Proposals have `createdBy`, pre-invoices do not.) |
| C15 | Pre-Invoice | Transition `approved → invoiced` creates invoice + AR title in one transaction | No `invoiced` transition code exists. No action creates `invoices` rows. No action creates `arTitles` from pre-invoices. | **UNIMPLEMENTED** — the most critical billing transition has zero code. |
| C16 | AR Title | Dual-axis: `status` (payment) + `approvalStatus` (approval) | `schema.ts:247-249` — both columns exist. `approval/types.ts:39-45` — receivable transitions defined. Seed uses both axes. | **CONSISTENT** — structure matches. |
| C17 | AR Title | Transition: `open → overdue` is automatic (daily cron) | No cron exists. No code compares `dueDate` to today. `getReceivables` returns status as-is from DB — no auto-transition. | **UNIMPLEMENTED** — overdue detection is doc-only. |
| C18 | AR Title | Discount/writeoff side effect: sets `paidValue`, `paidDate`, `status = "paid"` on approval | No `updateReceivableStatus` action exists. The entire receivable mutation path is missing. | **UNIMPLEMENTED** — critical financial operation has no backend. |
| C19 | Payable | 5 states: `pendente`, `aprovado`, `rejeitado`, `agendado`, `pago` | `approval/types.ts:31-37` — matches exactly. Seed covers `pendente`, `aprovado`, `pago`, `rejeitado`. | **CONSISTENT** |
| C20 | Payable | `accountsPayable.status` and `accountsPayable.approvalStatus` are independent columns | `schema.ts:313-314` — confirmed: `status` (varchar 50, default `"pending"`) and `approvalStatus` (varchar 50, default `"pendente"`). | **AMBIGUOUS** — see finding A01 below. |

### 1.2 Ambiguity Findings

| # | Finding | Detail | Decision Required |
|---|---|---|---|
| A01 | **Payable has two status columns with overlapping vocabulary** | `status` uses English: `"pending"`, `"scheduled"`, `"paid"`, `"overdue"`. `approvalStatus` uses Portuguese: `"pendente"`, `"aprovado"`, `"rejeitado"`, `"agendado"`, `"pago"`. Both columns can hold `"pago"/"paid"` (different languages, same meaning). The transition map in `approval/types.ts` governs `approvalStatus` only. **What governs `status` transitions?** No map exists. | **DECISION**: Define whether `status` tracks the payment lifecycle independently or is derived from `approvalStatus`. See Decision D01 below. |
| A02 | **Pre-invoice seed uses `"pending"` but governance defines `"review"`** | Seed inserts `status: "pending"` for PI_001. The governance machine defines `review` as the "awaiting approval" state. `faturamento.ts STATUS_MAP` maps `review → "Pendente Aprovacao"` but has no entry for `"pending"`. | **DECISION**: Is `"pending"` a synonym for `"review"`, or should seed be corrected? See Decision D02. |
| A03 | **Lead `"negociacao"` and `"ganho"` states are unreachable** | The `MockLead` type includes these in its union. The governance doc defines transitions to them. But no action, no seed, no page ever writes these values. | **DECISION**: Are these valid states that will be activated in implementation, or dead code? See Decision D03. |
| A04 | **Proposal `"sent"` state is unreachable** | Same pattern as lead. STATUS_MAP includes it. No code writes it. Governance defines `draft → sent` transition. | **DECISION**: Will `"sent"` be implemented, or should `draft → approved` be direct? See Decision D04. |
| A05 | **Time entry `rejeitado → pendente` requires "edited after rejection" flag** | Governance guard says: `metadata.editedAfterRejection = true`. But `timeEntries` has no `metadata` column. The guard cannot be implemented without either a new column or repurposing an existing field. | **DECISION**: Where is this flag stored? See Decision D05. |
| A06 | **`tasks` has no `"cancelled"` or `"returned"` in any code** | Governance defines 5 states including `returned` and `cancelled`. Schema default is `"todo"`. No other values exist anywhere. | **DECISION**: Are task states implemented from scratch per governance, or are some states unnecessary? See Decision D06. |

---

## 2. CROSS-DOMAIN CONSISTENCY VALIDATION

### 2.1 Task Closure → Time Approval

**Question**: Can a task be marked `done` if it has pending (unapproved) time entries?

| Governance Says | Code Says | Consistency |
|---|---|---|
| Task transitions to `done` require reviewer (socio/admin). No explicit guard on time entry status. | No task action exists. No code links `tasks.id` to `timeEntries.taskId` in any business logic. | **GAP** |

**Analysis**:

`timeEntries.taskId` (FK → `tasks.id`, nullable) exists in schema. The relationship is defined in `timeEntriesRelations`. But:
- No action queries time entries by `taskId`.
- No task completion logic checks associated time entries.
- A task can be marked `done` with 10h of `pendente` time entries attached — those entries remain in limbo: the work is "done" but the hours are still pending approval.

**Risk**: An advogado marks a task as done. The socio never sees the time entries because they aren't surfaced in the approval queue by task. The hours are never approved, never billed. Revenue lost.

| Check | Result |
|---|---|
| Task `done` blocks unapproved time entries? | NO — no guard defined in governance or code |
| Time entry approval checks parent task status? | NO — approval only checks authority matrix |
| Task completion aggregates time entry hours? | NO — no sum/display of hours per task |

**Verdict**: **INCONSISTENT** — governance defines both machines independently with no cross-link. A task can close while its time entries are unapproved, creating an orphaned billing gap.

### 2.2 Time Approval → Cap Consumption

**Question**: Does approving a time entry immediately update the cap consumption calculation?

| Governance Says | Code Says | Consistency |
|---|---|---|
| Rule 2.3: cap check triggered on `updateTimeEntryStatus` when new status is `aprovado`. Calculates `SUM(durationMinutes) WHERE approvalStatus IN ('aprovado', 'faturado')`. | No cap logic exists. `updateTimeEntryStatus` only updates the row, no aggregate query, no threshold check. | **GAP** |

**Analysis**:

The governance doc defines a clear trigger chain:
1. Time entry approved → sum approved minutes for case+period
2. Compare to `billingPlans.monthlyHoursIncluded`
3. Alert at 80%, 100%, flag excess

But `billingPlans.monthlyHoursIncluded` (schema line 188) is nullable. The cap check must handle:
- NULL `monthlyHoursIncluded` → skip cap check (not a mixed plan)
- Zero `monthlyHoursIncluded` → every hour is excess (edge case)
- Multiple billing plans per case (no uniqueness constraint) → which plan's cap applies?

| Check | Result |
|---|---|
| Approval triggers cap recalculation? | NO — unimplemented |
| Cap threshold alerts exist? | NO — no notification mechanism |
| Multiple billing plans per case handled? | UNDEFINED — governance doesn't address this |
| NULL `monthlyHoursIncluded` handled? | UNDEFINED — governance rule assumes it exists |

**Verdict**: **INCONSISTENT** — the cap chain has an undefined behavior for NULL caps and multi-plan cases.

### 2.3 Cap Consumption → Pre-Invoice Generation

**Question**: Does the billing engine use cap data to split fixed vs excess hours correctly?

| Governance Says | Code Says | Consistency |
|---|---|---|
| Rule 2.4: `closePeriod()` queries approved entries, groups by case, calculates based on billing plan type. For `misto`: `fixedValue + MAX(0, totalHours - includedHours) * excessRate`. | `closePeriod()` does not exist. `handleRunEngine` on `faturamento/page.tsx` is a mock that picks from a hardcoded array. | **GAP** |

**Analysis**:

The governance billing formula references 4 fields from `billingPlans`:
- `monthlyValue` — for fixed component
- `monthlyHoursIncluded` — for cap threshold
- `excessRate` — for excess hours
- `taxRate` — for tax calculation

Cross-check against schema:

| Field | Exists in schema? | Nullable? | Used in any query? |
|---|---|---|---|
| `monthlyValue` | Yes (line 186) | Yes | No |
| `monthlyHoursIncluded` | Yes (line 188) | Yes | No |
| `excessRate` | Yes (line 189) | Yes | No |
| `taxRate` | Yes (line 191) | No (default "14.53") | No |
| `hourlyRate` | Yes (line 187) | Yes | No |
| `successPercentage` | Yes (line 190) | Yes | No |

All fields exist but none are queried anywhere in the codebase. The billing engine must be built from zero.

**Specific contradiction in governance**: Rule 2.4 step 5 says `SET timeEntries.preInvoiceId = newPreInvoice.id` during `closePeriod()`. But Rule 1.4 (Time Entry machine) says `aprovado → faturado` requires `preInvoiceId` to be set **simultaneously** with the status change. This means `closePeriod()` must:
1. Create the pre-invoice
2. Set `preInvoiceId` on entries
3. Change entry status to `faturado`

But Rule 2.4 step 5 says "do NOT change approvalStatus to 'faturado' yet — that happens only when pre-invoice reaches 'approved'". **These two rules contradict**:

| Document Section | Says |
|---|---|
| Machine 1.4 (Time Entry) | `aprovado → faturado` requires `preInvoiceId` to be set simultaneously |
| Rule 2.4 step 5 | Set `preInvoiceId` on entries during `closePeriod()` but do NOT change to `faturado` |

**Verdict**: **CONTRADICTION** — the document specifies two different moments for the `faturado` transition. Either `preInvoiceId` is set without changing status (breaking the "simultaneously" constraint), or status changes to `faturado` at generation time (contradicting Rule 2.4).

### 2.4 Pre-Invoice Approval → AR Creation

**Question**: What is the exact sequence when a pre-invoice is approved?

| Governance Says | Code Says | Consistency |
|---|---|---|
| Machine 1.5: `approved → invoiced` must create `invoices` row + `arTitles` row + update pre-invoice status, all in one transaction. | No code does this. `faturamento.ts` has only `getInvoices()` (read-only). | **GAP** |

**Analysis of the intended chain**:

```
Pre-Invoice.approved
  → create invoices row (with preInvoiceId, clientId, caseId, value, issueDate)
  → create arTitles row (with invoiceId, clientId, caseId, value, dueDate = issueDate + paymentTerms)
  → set preInvoices.status = "invoiced"
  → set all linked timeEntries.approvalStatus = "faturado"
  → (future: emit NFS-e, get nfseNumber)
```

Cross-check field availability:

| Target Field | Source | Available? |
|---|---|---|
| `invoices.preInvoiceId` | The pre-invoice being approved | Yes |
| `invoices.clientId` | `preInvoices.clientId` | Yes |
| `invoices.caseId` | `preInvoices.caseId` | Yes (nullable on invoice) |
| `invoices.value` | `preInvoices.totalValue` | Yes |
| `invoices.issueDate` | `today` | Runtime |
| `invoices.taxValue` | `preInvoices.taxValue` | Yes |
| `arTitles.invoiceId` | Newly created invoice's ID | Yes (from RETURNING) |
| `arTitles.clientId` | `preInvoices.clientId` | Yes |
| `arTitles.value` | `preInvoices.totalValue` | Yes |
| `arTitles.dueDate` | `invoices.issueDate + billingPlans.paymentTerms` | **REQUIRES JOIN** — `preInvoices.billingPlanId` → `billingPlans.paymentTerms` |

**Hidden dependency**: Calculating `arTitles.dueDate` requires looking up `billingPlans.paymentTerms` via `preInvoices.billingPlanId`. If `billingPlanId` is NULL on the pre-invoice, there is no source for payment terms. **The governance doc does not address this case.**

| Check | Result |
|---|---|
| Invoice creation has all required fields? | YES — if `billingPlanId` is set |
| AR title `dueDate` computation defined? | NO — governance says "dueDate" but doesn't specify computation |
| NULL `billingPlanId` handled? | NO — undefined behavior |
| Time entry `faturado` transition included in this transaction? | AMBIGUOUS — see contradiction in 2.3 |

**Verdict**: **INCONSISTENT** — missing `dueDate` computation rule, NULL `billingPlanId` path, and contradictory `faturado` timing.

---

## 3. CIRCULAR DEPENDENCY ANALYSIS

### 3.1 Dependency Graph (Entity Level)

```
Lead ──────► Client ──────► Case ──────┬──► TimeEntry ──► PreInvoice ──► Invoice ──► ArTitle
                                       │                     ▲                            │
                                       ├──► Task             │                            │
                                       │                     │                            │
                                       ├──► BillingPlan ─────┘                            │
                                       │                                                  │
                                       └──► CaseMember                                    │
                                                                                          │
                                                                        BankTransaction ◄─┘
                                                                              │
                                                                              ▼
                                                                        CashflowDaily
```

**No circular FK dependencies.** The graph is a DAG (directed acyclic graph). Confirmed by checking all FK references in `schema.ts` — no table references a table that directly or transitively references it back.

### 3.2 Logical Circular Dependencies (Non-FK)

| # | Cycle | Description | Severity |
|---|---|---|---|
| LCD-01 | **Case ↔ Proposal** | `cases.proposalId → proposals.id` AND `proposals.clientId → clients.id` AND `clients → cases` (via relation). A case can be created from a proposal, but a proposal can also be linked to a case after creation. No enforcement of which comes first. | LOW — both FKs are nullable. |
| LCD-02 | **Time Entry ↔ Pre-Invoice (state coupling)** | Time entry must be `aprovado` to be included in pre-invoice. Pre-invoice approval triggers time entry → `faturado`. But if the pre-invoice is rejected (`rejected → draft`), what happens to the linked time entries? Their `preInvoiceId` is set, their status is either `aprovado` or `faturado`. **The governance doc defines no reverse transition `faturado → aprovado`.** | **HIGH** — see Finding LCD-02 below. |
| LCD-03 | **AR Title ↔ Bank Transaction (reconciliation)** | `arTitles.bankTransactionId → bankTransactions.id`. AR title depends on bank transaction for reconciliation. But `arTitles.status → "paid"` depends on reconciliation. And bank reconciliation (`reconciliationMatches`) depends on AR title existing. Neither can be fully completed without the other. | MEDIUM — resolved by sequential processing (AR created first, bank matched later). |
| LCD-04 | **Pre-Invoice ↔ Billing Plan (period scoping)** | `closePeriod()` uses `billingPlans` to calculate values. But `billingPlans.isActive` can be set to `false` mid-period. If the plan is deactivated after time entries are logged but before `closePeriod()` runs, the engine finds no active plan. | MEDIUM — governance doesn't define behavior for deactivated plans. |

**Critical Finding LCD-02 — Expanded**:

The `faturado` state is defined as terminal in the time entry machine: `faturado: []` (no outgoing transitions). But the pre-invoice lifecycle allows `approved → rejected → draft`. When a pre-invoice is rejected:

| Question | Governance Answer | Practical Need |
|---|---|---|
| Do linked time entries stay `faturado`? | No reverse transition defined (`faturado → []`) | They should revert to `aprovado` so they can be re-included in a corrected pre-invoice |
| Is `preInvoiceId` cleared? | Not addressed | It should be cleared — the PI is now a draft, the link is logically broken |
| Can the engine re-generate for the same period? | Rule 2.4: rejected PIs are ignored, new draft created | But the old time entries still have `preInvoiceId` pointing to the old PI. New generation would not pick them up (they already have a `preInvoiceId`). |

**This is a deadlock**: Rejected pre-invoice → time entries stuck in `faturado` → engine can't re-include them → manual DB intervention required.

**Resolution required**: Either (a) add `faturado → aprovado` reverse transition when pre-invoice is rejected, or (b) define `preInvoiceId` clearing as part of the rejection transaction.

---

## 4. RACE CONDITION ANALYSIS (Previously Uncovered)

### 4.1 New Race Conditions

| # | Race | Scenario | Consequence | Governance Coverage |
|---|---|---|---|---|
| RC-N01 | **Approval during billing engine run** | Socio approves a time entry while `closePeriod()` is querying approved entries for the same case. The entry may or may not be included depending on query timing. | Non-deterministic pre-invoice amount. Same period re-run would produce different totals. | **NOT COVERED** — governance defines idempotency for duplicate `closePeriod()` calls, but not for concurrent approval + engine execution. |
| RC-N02 | **Concurrent discount request + payment** | Financeiro requests discount on an AR title (`approvalStatus → desconto_solicitado`). Simultaneously, a bank reconciliation marks the same AR as paid (`status → paid`, `bankTransactionId` set). | AR title has `status: "paid"` AND `approvalStatus: "desconto_solicitado"` — logically impossible state. Client paid in full, but a discount request is pending. | **NOT COVERED** — governance blocking rule says "cannot mark paid if approval is pending" but no code enforces this, and reconciliation happens via batch import, not through the approval-aware action. |
| RC-N03 | **Period close + time entry creation** | Advogado creates a new time entry for `02/2026`. Simultaneously, `closePeriod(caseId, "02/2026")` runs. Entry is created after the engine's `SELECT` but before its `UPDATE timeEntries SET preInvoiceId`. | New entry exists for the period but is not included in the pre-invoice. No error. Entry sits as `pendente` in a "closed" period. | **PARTIALLY COVERED** — governance says new entries are "allowed" in locked periods and can go to a supplementary PI. But governance does not define when/how supplementary PIs are created. |
| RC-N04 | **Concurrent lead conversion** | Two users click "Converter em Cliente" on the same lead simultaneously. Both check `SELECT FROM clients WHERE leadId = ?` — both find nothing. Both insert. | Two client records for the same lead. FK `clients.leadId` is not unique — duplicates are accepted. | **PARTIALLY COVERED** — idempotency check exists in governance (3.1), but the application-level `SELECT + INSERT` is not atomic. Between the SELECT and INSERT, the other request can complete. |
| RC-N05 | **Stale overdue check + payment arrival** | Daily cron marks AR as `overdue`. Simultaneously, bank import reconciles the same AR (sets `bankTransactionId`, `paidDate`, `paidValue`, `status: "paid"`). | Cron writes `status: "overdue"` after the bank import wrote `status: "paid"`. AR reverts to `overdue` despite being paid. | **NOT COVERED** — governance overdue rule (2.5) does not check if `paidDate IS NOT NULL` before marking overdue. |
| RC-N06 | **Dual-axis AR state conflict** | Socio approves a discount request (sets `approvalStatus: "aprovado"`, `paidValue`, `status: "paid"`). Simultaneously, the overdue cron fires (sets `status: "overdue"`). | `status` oscillates between `"paid"` and `"overdue"` depending on which write lands last. `approvalStatus` is `"aprovado"` but `status` is `"overdue"`. | **NOT COVERED** — the dual-axis model has no cross-axis locking. |

### 4.2 Governance-Covered Race Conditions (Verification)

| # | Race | Governance Solution | Solution Adequate? |
|---|---|---|---|
| RC-G01 | Two users approve same payable | Optimistic locking via `updatedAt` (Section 4.1). Second approve gets `CONFLICT`. | **ADEQUATE** — if implemented correctly. But requires all approval code paths to send `expectedUpdatedAt`, which no current page does. |
| RC-G02 | Double `closePeriod()` call | Idempotency check: `SELECT` existing PI for `(caseId, period)`. If found in draft → update. If found in review+ → block. (Section 2.4). | **PARTIALLY ADEQUATE** — the `SELECT + INSERT` is not atomic. Two simultaneous calls can both find nothing and both insert. Needs `SELECT FOR UPDATE` or unique constraint. |
| RC-G03 | Two users edit same lead | Optimistic locking via `updatedAt` (Section 4.3). | **ADEQUATE** — same caveat as RC-G01. |

---

## 5. COMPREHENSIVE CONTRADICTION / GAP REGISTER

### 5.1 Contradictions (Governance vs Code)

| # | Severity | Description | Governance Ref | Code Ref | Resolution |
|---|---|---|---|---|---|
| X01 | **CRITICAL** | `faturado` is terminal but pre-invoice rejection requires reverting entries | Machine 1.4: `faturado: []` | Machine 1.5: `rejected → draft` | Add `faturado → aprovado` transition gated by `preInvoice.status === 'rejected'`. Clear `preInvoiceId` in same transaction. |
| X02 | **CRITICAL** | `closePeriod()` sets `preInvoiceId` without changing status to `faturado`, but Machine 1.4 says they must happen simultaneously | Rule 2.4 step 5 | Machine 1.4 transition guard | **DECISION D07**: Choose one timing. Recommended: set `preInvoiceId` during `closePeriod()` WITHOUT changing status. Change to `faturado` only when pre-invoice reaches `approved`. This means `preInvoiceId IS NOT NULL` entries can still be `aprovado`. |
| X03 | **HIGH** | Pre-invoice guard `approvedBy !== createdBy` references non-existent column | Machine 1.5 transition guard | `preInvoices` table: no `createdBy` column | Use `approvedBy !== session.user.id` as a general self-approval block, or drop the guard. Proposals DO have `createdBy` — this guard was likely copied. |
| X04 | **HIGH** | Payable has two status columns with overlapping terminal values (`pago`/`paid`) | Machine 1.6 governs `approvalStatus` only | `schema.ts:313-314` — both columns exist independently | **DECISION D01**: See below. |
| X05 | **HIGH** | Seed uses pre-invoice status `"pending"` but governance/code only define `"draft"`, `"review"`, `"approved"`, `"invoiced"`, `"rejected"` | Seed line ~step 8 | `faturamento.ts STATUS_MAP` | Fix seed to use `"review"` instead of `"pending"`. |
| X06 | **MEDIUM** | Lead guard needs `metadata.editedAfterRejection` but `timeEntries` has no `metadata` column | Machine 1.4 resubmit guard | `schema.ts:158-177` — no `metadata` on `timeEntries` | Store flag in `rejectionComment` (clear it on resubmit = proof of edit) or use `updatedAt > rejectedAt` as implicit proof. |
| X07 | **MEDIUM** | AR overdue rule doesn't check `paidDate IS NOT NULL` | Rule 2.5 condition | — | Add condition: `AND paidDate IS NULL` to prevent re-marking paid AR as overdue. |
| X08 | **MEDIUM** | `"Encerrado"` (case status) is in STATUS_MAP but not in `MockCase` union | `cases.ts:37` | `mock-data.ts` MockCase type | Add `"Encerrado"` to MockCase union or remove from STATUS_MAP. |
| X09 | **LOW** | `"Rejeitada"` (proposal status) is in STATUS_MAP but not in `MockProposal` union | `proposals.ts:45` | `mock-data.ts` MockProposal type | Add `"Rejeitada"` to MockProposal union. |
| X10 | **LOW** | Tasks: `cancelled` and `returned` states exist only in governance, nowhere in code | Machine 1.3 | Zero references | Implement from scratch or simplify to 3 states: `todo`, `in_progress`, `done`. |

### 5.2 Gaps (Defined in Governance, Zero Code Exists)

| # | Feature | Status | First Code Needed |
|---|---|---|---|
| G01 | Lead transition enforcement | Guards defined, zero implementation | `machines.ts` (Step 1) |
| G02 | Proposal content freeze on send | Guard defined, zero implementation | Edit blocking (Step 6) |
| G03 | Task lifecycle (entire machine) | 5 states defined, zero code | New action file `tasks.ts` |
| G04 | Time entry self-approval block | Guard defined, zero implementation | Guard in `updateTimeEntryStatus` |
| G05 | Cap threshold alerts | Rule defined, zero implementation | `cap-threshold.ts` (Step 8) |
| G06 | `closePeriod()` billing engine | Rule defined, zero implementation | `faturamento.ts` (Step 7) |
| G07 | Pre-invoice → Invoice → AR chain | Transition defined, zero implementation | Transaction in `faturamento.ts` |
| G08 | Overdue AR auto-detection | Rule defined, zero implementation | `overdue-check.ts` (Step 9) |
| G09 | Stale lead detection | Rule defined, zero implementation | `follow-up.ts` (Step 9) |
| G10 | `updateReceivableStatus` action | Required by approval flow, doesn't exist | `financeiro.ts` (Step 3) |
| G11 | Exception queue writes | Table exists, zero writes anywhere | `exception-handler.ts` (Step 11) |
| G12 | Audit log writes | Table exists, zero writes anywhere | `audit.ts` (Step 12) |
| G13 | Period locking (`isPeriodLocked`) | Logic defined, zero implementation | `idempotency.ts` (Step 7) |
| G14 | Daily cron route handler | Triggers defined, no route exists | `api/cron/daily/route.ts` (Step 9) |

---

## 6. DECISIONS REQUIRED

| # | Decision | Context | Options | Recommendation |
|---|---|---|---|---|
| D01 | **Payable: relationship between `status` and `approvalStatus`** | Two columns with overlapping semantics. `status` = payment lifecycle (English). `approvalStatus` = approval lifecycle (Portuguese). Both can independently reach a "completed" state. | (A) Make `status` derived from `approvalStatus` — remove independent writes. (B) Keep both independent with a state compatibility matrix. (C) Merge into one column. | **(B) Keep both independent** with a cross-validation function: `isCompatible(status, approvalStatus)`. Example: `status = "paid"` requires `approvalStatus IN ("aprovado", "agendado", "pago")`. Block writes that produce incompatible pairs. No schema change needed. |
| D02 | **Pre-invoice seed: `"pending"` vs `"review"`** | Seed writes `"pending"` which is unmapped. Falls through to `"Rascunho"` display. | (A) Fix seed to use `"review"`. (B) Add `"pending"` to STATUS_MAP as alias for `"review"`. | **(A) Fix seed.** `"pending"` is not a defined state. Change to `"review"` in seed. One-line fix. |
| D03 | **Lead states `"negociacao"` and `"ganho"`: keep or remove?** | Exist in type union. Governance defines transitions to them. Zero code produces them. | (A) Keep — implement transitions in Step 2. (B) Remove — simplify to 4 states. | **(A) Keep.** They represent real business stages (negotiation and won). Implement in Step 2 when guards are wired. |
| D04 | **Proposal `"sent"` state: keep or remove?** | Exists in STATUS_MAP. Governance defines content freeze on sent. Zero code transitions to it. | (A) Keep — implement `draft → sent` in Step 2. (B) Remove — go direct `draft → approved`. | **(A) Keep.** The freeze-on-send rule is valuable. Sending a proposal should create a version snapshot. Without `"sent"`, there's no clean point to freeze content before approval. |
| D05 | **"Edited after rejection" flag for time entries** | `timeEntries` has no `metadata` column. Guard needs a signal that the entry was modified. | (A) Add `metadata` jsonb column (schema change — forbidden). (B) Use `updatedAt > approvedAt` as implicit proof. (C) Clear `rejectionComment` on resubmit — its absence proves the entry was touched. | **(B) Use `updatedAt` comparison.** If `updatedAt > approvedAt` (where `approvedAt` was the timestamp of rejection), the entry was modified after rejection. No schema change. Requires storing the rejection timestamp in `approvedAt` (already happens — `approvedAt` is set on status change). |
| D06 | **Task states: full 5 states or simplified?** | Governance defines `todo`, `in_progress`, `in_review`, `returned`, `done`, `cancelled`. No code exists. | (A) Implement all 5+1. (B) Start with 3: `todo`, `in_progress`, `done`. Add `in_review`/`returned` later. | **(B) Start with 3.** The executor/reviewer split adds complexity. Ship the basic lifecycle first. Add review flow as enhancement. |
| D07 | **When do time entries become `faturado`?** | Contradiction between Machine 1.4 (simultaneous with `preInvoiceId`) and Rule 2.4 (only on PI approval). | (A) At `closePeriod()` — set `preInvoiceId` AND `faturado` together. (B) At PI approval — set `preInvoiceId` during `closePeriod()`, set `faturado` only when PI reaches `approved`. | **(B) Two-stage.** Set `preInvoiceId` during `closePeriod()` without changing status. Time entries stay `aprovado` with `preInvoiceId` set (meaning "included in draft PI but not locked"). Change to `faturado` only when PI reaches `approved`. This allows PI rejection to simply clear `preInvoiceId` without needing a reverse `faturado → aprovado` transition. **Amend Machine 1.4**: `preInvoiceId` alone does NOT imply `faturado`. The hard lock is `approvalStatus === "faturado"`, not `preInvoiceId IS NOT NULL`. |

---

## 7. AMENDED STATE MACHINE RULES

Based on the decisions above, these corrections should be applied to GOVERNANCE_HARDENING.md:

### Amendment 1: Time Entry Machine (D07)

**Old**: `aprovado → faturado` requires `preInvoiceId` set simultaneously.
**New**:

| From | To | Guard | Blocking Rule |
|---|---|---|---|
| `aprovado` | `faturado` | Only triggered when parent pre-invoice transitions to `approved`. | Cannot faturar if `preInvoiceId IS NULL`. |

**New edit blocking**: `preInvoiceId IS NOT NULL AND approvalStatus === "faturado"` → full lock. `preInvoiceId IS NOT NULL AND approvalStatus === "aprovado"` → allow PI rejection to clear `preInvoiceId`, but block all other field edits.

### Amendment 2: Pre-Invoice Rejection Side Effects

**Add to Machine 1.5 transition `review → rejected` / `approved → rejected`**:

Side effect: `UPDATE timeEntries SET preInvoiceId = NULL WHERE preInvoiceId = :rejectedPiId AND approvalStatus != 'faturado'`. All entries linked to the rejected PI are unlinked. If any entries are already `faturado` (should not happen with D07, but defensive), they are NOT unlinked — write to `exceptionQueue`.

### Amendment 3: Payable Status Compatibility (D01)

**Add to Machine 1.6**:

```
COMPATIBLE_PAIRS = {
    status: "pending",    approvalStatus: ["pendente", "rejeitado"]
    status: "scheduled",  approvalStatus: ["aprovado", "agendado"]
    status: "overdue",    approvalStatus: ["pendente", "rejeitado"]
    status: "paid",       approvalStatus: ["aprovado", "agendado", "pago"]
}
```

Guard: before any write to either column, check `isCompatible(newStatus, newApprovalStatus)`. Block if incompatible.

### Amendment 4: Overdue Rule Fix (X07)

**Old**: `arTitles.dueDate < TODAY AND status = 'open'`
**New**: `arTitles.dueDate < TODAY AND status = 'open' AND paidDate IS NULL AND approvalStatus NOT IN ('desconto_solicitado', 'baixa_solicitada')`

### Amendment 5: Seed Fix (D02)

Change pre-invoice PI_001 status from `"pending"` to `"review"`.

---

## 8. VERIFICATION SUMMARY

| Category | Items Checked | Consistent | Contradictory | Ambiguous | Unimplemented |
|---|---|---|---|---|---|
| Lead Machine | 4 transitions, 3 guards | 0 | 3 (C02, C03, C04) | 1 (C01) | 3 guards |
| Proposal Machine | 5 transitions, 2 guards | 0 | 2 (C06, C07) | 1 (C05) | Full machine |
| Task Machine | 5 transitions, 3 guards | 0 | 1 (C09) | 1 (C08) | Entire machine |
| Time Entry Machine | 4 transitions, 3 guards | 1 (C10) | 2 (C11, C12) | 0 | 2 guards |
| Pre-Invoice Machine | 5 transitions, 3 guards | 0 | 2 (C13, C14) | 0 | Full machine |
| AR Title Machine | 10 transitions, 4 guards | 1 (C16) | 0 | 0 | 2 (C17, C18) |
| Payable Machine | 5 transitions, 1 guard | 1 (C19) | 0 | 1 (C20) | 0 |
| **Cross-domain chains** | 4 chains | 0 | 1 (cap→PI) | 0 | 4 full chains |
| **Circular deps** | 4 logical cycles | 0 | 1 (LCD-02) | 0 | — |
| **Race conditions** | 6 new + 3 existing | 0 | 0 | 0 | 6 new |
| **Total** | — | **3** | **12** | **4** | **17+ features** |

**Bottom line**: 12 contradictions, 4 ambiguities, 7 decisions required, 6 new race conditions discovered, 1 critical deadlock (LCD-02) that blocks the billing cycle if a pre-invoice is rejected.

All can be resolved at the logic layer. No schema changes needed. The 7 decisions and 5 amendments above produce a consistent governance model.

---

> **Document generated**: 2026-03-03
> **Method**: Formal cross-check of GOVERNANCE_HARDENING.md against schema.ts, approval/types.ts, all action files, seed.ts
> **Constraint**: No schema changes proposed. No refactor. Logic alignment only.
