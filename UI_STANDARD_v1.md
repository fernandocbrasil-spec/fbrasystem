# UI Standard v1 — PF Advogados ERP (Design Freeze)

> This document is the **frozen contract** for all UI/UX decisions.
> Any new page or component MUST follow these rules. Deviations require explicit approval.

---

## 1. Typography Scale

| Token | Tailwind Classes | Usage |
|-------|-----------------|-------|
| page-title | `text-xl font-bold tracking-tight text-pf-black` | Dashboard greeting, page main title |
| section-title | `text-xs font-bold text-pf-black` | Card titles, widget titles |
| section-label | `text-[10px] font-bold uppercase tracking-[0.12em] text-pf-grey/50` | KPI labels, column headers, group headers |
| body | `text-sm text-pf-black` | Default content, form inputs, table cells |
| body-secondary | `text-xs text-pf-black` | Table data cells, secondary content |
| caption | `text-[10px] text-pf-grey` | Helper text, timestamps |
| kpi-value | `font-sans text-xl font-bold text-pf-black leading-none tracking-tight` | KPI card main numbers |
| mono-value | `font-mono text-sm font-bold text-pf-black` | Monetary values in tables |
| micro | `text-[9px] font-bold uppercase tracking-wide` | Counters, trend tags |
| badge | `text-[10px] font-bold uppercase tracking-widest` | Status/priority badges |

### Font Rules
- **font-sans (Inter)**: ALL text, headings, labels, buttons, KPI values
- **font-mono (JetBrains Mono)**: Monetary values in tables/lists only
- **font-display (Zen Dots)**: Logo "PF" mark ONLY — never use elsewhere

---

## 2. Spacing Scale

| Context | Value | Notes |
|---------|-------|-------|
| Page wrapper | `max-w-[1400px] mx-auto space-y-6` | Every page, via `<PageShell>` |
| Major section gap | `space-y-6` | Between page sections |
| Widget card padding | `p-5` | Dashboard cards, detail sections |
| KPI card padding | `p-4` | Compact metric cards |
| Grid gap | `gap-4` | All grid layouts |
| Table row height | `py-2.5` | All table rows |
| Toolbar-to-content gap | `space-y-2` | Between toolbar and table |
| Button gap | `gap-2` | Between adjacent buttons |
| Icon-to-label gap | `gap-1.5` | Icon + text pairs |

---

## 3. Color Usage

