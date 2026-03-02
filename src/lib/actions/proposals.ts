"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { MOCK_PROPOSALS, type MockProposal } from "@/lib/mock-data";

const proposalsFilterSchema = z.object({
    search: z.string().max(200).optional(),
    status: z.array(z.string().max(50)).optional(),
}).optional();

export async function getProposals(filters?: z.input<typeof proposalsFilterSchema>): Promise<MockProposal[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = proposalsFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    let results = [...MOCK_PROPOSALS];

    if (f?.search) {
        const q = f.search.toLowerCase();
        results = results.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.client.toLowerCase().includes(q),
        );
    }
    if (f?.status?.length) {
        results = results.filter((p) => f.status!.includes(p.status));
    }

    return results;
}

export async function getProposalById(id: string): Promise<MockProposal | null> {
    const session = await auth();
    if (!session?.user) return null;

    const parsed = z.string().max(100).safeParse(id);
    if (!parsed.success) return null;

    return MOCK_PROPOSALS.find((p) => p.id === parsed.data) ?? null;
}
