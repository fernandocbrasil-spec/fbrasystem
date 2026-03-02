import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth module
vi.mock("@/auth", () => ({
    auth: vi.fn(),
}));

import { auth } from "@/auth";
import { getLeads, getLeadById } from "./leads";

const mockedAuth = vi.mocked(auth);

function mockSession(role = "socio") {
    mockedAuth.mockResolvedValue({
        user: { id: "user-1", name: "Test", email: "t@t.com", role, azureId: "az-1" },
        expires: "2099-01-01",
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

function mockNoSession() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedAuth.mockResolvedValue(null as any);
}

describe("getLeads", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("retorna array vazio sem sessao", async () => {
        mockNoSession();
        const result = await getLeads();
        expect(result).toEqual([]);
    });

    it("retorna leads com sessao autenticada", async () => {
        mockSession();
        const result = await getLeads();
        expect(result.length).toBeGreaterThan(0);
    });

    it("filtra por search string", async () => {
        mockSession();
        const all = await getLeads();
        const filtered = await getLeads({ search: all[0].contactName.slice(0, 5) });
        expect(filtered.length).toBeGreaterThan(0);
        expect(filtered.length).toBeLessThanOrEqual(all.length);
    });

    it("filtra por temperatura", async () => {
        mockSession();
        const result = await getLeads({ temperature: ["quente"] });
        for (const lead of result) {
            expect(lead.temperature).toBe("quente");
        }
    });

    it("filtra por estagio", async () => {
        mockSession();
        const result = await getLeads({ stage: ["novo"] });
        for (const lead of result) {
            expect(lead.stage).toBe("novo");
        }
    });

    it("retorna vazio para filtros invalidos (Zod rejection)", async () => {
        mockSession();
        // search > 200 chars
        const longSearch = "a".repeat(201);
        const result = await getLeads({ search: longSearch });
        expect(result).toEqual([]);
    });
});

describe("getLeadById", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("retorna null sem sessao", async () => {
        mockNoSession();
        const result = await getLeadById("1");
        expect(result).toBeNull();
    });

    it("retorna lead existente com sessao", async () => {
        mockSession();
        const leads = await getLeads();
        if (leads.length > 0) {
            const lead = await getLeadById(leads[0].id);
            expect(lead).toBeDefined();
            expect(lead?.id).toBe(leads[0].id);
        }
    });

    it("retorna null para id inexistente", async () => {
        mockSession();
        const result = await getLeadById("nonexistent-id-999");
        expect(result).toBeNull();
    });

    it("retorna null para id invalido (Zod rejection)", async () => {
        mockSession();
        const longId = "x".repeat(101);
        const result = await getLeadById(longId);
        expect(result).toBeNull();
    });
});