| Token | Usage |
|-------|-------|
| `bg-background` (#F4F5F7) | Page background, sticky toolbar bg |
| `bg-white` | Cards, list row hover state |
| `bg-pf-blue` | Primary buttons, active nav items |
| `text-pf-black` | Primary text |
| `text-pf-grey` | Disabled text |
| `text-pf-grey/50` | Secondary labels, captions |
| `text-pf-blue` | Links, active states |
| `border-pf-grey/10` | Card borders, table row dividers |
| `border-pf-grey/20` | Input borders, toolbar button borders |

### Contrast Rules
- Primary text (`text-pf-black` #000) on white: 21:1 ratio
- Secondary text (`text-pf-grey/50`) on white: min 4.5:1
- Badge text must meet 4.5:1 against its background
- Focus rings: `focus:ring-1 focus:ring-pf-blue focus:border-pf-blue`

---

## 4. Card Rules

| Variant | Classes | Usage |
|---------|---------|-------|
| Widget | `bg-white rounded-xl border border-pf-grey/10 p-5` | Dashboard widgets, detail sections |
| KPI | `bg-white rounded-lg border border-pf-grey/10 p-4` | KPI strips |
| Alert | `bg-white rounded-lg border border-pf-grey/10 border-l-[3px] border-l-{color} p-4` | Follow-up alerts, warnings |
| List page | No card — flat rows on `bg-background` | Leads, time-tracking, faturamento |

**NO shadows on any cards.** Border-only design is cleaner and more Monday-like.

---

## 5. Table / Board Rules

| Element | Classes |
|---------|---------|
| Row border | `border-b border-pf-grey/10` |
| Row hover | `hover:bg-white transition-colors` |
| Header text | `text-[10px] font-bold uppercase tracking-widest text-pf-grey` |
| Cell text | `text-xs text-pf-black` or `text-sm text-pf-black` |
| Sticky toolbar bg | `bg-background` |
| Group header | `text-[10px] font-bold uppercase tracking-[0.12em]` + group color |

### Board (Monday-like) Rules
- Collapsible groups with `ChevronRight` rotate-90
- Inline add-item form per group
- Column visibility via toolbar
- Sort/group-by controls in toolbar

---

## 6. Button Hierarchy

| Level | Variant | Usage |
|-------|---------|-------|
| Primary | `variant="primary"` (bg-pf-blue) | Main page action (1 per page max) |
| Dark | `variant="dark"` (bg-pf-black) | Secondary prominent action |
| Secondary | `variant="secondary"` (border) | Toolbar buttons, filters |
| Ghost | `variant="ghost"` (no bg) | Inline actions, close buttons |
| Danger | `variant="danger"` (bg-red-600) | Destructive actions (delete, cancel) |

---

## 7. Badge System

Use `<StatusBadge>` for all status/lifecycle indicators. Use `<Badge>` for semantic categories.

### Status Badge Colors (centralized)
| Status | Background | Text |
|--------|-----------|------|
| Rascunho | `bg-gray-100` | `text-gray-600` |
| Pendente / Pendente Aprovacao | `bg-orange-100` | `text-orange-700` |
| Aprovado / Ativo | `bg-green-100` | `text-green-700` |
| Rejeitado | `bg-red-100` | `text-red-700` |
| Faturado | `bg-indigo-100` | `text-indigo-700` |
| Cancelado / Encerrado | `bg-gray-100` | `text-gray-400` |
| Em Pausa | `bg-amber-100` | `text-amber-700` |
| Alta (priority) | `bg-red-100` | `text-red-700` |
| Media (priority) | `bg-orange-100` | `text-orange-700` |
| Baixa (priority) | `bg-blue-100` | `text-blue-700` |

---

## 8. Standard States

| State | Component | Pattern |
|-------|-----------|---------|
| Page loading | `<KpiSkeleton>` + `<TableRowSkeleton>` | Pulse animation, matches card dims |
| Empty | `<EmptyState>` | Centered icon + title + message + optional action |
| Error (inline) | `<ErrorBanner>` | Dismissible red banner with optional retry |
| Error (page) | `error.tsx` boundary | "Algo deu errado" + retry button |

---

## 9. Do / Don't

| DO | DON'T |
|----|-------|
| Use `bg-background` for toolbar bg | Hardcode `bg-[#F4F5F7]` |
| Use `border-pf-grey/10` for table rows | Mix `/5`, `/15`, `/20` |
| Use `text-xl` for KPI values | Use `text-2xl` or `text-3xl` |
| Use `font-sans` for KPI values | Use `font-display` for anything except logo |
| Use `rounded-xl` for widget cards | Use `rounded-lg` for widget cards |
| Use `rounded-lg` for KPI/dense cards | Use `rounded-xl` for KPI cards |
| Use `p-5` for widget cards | Use p-2.5, p-3, or p-6 |
| Use `p-4` for KPI cards | Use p-2.5 or p-5 for KPI cards |
| Use `gap-4` for grids | Use gap-2 or gap-3 |
| Use `space-y-6` for page sections | Use space-y-2, space-y-4, space-y-5 |
| Use `hover:bg-white` for list rows | Use `hover:bg-background` |
| Use `<StatusBadge>` component | Define inline status color maps per page |
| Use `<PageShell>` wrapper | Write inline max-width + spacing per page |
| Use `<KpiCard>` component | Build inline KPI markup per page |
| Use `<Button>` component | Write inline `<button>` with manual styling |
| Use `<Modal>` for dialogs | Write inline overlay/modal markup |

---

## 10. Visual Consistency Checklist (PR Reviews)

Every PR touching UI must pass ALL of these:

- [ ] Page uses `<PageShell>` or equivalent `max-w-[1400px] mx-auto space-y-6`
- [ ] No `shadow-*` on cards — border-only (`border border-pf-grey/10`)
- [ ] KPI cards use `<KpiCard>` component, not inline markup
- [ ] KPI values: `text-xl font-bold font-sans` — never text-2xl/3xl
- [ ] Grid gaps: `gap-4` — never gap-2 or gap-3
- [ ] Table row borders: `border-pf-grey/10` — never /5, /15, /20
- [ ] Sticky toolbar bg: `bg-background` — never `bg-[#F4F5F7]`
- [ ] Status badges use `<StatusBadge>` — no inline color maps
- [ ] Card padding: `p-5` (widget) or `p-4` (KPI) — never p-2.5/p-3/p-6
- [ ] Section spacing: `space-y-6` — never space-y-2/4/5
- [ ] No `font-display` except logo PF mark
- [ ] List row hover: `hover:bg-white transition-colors`
- [ ] Labels follow: `text-[10px] font-bold uppercase tracking-[0.12em] text-pf-grey/50`
- [ ] Buttons use `<Button>` component variants — no manual styling
- [ ] Modals use `<Modal>` component — no inline overlays
