"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { MOCK_CASES, type MockCase } from "@/lib/mock-data";

const casesFilterSchema = z.object({
    search: z.string().max(200).optional(),
    area: z.array(z.string().max(50)).optional(),
    status: z.array(z.string().max(50)).optional(),
}).optional();

export async function getCases(filters?: z.input<typeof casesFilterSchema>): Promise<MockCase[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = casesFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    let results = [...MOCK_CASES];

    if (f?.search) {
        const q = f.search.toLowerCase();
        results = results.filter(
            (c) =>
                c.title.toLowerCase().includes(q) ||
                c.client.toLowerCase().includes(q),
        );
    }
    if (f?.area?.length) {
        results = results.filter((c) => f.area!.includes(c.area));
    }
    if (f?.status?.length) {
        results = results.filter((c) => f.status!.includes(c.status));
    }

    return results;
}

export async function getCaseById(id: string): Promise<MockCase | null> {
    const session = await auth();
    if (!session?.user) return null;

    const parsed = z.string().max(100).safeParse(id);
    if (!parsed.success) return null;

    return MOCK_CASES.find((c) => c.id === parsed.data) ?? null;
}
