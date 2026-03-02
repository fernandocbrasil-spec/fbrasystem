"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { MOCK_RECEIVABLES, MOCK_PAYABLES, type MockReceivable, type MockPayable } from "@/lib/mock-data";

const receivablesFilterSchema = z.object({
    search: z.string().max(200).optional(),
    status: z.array(z.string().max(50)).optional(),
}).optional();

const payablesFilterSchema = z.object({
    search: z.string().max(200).optional(),
    categoria: z.array(z.string().max(50)).optional(),
}).optional();

export async function getReceivables(filters?: z.input<typeof receivablesFilterSchema>): Promise<MockReceivable[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = receivablesFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    let results = [...MOCK_RECEIVABLES];

    if (f?.search) {
        const q = f.search.toLowerCase();
        results = results.filter(
            (r) =>
                r.cliente.toLowerCase().includes(q) ||
                r.descricao.toLowerCase().includes(q),
        );
    }
    if (f?.status?.length) {
        results = results.filter((r) => f.status!.includes(r.status));
    }

    return results;
}

export async function getPayables(filters?: z.input<typeof payablesFilterSchema>): Promise<MockPayable[]> {
    const session = await auth();
    if (!session?.user) return [];

    const parsed = payablesFilterSchema.safeParse(filters);
    if (!parsed.success) return [];
    const f = parsed.data;

    let results = [...MOCK_PAYABLES];

    if (f?.search) {
        const q = f.search.toLowerCase();
        results = results.filter((d) => d.fornecedor.toLowerCase().includes(q));
    }
    if (f?.categoria?.length) {
        results = results.filter((d) => f.categoria!.includes(d.categoria));
    }

    return results;
}
