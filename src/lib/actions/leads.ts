"use server";

import { MOCK_LEADS, type MockLead } from "@/lib/mock-data";

// TODO: Replace mock data with Drizzle DB queries when database is connected

export async function getLeads(filters?: {
    search?: string;
    temperature?: string[];
    stage?: string[];
}): Promise<MockLead[]> {
    let results = [...MOCK_LEADS];

    if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
            (l) =>
                l.contactName.toLowerCase().includes(q) ||
                (l.companyName ?? "").toLowerCase().includes(q),
        );
    }
    if (filters?.temperature?.length) {
        results = results.filter((l) => filters.temperature!.includes(l.temperature));
    }
    if (filters?.stage?.length) {
        results = results.filter((l) => filters.stage!.includes(l.stage));
    }

    return results;
}

export async function getLeadById(id: string): Promise<MockLead | null> {
    return MOCK_LEADS.find((l) => l.id === id) ?? null;
}
