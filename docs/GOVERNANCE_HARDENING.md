# GOVERNANCE HARDENING — Consolidated Logic Layer

> **Date**: 2026-03-03
> **Inputs**: ARCHITECTURAL_ORCHESTRATION.md + STRESS_TEST_FAILURE_SIMULATION.md
> **Scope**: Logic-layer only. No schema refactor. No new tables. No integrations.
> **Method**: Every state, guard, and rule maps to an existing column in `schema.ts`.

---

## TABLE OF CONTENTS

1. [6 Formalized State Machines](#1-formalized-state-machines)
2. [Internal Rule Engine (ECA)](#2-internal-rule-engine-eca)
3. [Idempotency Strategy](#3-idempotency-strategy)
4. [Concurrency Strategy](#4-concurrency-strategy)
5. [Governance Dashboard Model](#5-governance-dashboard-model)
6. [Implementation Order (12 Steps)](#6-implementation-order)

---

## 1. FORMALIZED STATE MACHINES

Each machine defines: **states**, **transitions**, **guards** (preconditions that must be true), **blocking rules** (conditions that prevent the transition), and **failure rollback** (what happens if the transition's side effect fails mid-execution).

All state values reference existing `varchar` columns. No new columns. No new tables.

---

### 1.1 Lead Lifecycle

**Column**: `leads.status` (varchar 50, default `"novo"`)
**Secondary**: `leads.temperature` (varchar 20, default `"morno"`)

```
                  ┌──────────────────────────────────────────────────┐
                  │                                                  │
    ┌─────┐    ┌──┴────────┐    ┌──────────────┐    ┌─────────┐    │
    │ novo │───►│contato_   │───►│proposta_     │───►│negociacao│    │
    │      │    │feito      │    │enviada       │    │         │    │
    └──┬───┘    └──┬────────┘    └──────┬───────┘    └────┬────┘    │
       │           │                    │                  │         │
       │           │                    │            ┌─────┴─────┐   │
       │           │                    │            │           │   │
       │           │                    │         ┌──▼──┐   ┌───▼──┐│
       └───────────┴────────────────────┴────────►│perdi│   │ganho ││
                   (from any state)               │do   │   │      ││
                                                  └─────┘   └──────┘│
                                                                     │
                                              ganho ──► (trigger:    │
                                              convertLeadToClient)   │
                                                                     │
                    rejeitado ◄── perdido (reopen)───────────────────┘
```

**States** (6):

| State | DB Value | Description |
|---|---|---|
| Novo | `"novo"` | Just captured. No contact made. |
| Contato Feito | `"contato_feito"` | First interaction happened. |
| Proposta Enviada | `"proposta_enviada"` | Formal proposal sent. |
| Negociacao | `"negociacao"` | Active price/scope negotiation. |
| Ganho | `"ganho"` | Won. Triggers client conversion. |
| Perdido | `"perdido"` | Lost. Can be reopened. |

**Transitions**:

| From | To | Guard | Blocking Rule |
|---|---|---|---|
| `novo` | `contato_feito` | `contactName` is non-empty | None |
| `contato_feito` | `proposta_enviada` | At least 1 proposal linked to this lead (`proposals.leadId`) OR `metadata.proposalSent = true` | Temperature cannot be `"frio"` — warm up first |
| `proposta_enviada` | `negociacao` | None | None |
| `negociacao` | `ganho` | `temperature` must be `"quente"` | Cannot win if no `value` set in `metadata` |
| `negociacao` | `perdido` | None | None |
| Any state | `perdido` | None | Cannot lose if already `ganho` |
| `perdido` | `novo` | None (reopen) | Must set `metadata.reopenReason` |
| `ganho` | — | Terminal for lead. Creates client. | Cannot revert. |

**Follow-up Enforcement** (see Rule Engine 2.1):
- Leads in `novo` or `contato_feito` for >7 days with no `metadata.lastContactDate` update → flagged as stale.
- Leads in `proposta_enviada` for >14 days → escalation alert to responsible.

**Failure Rollback**:
- `ganho` → `convertLeadToClient()` fails mid-execution → lead status stays `ganho`, client is NOT created, entry written to `exceptionQueue` with `type: "lead_conversion_failed"`, `source: "leads"`, `data: { leadId, error }`.
- On retry: check if client already exists for this lead (`clients.leadId`) before creating duplicate.

**Implementation** — `src/lib/governance/lead-machine.ts`:

```ts
const LEAD_TRANSITIONS: Record<string, string[]> = {
    novo: ["contato_feito", "perdido"],
    contato_feito: ["proposta_enviada", "perdido"],
    proposta_enviada: ["negociacao", "perdido"],
    negociacao: ["ganho", "perdido"],
    ganho: [],
    perdido: ["novo"],
};

function canTransitionLead(from: string, to: string): boolean {
    return (LEAD_TRANSITIONS[from] ?? []).includes(to);
}
```

---

### 1.2 Proposal Lifecycle

**Column**: `proposals.status` (varchar 50, default `"draft"`)

```
    ┌───────┐    ┌──────┐    ┌──────────┐    ┌──────────┐
    │ draft │───►│ sent │───►│ approved │───►│ invoiced │
    │       │    │      │    │          │    │ (→ case) │
    └───┬───┘    └──┬───┘    └──────────┘    └──────────┘
        │           │              ▲
        │           ▼              │ (revision)
        │      ┌──────────┐       │
        │      │ rejected │───────┘
        │      └──────────┘
        │
        └──► (delete — only from draft)
```

**States** (5):

| State | DB Value | Description |
|---|---|---|
| Rascunho | `"draft"` | Being edited. Content is mutable. |
| Enviada | `"sent"` | Sent to client for review. Content frozen. |
| Aprovada | `"approved"` | Client accepted. Can convert to case. |
| Rejeitada | `"rejected"` | Client rejected. Can revise and resend. |
| Convertida | `"invoiced"` | Converted to case + billing plan. Terminal. |

**Transitions**:

| From | To | Guard | Blocking Rule |
|---|---|---|---|
| `draft` | `sent` | `content.title` exists AND `content.sections.length > 0` | Cannot send empty proposal |
| `sent` | `approved` | Only `socio` or `admin` can approve | None |
| `sent` | `rejected` | `rejectionComment` must be provided | None |
| `rejected` | `draft` | None (back to editing) | Must increment version in `proposalVersions` |
| `approved` | `invoiced` | Client must exist (`proposals.clientId` set) | Cannot convert if case already created for this proposal (`cases.proposalId` match) |
| `draft` | (delete) | Only creator (`createdBy === session.user.id`) or `admin` | Cannot delete if status is not `draft` |

**Content Immutability Rule**:
- When status transitions to `sent`: create a `proposalVersions` row with current `content` snapshot and increment `version`.
- When in `sent` or `approved`: any edit attempt must be blocked at the action layer — return `{ success: false, error: "Proposta congelada" }`.
- Return to `draft` (via `rejected`) unfreezes content.

**Failure Rollback**:
- `approved` → `invoiced` (convert to case) fails → proposal stays `approved`, no case created, write to `exceptionQueue`. On retry: check `cases.proposalId` to prevent duplicate case.

---

### 1.3 Task Lifecycle

**Column**: `tasks.status` (varchar 50, default `"todo"`)
**Secondary**: `tasks.assigneeId` (FK → users.id, nullable)

```
    ┌──────┐    ┌────────────┐    ┌───────────┐    ┌──────┐
    │ todo │───►│ in_progress│───►│ in_review │───►│ done │
    │      │    │            │    │           │    │      │
    └──┬───┘    └─────┬──────┘    └─────┬─────┘    └──────┘
       │              │                 │
       │              │                 ▼
       │              │           ┌───────────┐
       │              ◄───────────│ returned  │
       │                          └───────────┘
       │
       └──► cancelled (from any non-done state)
```

**States** (5):

| State | DB Value | Role |
|---|---|---|
| A Fazer | `"todo"` | Created by manager/socio. Unassigned or assigned. |
| Em Andamento | `"in_progress"` | Executor (advogado) is working on it. |
| Em Revisao | `"in_review"` | Executor finished. Reviewer (socio/manager) evaluates. |
| Devolvida | `"returned"` | Reviewer sent back for corrections. |
| Concluida | `"done"` | Reviewer accepted. Terminal. |

**Transitions**:

| From | To | Guard | Blocking Rule |
|---|---|---|---|
| `todo` | `in_progress` | `assigneeId` must be set | Cannot start unassigned task |
| `in_progress` | `in_review` | `description` or `checklist` must have content (proof of work) | None |
| `in_review` | `done` | Only reviewer role (`socio`, `admin`) can mark done | None |
| `in_review` | `returned` | Must include `metadata.returnReason` | None |
| `returned` | `in_progress` | Only original `assigneeId` can resume | None |
| Any except `done` | `cancelled` | Only `socio` or `admin` | Cannot cancel a `done` task |

**Executor vs. Reviewer**:
- **Executor**: the user in `assigneeId`. Can transition `todo → in_progress → in_review` and `returned → in_progress`.
- **Reviewer**: the case owner or socio. Can transition `in_review → done` or `in_review → returned`.
- Guard: `if (transition targets 'done' or 'returned') require role in ['socio', 'admin']`.

**Failure Rollback**: Tasks are atomic single-row updates. No side effects to roll back. If the update fails, status stays unchanged.

---

### 1.4 Time Entry Lifecycle

**Column**: `timeEntries.approvalStatus` (varchar 50, default `"pendente"`)
**Lock column**: `timeEntries.preInvoiceId` (FK → preInvoices.id, nullable)

```
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ pendente │───►│ aprovado │───►│ faturado │
    │ (draft)  │    │          │    │ (locked) │
    └────┬─────┘    └──────────┘    └──────────┘
         │               ▲
         ▼               │ (resubmit)
    ┌──────────┐         │
    │rejeitado │─────────┘
    └──────────┘
```

**States** (4):

| State | DB Value | Mutability |
|---|---|---|
| Pendente | `"pendente"` | Fully editable by creator. Duration, description, case, date — all mutable. |
| Aprovado | `"aprovado"` | Immutable. Only transition to `faturado` allowed. |
| Rejeitado | `"rejeitado"` | Editable by creator. Must fix and resubmit. |
| Faturado | `"faturado"` | Hard-locked. `preInvoiceId` is set. No edits, no transitions. |

**Transitions**:

| From | To | Guard | Blocking Rule |
|---|---|---|---|
| `pendente` | `aprovado` | Only `socio`/`admin` (authority matrix). `durationMinutes > 0`. `caseId` must reference an active case (`cases.status = 'active'`). | Cannot approve own entries (`approvedBy !== userId`). |
| `pendente` | `rejeitado` | Only `socio`/`admin`. `rejectionComment` must be non-empty. | None |
| `rejeitado` | `pendente` | Only original `userId` can resubmit. Entry must have been edited (description or duration changed). | Cannot resubmit without changes (guard: `metadata.editedAfterRejection = true`). |
| `aprovado` | `faturado` | Only billing engine. `preInvoiceId` must be set simultaneously. | Cannot faturar if case is `paused` or `closed`. |

**Edit Blocking Rules**:
- If `approvalStatus === "aprovado"`: reject all field edits. Return `{ success: false, error: "Apontamento aprovado nao pode ser editado" }`.
- If `approvalStatus === "faturado"`: reject all field edits AND status changes. Return `{ success: false, error: "Apontamento faturado esta bloqueado" }`.
- If `preInvoiceId IS NOT NULL`: reject all changes regardless of status. The `preInvoiceId` foreign key is the hard lock.

**Failure Rollback**:
- `aprovado → faturado` (billing engine sets `preInvoiceId`): if the pre-invoice creation fails after some time entries have been updated, use `db.transaction()` to ensure atomicity — either all entries are marked `faturado` with `preInvoiceId` set, or none are.

---

### 1.5 Pre-Invoice Lifecycle

**Column**: `preInvoices.status` (varchar 50, default `"draft"`)

```
    ┌───────┐    ┌────────┐    ┌──────────┐    ┌──────────┐
    │ draft │───►│ review │───►│ approved │───►│ invoiced │
    │       │    │        │    │          │    │          │
    └───┬───┘    └────┬───┘    └──────────┘    └──────────┘
        │             │
        │             ▼
        │        ┌──────────┐
        │        │ rejected │──► draft (reopen)
        │        └──────────┘
        │
        └──► (void — cancellation, from draft only)
```

**States** (5):

| State | DB Value | Description |
|---|---|---|
| Rascunho | `"draft"` | Generated by engine. Line items editable. |
| Em Revisao | `"review"` | Submitted for socio approval. Frozen. |
| Aprovada | `"approved"` | Socio accepted. Ready for NFS-e emission. |
| Faturada | `"invoiced"` | NFS-e emitted. Invoice record created. Terminal. |
| Rejeitada | `"rejected"` | Socio rejected. Returns to draft. |

**Transitions**:

| From | To | Guard | Blocking Rule |
|---|---|---|---|
| `draft` | `review` | `lineItems` must be non-empty array. `totalValue > 0`. `referencePeriod` must be set. | Cannot submit if period is locked (see Idempotency 3.2). |
| `review` | `approved` | Only `socio`/`admin`. | Cannot approve own submission (`approvedBy !== createdBy`). |
| `review` | `rejected` | Only `socio`/`admin`. Must provide rejection reason in `notes`. | None |
| `rejected` | `draft` | Only creator or `admin`. | None |
| `approved` | `invoiced` | NFS-e emission must succeed (future). `invoices` row created. AR title created. | Cannot invoice if client has no CNPJ (`clients.cnpj IS NULL`). |
| `draft` | (void/delete) | Only creator. No time entries linked (`timeEntries.preInvoiceId` referencing this PI must be 0). | Cannot void if any time entry references it. |

**Line Item Edit Blocking**:
- `status === "draft"` or `status === "rejected"`: line items are mutable.
- `status === "review"` or `status === "approved"` or `status === "invoiced"`: line items are frozen. Any edit rejected.

**Failure Rollback**:
- `approved → invoiced` is the most complex transition — it must:
  1. Create `invoices` row
  2. Create `arTitles` row
  3. Update `preInvoices.status` to `"invoiced"`
  4. (Future: emit NFS-e)
- All 3 DB writes in a single `db.transaction()`. If any fails, all roll back. Pre-invoice stays `approved`. Write failure to `exceptionQueue`.

---

### 1.6 AR Title (Accounts Receivable) Lifecycle

**Columns**: `arTitles.status` (varchar 50, default `"open"`), `arTitles.approvalStatus` (varchar 50, default `"pendente"`), `arTitles.requestedAction` (varchar 50, nullable)

```
    ┌──────┐                              ┌────────┐
    │ open │─────── (payment) ───────────►│ paid   │
    │      │                              └────────┘
    └──┬───┘                                   ▲
       │                                       │
       ├── (past dueDate) ──► overdue ─────────┘ (late payment)
       │
       ├── (partial payment) ──► partial ──────► paid (remaining settled)
       │
       │            DISCOUNT / WRITE-OFF FLOW
       │
       ├── requestedAction="desconto" ──► approvalStatus="desconto_solicitado"
       │                                        │
       │                                   ┌────┴────┐
       │                                   ▼         ▼
       │                             aprovado    rejeitado
       │                            (apply       (revert to
       │                            discount)     pendente)
       │
       └── requestedAction="baixa" ──► approvalStatus="baixa_solicitada"
                                              │
                                         ┌────┴────┐
                                         ▼         ▼
                                   aprovado    rejeitado
                                  (write off    (revert)
                                   to zero)
```

**States** — Two-axis model:

Payment status (`arTitles.status`):

| State | DB Value |
|---|---|
| Em Aberto | `"open"` |
| Pago | `"paid"` |
| Atrasado | `"overdue"` |
| Parcial | `"partial"` |

Approval status (`arTitles.approvalStatus`):

| State | DB Value | Trigger |
|---|---|---|
| Pendente | `"pendente"` | Default. No action requested. |
| Desconto Solicitado | `"desconto_solicitado"` | Financeiro sets `requestedAction = "desconto"` |
| Baixa Solicitada | `"baixa_solicitada"` | Financeiro sets `requestedAction = "baixa"` |
| Aprovado | `"aprovado"` | Socio/admin approved the requested action |
| Rejeitado | `"rejeitado"` | Socio/admin rejected the requested action |

**Transitions** — Payment axis:

| From | To | Guard | Blocking Rule |
|---|---|---|---|
| `open` | `paid` | `bankTransactionId` set (reconciled) OR manual settlement. `paidDate` and `paidValue` must be set. | Cannot mark paid if `approvalStatus === "desconto_solicitado"` or `"baixa_solicitada"` (pending approval blocks payment processing). |
| `open` | `overdue` | Automatic: `dueDate < today AND status === 'open'` | None (cron/check trigger). |
| `open` | `partial` | `paidValue < value`. `paidDate` set. | Same blocking as `paid`. |
| `partial` | `paid` | Remaining balance settled. | None |
| `overdue` | `paid` | Late payment received. | None |

**Transitions** — Approval axis:

| From | To | Guard | Blocking Rule |
|---|---|---|---|
| `pendente` | `desconto_solicitado` | `requestedAction = "desconto"`. `requestedBy` set. Discount amount in `metadata.requestedDiscountValue`. | Cannot request discount on `paid` AR. |
| `pendente` | `baixa_solicitada` | `requestedAction = "baixa"`. `requestedBy` set. Reason in `notes`. | Cannot write off a `paid` AR. |
| `desconto_solicitado` | `aprovado` | Only `socio`/`admin`. | None |
| `desconto_solicitado` | `rejeitado` | Only `socio`/`admin`. `rejectionComment` required. | None |
| `baixa_solicitada` | `aprovado` | Only `socio`/`admin`. | None |
| `baixa_solicitada` | `rejeitado` | Only `socio`/`admin`. `rejectionComment` required. | None |
| `rejeitado` | `pendente` | Financeiro can resubmit with updated reason. | None |

**Side Effects on Approval**:
- Discount approved → set `paidValue = value - discountAmount`, `paidDate = today`, `status = "paid"`. One transaction.
- Baixa approved → set `paidValue = 0`, `paidDate = today`, `status = "paid"`. One transaction.
- Both write `approvedBy`, `approvedAt`.

**Failure Rollback**: All side effects execute in a single `db.transaction()`. If the status update succeeds but `paidValue` write fails, everything rolls back. AR title stays in the requested state.

---

## 2. INTERNAL RULE ENGINE (ECA)

Each rule is defined as **Event → Condition → Action**. All use existing columns. No new tables.

---

### 2.1 Follow-up Stale Detection

```
EVENT:    Scheduled check (daily cron via API route or on-page-load check)
CONDITION: leads.status IN ('novo', 'contato_feito')
           AND (leads.metadata->>'lastContactDate' IS NULL
                OR leads.metadata->>'lastContactDate' < NOW() - INTERVAL '7 days')
           AND leads.status != 'perdido' AND leads.status != 'ganho'
ACTION:   1. Flag lead as stale: SET metadata.isStale = true
          2. Create notification entry for responsible user
          3. If stale > 14 days: escalate to socio (write to exceptionQueue
             with type: "stale_lead", source: "leads", data: { leadId, daysSinceContact })
```

**Implementation location**: `src/lib/governance/rules/follow-up.ts`
**Trigger**: Called from `getLeads()` on every load (lightweight) or from `/api/cron/daily` route handler.
**Existing columns used**: `leads.metadata` (jsonb), `leads.status`, `leads.createdAt`

---

### 2.2 Mandatory Time Enforcement

```
EVENT:    Time entry submission (createTimeEntry called)
CONDITION: Check if the user has minimum daily hours logged for the work date
           COUNT(timeEntries WHERE userId = ? AND date = ? AND approvalStatus != 'rejeitado')
           sum(durationMinutes) for the date
ACTION:   1. If submitting and case.status != 'active': BLOCK with error
          2. If entry.isBillable = true AND user.hourlyRate IS NULL: WARN (not block)
          3. If entry.durationMinutes > 720 (12h): WARN with "Apontamento acima de 12h"
          4. If total daily minutes + new entry > 960 (16h): BLOCK with
             "Total diario excede 16 horas — verifique os apontamentos"
```

**Implementation location**: `src/lib/governance/rules/time-validation.ts`
**Trigger**: Guard function called inside `createTimeEntry()` action, before insert.
**Existing columns used**: `timeEntries.durationMinutes`, `timeEntries.date`, `timeEntries.userId`, `cases.status`

---

### 2.3 Cap Threshold Enforcement (80%, 100%, Exceeded)

```
EVENT:    Time entry approved (updateTimeEntryStatus to 'aprovado')
          OR billing engine closePeriod() execution
CONDITION: For billing plans where type = 'misto' (mixed):
           totalApprovedMinutes = SUM(timeEntries.durationMinutes
              WHERE caseId = ? AND date BETWEEN periodStart AND periodEnd
              AND approvalStatus IN ('aprovado', 'faturado') AND isBillable = true)
           includedMinutes = billingPlans.monthlyHoursIncluded * 60
ACTION:   1. At 80% (totalApprovedMinutes >= includedMinutes * 0.8):
              Write notification to responsible socio:
              "Caso X atingiu 80% das horas incluidas ({used}h de {included}h)"
          2. At 100% (totalApprovedMinutes >= includedMinutes):
              Write warning: "Caso X atingiu 100% das horas incluidas.
              Horas adicionais serao cobradas a R$ {excessRate}/h"
          3. At >100% (exceeded):
              Calculate excess: (totalMinutes - includedMinutes) / 60 * excessRate
              Store in metadata for billing engine to pick up
              No blocking — excess is billable, not forbidden
```

**Implementation location**: `src/lib/governance/rules/cap-threshold.ts`
**Trigger**: Called after `updateTimeEntryStatus` when new status is `aprovado`. Called during `closePeriod()`.
**Existing columns used**: `billingPlans.monthlyHoursIncluded`, `billingPlans.excessRate`, `timeEntries.durationMinutes`, `timeEntries.isBillable`, `timeEntries.approvalStatus`

---

### 2.4 Idempotent Pre-Invoice Generation

```
EVENT:    closePeriod(caseId, referencePeriod) called
CONDITION: Check for existing pre-invoice:
           SELECT id FROM preInvoices
           WHERE caseId = ? AND referencePeriod = ? AND status != 'rejected'
ACTION:   1. If existing pre-invoice found with status 'draft':
              UPDATE existing (recalculate line items, update totalValue)
              Do NOT create a new one
          2. If existing with status 'review', 'approved', or 'invoiced':
              BLOCK: "Periodo ja possui pre-fatura em processamento (status: {status})"
              Return { success: false, error, existingId }
          3. If existing with status 'rejected':
              IGNORE the rejected one. Create a new draft.
          4. If no existing:
              INSERT new preInvoice with status 'draft'
          5. After insert/update:
              SET timeEntries.preInvoiceId = newPreInvoice.id
              for all entries included in the calculation
              (but do NOT change approvalStatus to 'faturado' yet —
              that happens only when pre-invoice reaches 'approved')
```

**Implementation location**: `src/lib/governance/rules/billing-engine.ts`
**Trigger**: `closePeriod()` action (to be created in `src/lib/actions/faturamento.ts`)
**Existing columns used**: `preInvoices.caseId`, `preInvoices.referencePeriod`, `preInvoices.status`, `timeEntries.preInvoiceId`

---

### 2.5 Overdue AR Escalation

```
EVENT:    Scheduled check (daily cron) OR on-load of financeiro page
CONDITION: arTitles.dueDate < TODAY
           AND arTitles.status = 'open'
           AND arTitles.approvalStatus NOT IN ('baixa_solicitada', 'desconto_solicitado')
ACTION:   1. SET arTitles.status = 'overdue' (automatic status change)
          2. If overdue by 1-7 days: log to metadata.overdueNotifiedAt (first notice)
          3. If overdue by 8-30 days: escalate to socio (write exceptionQueue
             with type: "ar_overdue_escalation", data: { arId, clientId, daysPastDue, value })
          4. If overdue by >30 days: flag for baixa consideration
             (write exceptionQueue with type: "ar_write_off_candidate")
```

**Implementation location**: `src/lib/governance/rules/overdue-check.ts`
**Trigger**: `/api/cron/daily` route handler or called from `getReceivables()`.
**Existing columns used**: `arTitles.dueDate`, `arTitles.status`, `arTitles.approvalStatus`, `exceptionQueue.*`

---

### 2.6 Concurrency Handling Strategy (ECA Rule)

```
EVENT:    Any mutation action that updates a row (approve, reject, status change, edit)
CONDITION: Read current row's `updatedAt` timestamp before update
ACTION:   1. Include WHERE clause: `AND updatedAt = :expectedUpdatedAt`
          2. Check affected rows count after UPDATE
          3. If affectedRows === 0:
              Return { success: false, error: "Registro foi alterado por outro usuario.
              Recarregue a pagina e tente novamente.", code: "CONFLICT" }
          4. If affectedRows === 1:
              Return { success: true }
          5. The UI, on receiving code "CONFLICT", should:
              - Show warning toast
              - Reload data
              - Re-present the item with current state
```

**Implementation location**: `src/lib/governance/concurrency.ts`
**Trigger**: Every mutation action.
**Existing columns used**: `updatedAt` (exists on: `leads`, `cases`, `proposals`, `timeEntries`, `preInvoices`, `accountsPayable`, `arTitles` via `createdAt`/`updatedAt` timestamps)

---

## 3. IDEMPOTENCY STRATEGY

### 3.1 Unique Constraints Logic (Application-Level)

No schema changes. Enforced at the action layer with pre-flight queries.

| Entity | Uniqueness Rule | Implementation |
|---|---|---|
| Pre-Invoice | One non-rejected PI per `(caseId, referencePeriod)` | `SELECT id FROM preInvoices WHERE caseId = ? AND referencePeriod = ? AND status != 'rejected'` before insert. If found, update or block. |
| Case Member | One membership per `(caseId, userId)` | `SELECT id FROM caseMembers WHERE caseId = ? AND userId = ?` before insert. If found, skip. |
| Time Entry | No duplicate for `(userId, caseId, date, description)` within 1 minute | `SELECT id FROM timeEntries WHERE userId = ? AND caseId = ? AND date = ? AND description = ? AND createdAt > NOW() - INTERVAL '1 minute'`. If found, return existing ID. |
| Bank Reconciliation | One match per `bankTransactionId` | `SELECT id FROM reconciliationMatches WHERE bankTransactionId = ?` before insert. If found, skip. |
| Lead → Client conversion | One client per lead | `SELECT id FROM clients WHERE leadId = ?` before insert. If found, return existing client ID. |
| Proposal → Case conversion | One case per proposal | `SELECT id FROM cases WHERE proposalId = ?` before insert. If found, return existing case ID. |

### 3.2 Period Locking Model

A billing period is implicitly locked when its pre-invoice reaches `review` or beyond.

```
function isPeriodLocked(caseId: string, period: string): Promise<boolean> {
    const existing = await db.select({ status: preInvoices.status })
        .from(preInvoices)
        .where(
            and(
                eq(preInvoices.caseId, caseId),
                eq(preInvoices.referencePeriod, period),
                inArray(preInvoices.status, ["review", "approved", "invoiced"])
            )
        )
        .limit(1);
    return existing.length > 0;
}
```

**What is blocked when a period is locked**:
- New `closePeriod()` calls for that `(caseId, period)` → blocked.
- New time entries for that period with `date` falling within it → allowed (they won't be included in the existing PI). They can be included in a supplementary PI or next period.
- Editing time entries already linked to the PI (`preInvoiceId` set) → blocked.

**Unlock**: Only when the PI is `rejected` (returns to `draft`, which can be voided).

### 3.3 Double Execution Prevention

Every mutation action follows this pattern:

```ts
export async function performAction(params) {
    // 1. Auth check
    const session = await auth();
    if (!session?.user) return { success: false, error: "Nao autenticado" };

    // 2. Validate input
    const parsed = schema.safeParse(params);
    if (!parsed.success) return { success: false, error: "Dados invalidos" };

    // 3. Idempotency check (pre-flight query)
    const existing = await db.select()...;
    if (existing) return { success: true, id: existing.id, alreadyExisted: true };

    // 4. Execute in transaction
    return await db.transaction(async (tx) => {
        // ... all writes ...
        return { success: true, id: newRow.id };
    });
}
```

**UI-side double-submit prevention**:
- Every button that triggers a mutation must set `loading = true` before the call and restore on completion.
- The `disabled={loading}` prop prevents double clicks.
- Server-side idempotency (step 3 above) catches any race condition that slips through.

---

## 4. CONCURRENCY STRATEGY

### 4.1 Approach: Optimistic Locking via `updatedAt`

**Why optimistic, not pessimistic**: The system has low concurrency (1-10 concurrent users in a single law firm). Pessimistic locking (SELECT FOR UPDATE) adds latency and deadlock risk for minimal benefit. Optimistic locking detects conflicts cheaply.

**Mechanism**: Every entity table already has `createdAt` and `updatedAt` (set to `defaultNow()`). Use `updatedAt` as the version token.

```ts
// In every update action:
async function updateEntity(id: string, data: Partial<Entity>, expectedUpdatedAt: string) {
    const result = await db.update(table)
        .set({ ...data, updatedAt: new Date() })
        .where(
            and(
                eq(table.id, id),
                eq(table.updatedAt, new Date(expectedUpdatedAt))
            )
        );

    if (result.rowCount === 0) {
        return { success: false, error: "Conflito de concorrencia", code: "CONFLICT" };
    }
    return { success: true };
}
```

### 4.2 Versioning Strategy

**Not a separate version column**. The `updatedAt` timestamp IS the version. Every write updates it. Every read includes it. Every write checks it.

**Client-side flow**:
1. Page loads entity → stores `entity.updatedAt` in component state.
2. User edits fields.
3. On save, sends `{ ...changes, _expectedVersion: entity.updatedAt }`.
4. Action compares `_expectedVersion` against current `updatedAt`.
5. Match → update proceeds, new `updatedAt` returned to client.
6. Mismatch → `CONFLICT` returned, client reloads.

### 4.3 Conflict Resolution Rules

| Conflict Type | Resolution | User Experience |
|---|---|---|
| Two users edit same lead | Last-write blocked. Stale writer gets CONFLICT. | Toast: "Lead alterado por outro usuario. Recarregue." |
| Two users approve same payable | First approve succeeds. Second gets CONFLICT because `updatedAt` changed. | Toast: "Este item ja foi processado. Recarregando..." |
| Billing engine + manual edit on same time entry | Engine runs in transaction. Manual edit blocked by `preInvoiceId IS NOT NULL` guard. | Error: "Apontamento em processamento pelo faturamento." |
| Two browser tabs, same user, same entity | Same as two-user conflict. `updatedAt` check applies. | Same toast. |

### 4.4 Entities That Do NOT Need Concurrency Control

| Entity | Reason |
|---|---|
| Leads (creation) | Each lead is independently created. No shared state. |
| Time entries (creation) | Each user creates their own. `userId` is from session. |
| Bank transactions | Imported via batch. No concurrent manual creation. |
| Audit logs | Append-only. No update. No conflict possible. |
| Exception queue | Append-only. Workers may update `status` but with dedicated patterns. |

---

## 5. GOVERNANCE DASHBOARD MODEL

Three views of the same data, filtered by role. No new tables — all queries hit existing tables.

### 5.1 CEO View (role: `socio`)

**Purpose**: "Is the firm healthy? What needs my attention?"

| Widget | Query | Columns Used |
|---|---|---|
| **Revenue This Month** | `SUM(arTitles.value) WHERE status = 'open' AND dueDate BETWEEN firstOfMonth AND lastOfMonth` | `arTitles.value`, `.dueDate`, `.status` |
| **Cash Collected This Month** | `SUM(arTitles.paidValue) WHERE paidDate BETWEEN firstOfMonth AND lastOfMonth` | `arTitles.paidValue`, `.paidDate` |
| **Overdue AR** | `SUM(arTitles.value) WHERE status = 'overdue'` + `COUNT(*)` | `arTitles.value`, `.status` |
| **Pending My Approval** | `COUNT(*) FROM accountsPayable WHERE approvalStatus = 'pendente'` + same for arTitles (desconto/baixa) + timeEntries | 3 tables, `approvalStatus` column |
| **Pipeline Funnel** | `COUNT(leads) GROUP BY status` | `leads.status` |
| **Team Utilization** | `SUM(timeEntries.durationMinutes) WHERE date BETWEEN mon AND fri GROUP BY userId` / `(40 * 60)` target | `timeEntries.durationMinutes`, `.userId`, `.date` |
| **Partner Vault Balance** | `SUM(partnerLedger.value) WHERE partnerId = myPartnerId GROUP BY type` | `partnerLedger.value`, `.type`, `.partnerId` |
| **Stale Leads** | `COUNT(leads) WHERE metadata->>'isStale' = 'true'` | `leads.metadata` |
| **Exception Queue** | `COUNT(exceptionQueue) WHERE status = 'pending'` | `exceptionQueue.status` |

### 5.2 Manager View (role: `financeiro`)

**Purpose**: "Are payments on track? What is blocked?"

| Widget | Query | Columns Used |
|---|---|---|
| **Total A Pagar (Pendente)** | `SUM(accountsPayable.value) WHERE status IN ('pending', 'scheduled') AND approvalStatus != 'rejeitado'` | `accountsPayable.value`, `.status`, `.approvalStatus` |
| **Total A Receber (Em Aberto)** | `SUM(arTitles.value) WHERE status IN ('open', 'overdue')` | `arTitles.value`, `.status` |
| **Overdue Payables** | `COUNT(*), SUM(value) FROM accountsPayable WHERE status = 'overdue'` | `accountsPayable.value`, `.status` |
| **Bank Reconciliation** | `COUNT(bankTransactions) WHERE isReconciled = false` | `bankTransactions.isReconciled` |
| **Pending Approval Queue** | Same as CEO but with action buttons (cannot approve, can submit) | 3 tables |
| **Discount/Writeoff Requests** | `SELECT * FROM arTitles WHERE approvalStatus IN ('desconto_solicitado', 'baixa_solicitada')` | `arTitles.approvalStatus`, `.requestedAction` |
| **Cashflow Projection** | `SUM(arTitles.value) GROUP BY MONTH(dueDate)` as inflow. `SUM(accountsPayable.value) GROUP BY MONTH(dueDate)` as outflow. | Both tables, `.value`, `.dueDate` |
| **Pre-Invoices in Draft** | `COUNT(*), SUM(totalValue) FROM preInvoices WHERE status = 'draft'` | `preInvoices.totalValue`, `.status` |

### 5.3 Executor View (role: `advogado`)

**Purpose**: "What do I need to do today? How are my hours?"

| Widget | Query | Columns Used |
|---|---|---|
| **My Hours Today** | `SUM(timeEntries.durationMinutes) WHERE userId = me AND date = today` | `timeEntries.durationMinutes`, `.userId`, `.date` |
| **My Hours This Week** | Same with `date BETWEEN monday AND friday` | Same |
| **My Rejected Entries** | `SELECT * FROM timeEntries WHERE userId = me AND approvalStatus = 'rejeitado'` | `timeEntries.approvalStatus` |
| **My Cases** | `SELECT cases.* FROM cases JOIN caseMembers ON ... WHERE caseMembers.userId = me AND cases.status = 'active'` | `cases.*`, `caseMembers.userId` |
| **My Tasks (A Fazer)** | `SELECT * FROM tasks WHERE assigneeId = me AND status IN ('todo', 'in_progress', 'returned')` | `tasks.assigneeId`, `.status` |
| **My Pending Submissions** | `COUNT(timeEntries) WHERE userId = me AND approvalStatus = 'pendente'` | `timeEntries.approvalStatus` |
| **Cap Alert** | For each of my cases with `misto` billing: hours used vs included (see Rule 2.3) | `billingPlans.monthlyHoursIncluded`, `timeEntries.durationMinutes` |

### 5.4 Role → Widget Visibility Matrix

| Widget | socio | financeiro | advogado | admin |
|---|---|---|---|---|
| Revenue This Month | Yes | Yes | — | Yes |
| Cash Collected | Yes | Yes | — | Yes |
| Overdue AR | Yes | Yes | — | Yes |
| Pending My Approval | Yes | — | — | Yes |
| Pipeline Funnel | Yes | — | — | Yes |
| Team Utilization | Yes | — | — | Yes |
| Partner Vault | Yes | — | — | — |
| My Hours Today/Week | — | — | Yes | — |
| My Rejected Entries | — | — | Yes | — |
| My Cases | — | — | Yes | — |
| My Tasks | — | — | Yes | — |
| Total A Pagar | Yes | Yes | — | Yes |
| Bank Reconciliation | — | Yes | — | Yes |
| Cashflow Projection | Yes | Yes | — | Yes |
| Exception Queue | Yes | — | — | Yes |
| Stale Leads | Yes | — | — | Yes |

---

## 6. IMPLEMENTATION ORDER (12 Steps)

Each step builds on the previous. No step requires schema changes or new tables.

---

### Step 1: State Machine Guards

**What**: Create `src/lib/governance/machines.ts` with transition maps and `canTransition(entityType, from, to)` function for all 6 entities.

**Depends on**: Nothing (pure logic).

**Files created**:
- `src/lib/governance/machines.ts`

**Validation**: Unit tests — all valid transitions return `true`, all invalid return `false`.

---

### Step 2: Wire Guards into Existing Mutations

**What**: Call `canTransition()` inside every `updateXStatus()` action. Block invalid transitions.

**Depends on**: Step 1.

**Files modified**:
- `src/lib/actions/financeiro.ts` — `updatePayableStatus`
- `src/lib/actions/time-entries.ts` — `updateTimeEntryStatus`
- `src/lib/actions/leads.ts` — `updateLead` (status field)
- `src/lib/actions/cases.ts` — `updateCase` (status field)
- `src/lib/actions/proposals.ts` — `updateProposal` (status field)

**Validation**: Attempt invalid transition → get `{ success: false, error: "Transicao invalida: X → Y" }`.

---

### Step 3: Approval Persistence

**What**: Make `aprovacoes/page.tsx` call actual server actions instead of local state mutations. Create missing `updateReceivableStatus` action.

**Depends on**: Step 2 (guards prevent invalid transitions).

**Files modified**:
- `src/app/(dashboard)/aprovacoes/page.tsx` — wire handlers to actions
- `src/lib/actions/financeiro.ts` — add `updateReceivableStatus`
- `src/lib/actions/index.ts` — export new function

**Validation**: Approve a payable → refresh page → payable still shows approved.

---

### Step 4: Transaction Wrapping

**What**: Wrap all multi-step mutations in `db.transaction()`. Critical for: approval + audit log, pre-invoice creation + time entry linking, AR discount/writeoff + payment settlement.

**Depends on**: Step 3.

**Files modified**:
- `src/lib/approval/actions.ts` — `approveEntity`, `rejectEntity` with `db.transaction()`
- `src/lib/actions/financeiro.ts` — `updatePayableStatus`, `updateReceivableStatus`
- `src/lib/actions/time-entries.ts` — `updateTimeEntryStatus`

**Validation**: Force an error after first write in transaction → verify rollback (no partial state).

---

### Step 5: Concurrency Control (Optimistic Locking)

**What**: Add `expectedUpdatedAt` parameter to all update actions. Compare before writing. Return `CONFLICT` on mismatch.

**Depends on**: Step 4 (transactions ensure atomicity).

**Files modified**:
- All action files with update mutations
- All page files that call update actions (pass `updatedAt` from loaded data)

**Validation**: Open two tabs → edit same entity → second save returns CONFLICT.

---

### Step 6: Edit Blocking Rules

**What**: Enforce immutability rules — approved time entries cannot be edited, sent proposals cannot be modified, invoiced pre-invoices are frozen.

**Depends on**: Step 2 (guards exist).

**Files modified**:
- `src/lib/actions/time-entries.ts` — block edits on `aprovado`/`faturado`
- `src/lib/actions/proposals.ts` — block content edits on `sent`/`approved`
- `src/lib/actions/faturamento.ts` — block line item edits on `review`/`approved`/`invoiced`

**Validation**: Attempt to edit an approved time entry → `{ success: false, error: "Apontamento aprovado..." }`.

---

### Step 7: Idempotency Layer

**What**: Add pre-flight uniqueness checks to all creation actions. Implement period locking for billing.

**Depends on**: Step 5 (concurrency control prevents race conditions on the checks).

**Files created**:
- `src/lib/governance/idempotency.ts` — `isPeriodLocked()`, `entityExists()`

**Files modified**:
- `src/lib/actions/faturamento.ts` — add `closePeriod()` with idempotency
- `src/lib/actions/leads.ts` — `createLead` deduplication check
- `src/lib/actions/cases.ts` — `createCase` deduplication for `proposalId`

**Validation**: Call `closePeriod()` twice for same case+period → second call returns existing PI ID.

---

### Step 8: Rule Engine — Time Validation + Cap Thresholds

**What**: Implement time entry validation rules (daily max, case active check, billable rate check) and cap threshold detection for mixed billing.

**Depends on**: Step 7 (billing engine idempotency).

**Files created**:
- `src/lib/governance/rules/time-validation.ts`
- `src/lib/governance/rules/cap-threshold.ts`

**Files modified**:
- `src/lib/actions/time-entries.ts` — call validation before insert
- `src/lib/actions/time-entries.ts` — call cap check after approval

**Validation**: Submit 17h of entries in one day → blocked. Approve entry that hits 80% cap → warning logged.

---

### Step 9: Rule Engine — Overdue Detection + Stale Leads

**What**: Implement automatic status changes for overdue AR titles and stale lead detection.

**Depends on**: Step 2 (status change guards).

**Files created**:
- `src/lib/governance/rules/overdue-check.ts`
- `src/lib/governance/rules/follow-up.ts`
- `src/app/api/cron/daily/route.ts` — daily cron handler

**Files modified**:
- `src/lib/actions/financeiro.ts` — optionally trigger overdue check on load
- `src/lib/actions/leads.ts` — optionally trigger stale check on load

**Validation**: Seed an AR title with `dueDate = yesterday` → after cron runs, status is `overdue`.

---

### Step 10: Governance Dashboard Queries

**What**: Replace mock data in `dashboard.ts` with real aggregate queries. Implement role-based widget visibility.

**Depends on**: Steps 1-9 (real data must exist and be consistent).

**Files modified**:
- `src/lib/actions/dashboard.ts` — replace all 3 functions with real queries
- `src/app/(dashboard)/dashboard/page.tsx` — role-based widget rendering

**Validation**: Create a payable → Dashboard "Pending Approvals" count increases by 1.

---

### Step 11: Exception Queue Consumer

**What**: Write failures from all rule engine actions to `exceptionQueue`. Display queue in aprovacoes page. Add retry capability.

**Depends on**: Steps 8, 9 (rules generate exceptions).

**Files created**:
- `src/lib/governance/exception-handler.ts` — `writeException()`, `retryException()`

**Files modified**:
- `src/app/(dashboard)/aprovacoes/page.tsx` — add exception queue section
- All rule engine files — call `writeException()` on failure

**Validation**: Force a conversion failure → exception appears in queue → click retry → succeeds.

---

### Step 12: Audit Trail Integration

**What**: Call `logAudit()` in every mutation action. Display audit trail in entity detail pages.

**Depends on**: Step 4 (transactions wrap audit + mutation atomically).

**Files created**:
- `src/lib/governance/audit.ts` — `logAudit(userId, action, entityType, entityId, oldData?, newData?)`

**Files modified**:
- Every action file with mutations — add `logAudit()` call inside transaction
- Entity detail pages — show audit history section

**Validation**: Approve a payable → `auditLogs` table has row with `action: "approve"`, `entityType: "payable"`, `oldData: { approvalStatus: "pendente" }`, `newData: { approvalStatus: "aprovado" }`.

---

### Implementation Dependency Graph

```
Step 1: State Machine Guards ────────────────────────────────────┐
    │                                                            │
    ▼                                                            │
Step 2: Wire Guards into Mutations                               │
    │                                                            │
    ├──────────────────┐                                         │
    ▼                  ▼                                         │
Step 3: Approval     Step 6: Edit                                │
  Persistence        Blocking Rules                              │
    │                                                            │
    ▼                                                            │
Step 4: Transaction Wrapping ──────────────────────────────────► │
    │                                                            │
    ▼                                                            │
Step 5: Concurrency Control                                      │
    │                                                            │
    ▼                                                            │
Step 7: Idempotency Layer                                        │
    │                                                            │
    ├──────────────────┐                                         │
    ▼                  ▼                                         │
Step 8: Time +       Step 9: Overdue +                           │
  Cap Rules          Stale Rules                                 │
    │                  │                                         │
    └────────┬─────────┘                                         │
             ▼                                                   │
Step 10: Governance Dashboard ◄──────────────────────────────────┘
             │
             ▼
Step 11: Exception Queue Consumer
             │
             ▼
Step 12: Audit Trail Integration
```

### Effort Estimate

| Step | Effort | Cumulative |
|---|---|---|
| 1. State machine guards | 3h | 3h |
| 2. Wire guards into mutations | 3h | 6h |
| 3. Approval persistence | 4h | 10h |
| 4. Transaction wrapping | 3h | 13h |
| 5. Concurrency control | 4h | 17h |
| 6. Edit blocking rules | 2h | 19h |
| 7. Idempotency layer | 4h | 23h |
| 8. Time + cap rules | 4h | 27h |
| 9. Overdue + stale rules | 3h | 30h |
| 10. Governance dashboard | 6h | 36h |
| 11. Exception queue consumer | 3h | 39h |
| 12. Audit trail | 4h | 43h |
| **Total** | **43h** | |

### Exit Criteria (Governance Layer Complete)

- [ ] No state transition succeeds without passing `canTransition()` guard
- [ ] No approval is lost on page refresh (DB persistence confirmed)
- [ ] No two users can produce a conflicting write (optimistic locking active)
- [ ] No billing period generates duplicate pre-invoices (idempotency enforced)
- [ ] No approved/faturado entity can be edited (blocking rules active)
- [ ] No overdue AR title stays with `status = 'open'` past its due date
- [ ] No stale lead goes undetected past 7 days
- [ ] Every mutation writes an audit log entry
- [ ] Every rule engine failure writes to `exceptionQueue`
- [ ] CEO, Manager, and Executor dashboards show role-appropriate data from real queries

---

> **Document generated**: 2026-03-03
> **Consolidation of**: ARCHITECTURAL_ORCHESTRATION.md + STRESS_TEST_FAILURE_SIMULATION.md
> **Constraint**: Zero schema changes. Zero new tables. Logic-layer only.
> **Next action**: Execute Step 1 — create `src/lib/governance/machines.ts`
