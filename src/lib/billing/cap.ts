// =============================================================================
// PF Advogados ERP — Cap Enforcement Engine
// Calculates billing cap consumption, rollover, and threshold classification.
// =============================================================================

import { db } from "@/lib/db";
import { timeEntries, billingPlans } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CapThreshold = "ok" | "warning" | "soft_block" | "hard_block" | "uncapped";

export type CapStatus = {
    caseId: string;
    period: string;
    billingPlanId: string | null;
    capMinutes: number;
    baseCapMinutes: number;
    rolloverMinutes: number;
    usedMinutes: number;
    remainingMinutes: number;
    percentage: number;
    threshold: CapThreshold;
    isUncapped: boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function derivePeriod(dateStr: string): string {
    return dateStr.slice(0, 7); // "2026-03-15" → "2026-03"
}

export function derivePreviousPeriod(period: string): string {
    const [y, m] = period.split("-").map(Number);
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
}

function classifyThreshold(percentage: number): CapThreshold {
    if (percentage < 80) return "ok";
    if (percentage < 100) return "warning";
    if (percentage <= 110) return "soft_block";
    return "hard_block";
}

// ─── DB Queries ─────────────────────────────────────────────────────────────

async function getActiveBillingPlan(caseId: string) {
    const rows = await db
        .select()
        .from(billingPlans)
        .where(and(eq(billingPlans.caseId, caseId), eq(billingPlans.isActive, true)))
        .limit(1);
    return rows[0] ?? null;
}

async function getUsedMinutesForPeriod(caseId: string, period: string): Promise<number> {
    const periodStart = `${period}-01`;
    // Last day of month: go to next month, subtract 1 day
    const [y, m] = period.split("-").map(Number);
    const nextMonth = m === 12 ? 1 : m + 1;
    const nextYear = m === 12 ? y + 1 : y;
    const periodEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const result = await db
        .select({
            total: sql<number>`COALESCE(SUM(${timeEntries.durationMinutes}), 0)`,
        })
        .from(timeEntries)
        .where(
            and(
                eq(timeEntries.caseId, caseId),
                eq(timeEntries.isBillable, true),
                sql`${timeEntries.date} >= ${periodStart}`,
                sql`${timeEntries.date} < ${periodEnd}`,
                inArray(timeEntries.approvalStatus, ["pendente", "aprovado", "faturado"]),
            ),
        );

    return Number(result[0]?.total ?? 0);
}

// ─── Rollover ───────────────────────────────────────────────────────────────

async function computeRollover(
    caseId: string,
    currentPeriod: string,
    baseCapMinutes: number,
): Promise<number> {
    if (baseCapMinutes <= 0) return 0;

    const prevPeriod = derivePreviousPeriod(currentPeriod);
    const prevUsed = await getUsedMinutesForPeriod(caseId, prevPeriod);
    const unused = baseCapMinutes - prevUsed;

    // Only carry forward positive unused, capped at 50% of monthly cap
    return Math.max(0, Math.min(unused, baseCapMinutes * 0.5));
}

// ─── Main Functions ─────────────────────────────────────────────────────────

export async function getCapStatus(caseId: string, dateOrPeriod: string): Promise<CapStatus> {
    const period = dateOrPeriod.length > 7 ? derivePeriod(dateOrPeriod) : dateOrPeriod;

    const plan = await getActiveBillingPlan(caseId);

    // No plan or no cap → uncapped
    if (!plan || plan.monthlyHoursIncluded == null) {
        return {
            caseId,
            period,
            billingPlanId: plan?.id ?? null,
            capMinutes: 0,
            baseCapMinutes: 0,
            rolloverMinutes: 0,
            usedMinutes: 0,
            remainingMinutes: 0,
            percentage: 0,
            threshold: "uncapped",
            isUncapped: true,
        };
    }

    const baseCapMinutes = plan.monthlyHoursIncluded * 60;
    const rolloverMinutes = await computeRollover(caseId, period, baseCapMinutes);
    const capMinutes = baseCapMinutes + rolloverMinutes;
    const usedMinutes = await getUsedMinutesForPeriod(caseId, period);
    const remainingMinutes = capMinutes - usedMinutes;
    const percentage = capMinutes > 0 ? (usedMinutes / capMinutes) * 100 : 0;

    return {
        caseId,
        period,
        billingPlanId: plan.id,
        capMinutes,
        baseCapMinutes,
        rolloverMinutes,
        usedMinutes,
        remainingMinutes,
        percentage,
        threshold: classifyThreshold(percentage),
        isUncapped: false,
    };
}

export function simulateEntry(currentCap: CapStatus, additionalMinutes: number): CapStatus {
    if (currentCap.isUncapped) return currentCap;

    const projectedUsed = currentCap.usedMinutes + additionalMinutes;
    const remaining = currentCap.capMinutes - projectedUsed;
    const percentage = currentCap.capMinutes > 0 ? (projectedUsed / currentCap.capMinutes) * 100 : 0;

    return {
        ...currentCap,
        usedMinutes: projectedUsed,
        remainingMinutes: remaining,
        percentage,
        threshold: classifyThreshold(percentage),
    };
}
