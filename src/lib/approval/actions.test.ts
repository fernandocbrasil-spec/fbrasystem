import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth module
vi.mock("@/auth", () => ({
    auth: vi.fn(),
}));

// Mock DB module — approval actions now persist to DB
vi.mock("@/lib/db", () => ({
    db: {
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve()),
            })),
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => Promise.resolve()),
        })),
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([{ count: 0 }])),
            })),
        })),
    },
}));

import { auth } from "@/auth";
import { approveEntity, rejectEntity, batchApproveEntities, getPendingApprovalCounts } from "./actions";

const mockedAuth = vi.mocked(auth);

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const VALID_UUID_3 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

function mockSession(role = "socio", userId = `user-${Date.now()}-${Math.random()}`) {
    mockedAuth.mockResolvedValue({
        user: { id: userId, name: "Test", email: "t@t.com", role, azureId: "az-1" },
        expires: "2099-01-01",
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

function mockNoSession() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedAuth.mockResolvedValue(null as any);
}

describe("approveEntity", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejeita sem sessao", async () => {
        mockNoSession();
        const result = await approveEntity({ entityType: "payable", entityId: VALID_UUID });
        expect(result.success).toBe(false);
        expect(result.error).toContain("autenticado");
    });

    it("aprova com role socio", async () => {
        mockSession("socio");
        const result = await approveEntity({ entityType: "payable", entityId: VALID_UUID });
        expect(result.success).toBe(true);
    });

    it("aprova com role admin", async () => {
        mockSession("admin");
        const result = await approveEntity({ entityType: "receivable", entityId: VALID_UUID_2 });
        expect(result.success).toBe(true);
    });

    it("rejeita role advogado para payable", async () => {
        mockSession("advogado");
        const result = await approveEntity({ entityType: "payable", entityId: VALID_UUID });
        expect(result.success).toBe(false);
        expect(result.error).toContain("Permissao");
    });

    it("rejeita role financeiro para time_entry", async () => {
        mockSession("financeiro");
        const result = await approveEntity({ entityType: "time_entry", entityId: VALID_UUID });
        expect(result.success).toBe(false);
        expect(result.error).toContain("Permissao");
    });

    it("rejeita entityId invalido (vazio)", async () => {
        mockSession("socio");
        const result = await approveEntity({ entityType: "payable", entityId: "" });
        expect(result.success).toBe(false);
    });

    it("rejeita entityId nao-UUID", async () => {
        mockSession("socio");
        const result = await approveEntity({ entityType: "payable", entityId: "not-a-uuid" });
        expect(result.success).toBe(false);
        expect(result.error).toContain("ID da entidade");
    });

    it("rejeita entityType invalido", async () => {
        mockSession("socio");
        // @ts-expect-error — testing invalid input
        const result = await approveEntity({ entityType: "invalid_type", entityId: VALID_UUID });
        expect(result.success).toBe(false);
    });
});

describe("rejectEntity", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejeita sem sessao", async () => {
        mockNoSession();
        const result = await rejectEntity({ entityType: "payable", entityId: VALID_UUID, comment: "Motivo" });
        expect(result.success).toBe(false);
        expect(result.error).toContain("autenticado");
    });

    it("rejeita entidade com sucesso (socio)", async () => {
        mockSession("socio");
        const result = await rejectEntity({ entityType: "payable", entityId: VALID_UUID, comment: "Valor incorreto" });
        expect(result.success).toBe(true);
    });

    it("rejeita role advogado", async () => {
        mockSession("advogado");
        const result = await rejectEntity({ entityType: "payable", entityId: VALID_UUID, comment: "Motivo" });
        expect(result.success).toBe(false);
        expect(result.error).toContain("Permissao");
    });

    it("rejeita comment vazio (refine validation)", async () => {
        mockSession("socio");
        const result = await rejectEntity({ entityType: "payable", entityId: VALID_UUID, comment: "" });
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});

describe("batchApproveEntities", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejeita sem sessao", async () => {
        mockNoSession();
        const result = await batchApproveEntities({ entityType: "payable", entityIds: [VALID_UUID, VALID_UUID_2] });
        expect(result.success).toBe(false);
    });

    it("aprova batch com role socio", async () => {
        mockSession("socio");
        const result = await batchApproveEntities({ entityType: "payable", entityIds: [VALID_UUID, VALID_UUID_2, VALID_UUID_3] });
        expect(result.success).toBe(true);
    });

    it("rejeita batch com role advogado", async () => {
        mockSession("advogado");
        const result = await batchApproveEntities({ entityType: "receivable", entityIds: [VALID_UUID] });
        expect(result.success).toBe(false);
    });

    it("rejeita entityIds vazio", async () => {
        mockSession("socio");
        const result = await batchApproveEntities({ entityType: "payable", entityIds: [] });
        expect(result.success).toBe(false);
    });

    it("rejeita entityIds nao-UUID", async () => {
        mockSession("socio");
        const result = await batchApproveEntities({ entityType: "payable", entityIds: ["not-uuid"] });
        expect(result.success).toBe(false);
    });
});

describe("getPendingApprovalCounts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("retorna zeros sem sessao", async () => {
        mockNoSession();
        const counts = await getPendingApprovalCounts();
        expect(counts.payable).toBe(0);
        expect(counts.receivable).toBe(0);
        expect(counts.time_entry).toBe(0);
    });

    it("retorna contagens com sessao", async () => {
        mockSession("socio");
        const counts = await getPendingApprovalCounts();
        expect(counts.payable).toBeGreaterThanOrEqual(0);
        expect(counts.receivable).toBeGreaterThanOrEqual(0);
        expect(counts.time_entry).toBeGreaterThanOrEqual(0);
    });
});
