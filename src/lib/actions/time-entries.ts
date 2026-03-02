"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { MOCK_TIME_ENTRIES, type MockTimeEntry } from "@/lib/mock-data";

const timeEntriesFilterSchema = z.object({
    search: z.string().max(200).optional(),
    activityType: z.array(z.string().max(50)).optional(),
    date: z.string().max(20).optional(),
}).optional();

export async function getTimeEntries(filters?: z.input<typeof timeEntriesFilterSchema>): Promise<MockTimeEntry[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = timeEntriesFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    let results = [...MOCK_TIME_ENTRIES];

    if (f?.date) {
        results = results.filter((e) => e.date === f.date);
    }
    if (f?.search) {
        const q = f.search.toLowerCase();
        results = results.filter(
            (e) =>
                e.description.toLowerCase().includes(q) ||
                e.clientName.toLowerCase().includes(q),
        );
    }
    if (f?.activityType?.length) {
        results = results.filter((e) => f.activityType!.includes(e.activityType));
    }

    return results;
}
