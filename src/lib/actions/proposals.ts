"use server";

import { MOCK_PROPOSALS, type MockProposal } from "@/lib/mock-data";

// TODO: Replace mock data with Drizzle DB queries when database is connected

export async function getProposals(filters?: {
    search?: string;
    status?: string[];
}): Promise<MockProposal[]> {
    let results = [...MOCK_PROPOSALS];

    if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.client.toLowerCase().includes(q),
        );
    }
    if (filters?.status?.length) {
        results = results.filter((p) => filters.status!.includes(p.status));
    }

    return results;
}

export async function getProposalById(id: string): Promise<MockProposal | null> {
    return MOCK_PROPOSALS.find((p) => p.id === id) ?? null;
}
