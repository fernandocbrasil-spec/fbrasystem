"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { MOCK_LEADS, type MockLead } from "@/lib/mock-data";

const leadsFilterSchema = z.object({
    search: z.string().max(200).optional(),
    temperature: z.array(z.string().max(50)).optional(),
    stage: z.array(z.string().max(50)).optional(),
}).optional();

export async function getLeads(filters?: z.input<typeof leadsFilterSchema>): Promise<MockLead[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = leadsFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    let results = [...MOCK_LEADS];

    if (f?.search) {
        const q = f.search.toLowerCase();
        results = results.filter(
            (l) =>
                l.contactName.toLowerCase().includes(q) ||
                (l.companyName ?? "").toLowerCase().includes(q),
        );
    }
    if (f?.temperature?.length) {
        results = results.filter((l) => f.temperature!.includes(l.temperature));
    }
    if (f?.stage?.length) {
        results = results.filter((l) => f.stage!.includes(l.stage));
    }

    return results;
}

export async function getLeadById(id: string): Promise<MockLead | null> {
    const session = await auth();
    if (!session?.user) return null;

    const parsed = z.string().max(100).safeParse(id);
    if (!parsed.success) return null;

    return MOCK_LEADS.find((l) => l.id === parsed.data) ?? null;
}
