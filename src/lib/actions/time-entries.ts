"use server";

import { MOCK_TIME_ENTRIES, type MockTimeEntry } from "@/lib/mock-data";

// TODO: Replace mock data with Drizzle DB queries when database is connected

export async function getTimeEntries(filters?: {
    search?: string;
    activityType?: string[];
    date?: string;
}): Promise<MockTimeEntry[]> {
    let results = [...MOCK_TIME_ENTRIES];

    if (filters?.date) {
        results = results.filter((e) => e.date === filters.date);
    }
    if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
            (e) =>
                e.description.toLowerCase().includes(q) ||
                e.clientName.toLowerCase().includes(q),
        );
    }
    if (filters?.activityType?.length) {
        results = results.filter((e) => filters.activityType!.includes(e.activityType));
    }

    return results;
}
