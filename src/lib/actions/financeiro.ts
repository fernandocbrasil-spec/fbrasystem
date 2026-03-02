"use server";

import { MOCK_RECEIVABLES, MOCK_PAYABLES, type MockReceivable, type MockPayable } from "@/lib/mock-data";

// TODO: Replace mock data with Drizzle DB queries when database is connected

export async function getReceivables(filters?: {
    search?: string;
    status?: string[];
}): Promise<MockReceivable[]> {
    let results = [...MOCK_RECEIVABLES];

    if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
            (r) =>
                r.cliente.toLowerCase().includes(q) ||
                r.descricao.toLowerCase().includes(q),
        );
    }
    if (filters?.status?.length) {
        results = results.filter((r) => filters.status!.includes(r.status));
    }

    return results;
}

export async function getPayables(filters?: {
    search?: string;
    categoria?: string[];
}): Promise<MockPayable[]> {
    let results = [...MOCK_PAYABLES];

    if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter((d) => d.fornecedor.toLowerCase().includes(q));
    }
    if (filters?.categoria?.length) {
        results = results.filter((d) => filters.categoria!.includes(d.categoria));
    }

    return results;
}
