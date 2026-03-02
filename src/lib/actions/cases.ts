"use server";

import { MOCK_CASES, type MockCase } from "@/lib/mock-data";

// TODO: Replace mock data with Drizzle DB queries when database is connected

export async function getCases(filters?: {
    search?: string;
    area?: string[];
    status?: string[];
}): Promise<MockCase[]> {
    let results = [...MOCK_CASES];

    if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
            (c) =>
                c.title.toLowerCase().includes(q) ||
                c.client.toLowerCase().includes(q),
        );
    }
    if (filters?.area?.length) {
        results = results.filter((c) => filters.area!.includes(c.area));
    }
    if (filters?.status?.length) {
        results = results.filter((c) => filters.status!.includes(c.status));
    }

    return results;
}

export async function getCaseById(id: string): Promise<MockCase | null> {
    return MOCK_CASES.find((c) => c.id === id) ?? null;
}
