import { describe, it, expect } from "vitest";
import {
    approvalActionSchema,
    batchApprovalSchema,
    createLeadSchema,
    createClientSchema,
    createCaseSchema,
    createTimeEntrySchema,
    createBillingPlanSchema,
} from "./index";

describe("approvalActionSchema", () => {
    it("aceita approve sem comment", () => {
        const result = approvalActionSchema.safeParse({
            entityType: "payable",
            entityId: "550e8400-e29b-41d4-a716-446655440000",
            action: "approve",
        });
        expect(result.success).toBe(true);
    });

    it("rejeita reject sem comment", () => {
        const result = approvalActionSchema.safeParse({
            entityType: "payable",
            entityId: "550e8400-e29b-41d4-a716-446655440000",
            action: "reject",
        });
        expect(result.success).toBe(false);
    });

    it("aceita reject com comment", () => {
        const result = approvalActionSchema.safeParse({
            entityType: "payable",
            entityId: "550e8400-e29b-41d4-a716-446655440000",
            action: "reject",
            comment: "Valor incorreto",
        });
        expect(result.success).toBe(true);
    });

    it("rejeita entityType invalido", () => {
        const result = approvalActionSchema.safeParse({
            entityType: "unknown",
            entityId: "550e8400-e29b-41d4-a716-446655440000",
            action: "approve",
        });
        expect(result.success).toBe(false);
    });

    it("rejeita entityId invalido (nao UUID)", () => {
        const result = approvalActionSchema.safeParse({
            entityType: "payable",
            entityId: "not-a-uuid",
            action: "approve",
        });
        expect(result.success).toBe(false);
    });
});

describe("batchApprovalSchema", () => {
    it("aceita batch approve com multiplos IDs", () => {
        const result = batchApprovalSchema.safeParse({
            entityType: "time_entry",
            entityIds: [
                "550e8400-e29b-41d4-a716-446655440000",
                "550e8400-e29b-41d4-a716-446655440001",
            ],
            action: "approve",
        });
        expect(result.success).toBe(true);
    });

    it("rejeita batch com array vazio", () => {
        const result = batchApprovalSchema.safeParse({
            entityType: "time_entry",
            entityIds: [],
            action: "approve",
        });
        expect(result.success).toBe(false);
    });

    it("rejeita batch reject sem comment", () => {
        const result = batchApprovalSchema.safeParse({
            entityType: "payable",
            entityIds: ["550e8400-e29b-41d4-a716-446655440000"],
            action: "reject",
        });
        expect(result.success).toBe(false);
    });
});

describe("createLeadSchema", () => {
    it("aceita lead valido minimo", () => {
        const result = createLeadSchema.safeParse({
            contactName: "Joao Silva",
        });
        expect(result.success).toBe(true);
    });

    it("rejeita lead sem contactName", () => {
        const result = createLeadSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it("rejeita email invalido", () => {
        const result = createLeadSchema.safeParse({
            contactName: "Joao",
            contactEmail: "not-an-email",
        });
        expect(result.success).toBe(false);
    });

    it("aceita email vazio (optional or empty)", () => {
        const result = createLeadSchema.safeParse({
            contactName: "Joao",
            contactEmail: "",
        });
        expect(result.success).toBe(true);
    });

    it("aplica defaults para temperature e probability", () => {
        const result = createLeadSchema.parse({ contactName: "Joao" });
        expect(result.temperature).toBe("morno");
        expect(result.probability).toBe(50);
        expect(result.status).toBe("novo");
    });
});

describe("createClientSchema", () => {
    it("aceita client com razao social", () => {
        const result = createClientSchema.safeParse({
            companyName: "PF Advogados S/A",
        });
        expect(result.success).toBe(true);
    });

    it("rejeita client sem razao social", () => {
        const result = createClientSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it("valida formato CNPJ", () => {
        const valid = createClientSchema.safeParse({
            companyName: "Test",
            cnpj: "12.345.678/0001-90",
        });
        expect(valid.success).toBe(true);

        const invalid = createClientSchema.safeParse({
            companyName: "Test",
            cnpj: "12345678000190",
        });
        expect(invalid.success).toBe(false);
    });
});

describe("createCaseSchema", () => {
    it("aceita caso com clientId e titulo", () => {
        const result = createCaseSchema.safeParse({
            clientId: "550e8400-e29b-41d4-a716-446655440000",
            title: "Caso Trabalhista XYZ",
        });
        expect(result.success).toBe(true);
    });

    it("rejeita caso sem titulo", () => {
        const result = createCaseSchema.safeParse({
            clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.success).toBe(false);
    });
});

describe("createTimeEntrySchema", () => {
    it("aceita time entry completo", () => {
        const result = createTimeEntrySchema.safeParse({
            caseId: "550e8400-e29b-41d4-a716-446655440000",
            activityType: "Audiencia",
            description: "Audiencia de instrucao",
            durationMinutes: 120,
            date: "2026-03-01",
        });
        expect(result.success).toBe(true);
    });

    it("rejeita duracao zero", () => {
        const result = createTimeEntrySchema.safeParse({
            caseId: "550e8400-e29b-41d4-a716-446655440000",
            activityType: "Audiencia",
            description: "Test",
            durationMinutes: 0,
            date: "2026-03-01",
        });
        expect(result.success).toBe(false);
    });
});

describe("createBillingPlanSchema", () => {
    it("aceita billing plan mensal fixo", () => {
        const result = createBillingPlanSchema.safeParse({
            caseId: "550e8400-e29b-41d4-a716-446655440000",
            clientId: "550e8400-e29b-41d4-a716-446655440001",
            type: "mensal_fixo",
            monthlyValue: "15000.00",
        });
        expect(result.success).toBe(true);
    });

    it("rejeita tipo invalido", () => {
        const result = createBillingPlanSchema.safeParse({
            caseId: "550e8400-e29b-41d4-a716-446655440000",
            clientId: "550e8400-e29b-41d4-a716-446655440001",
            type: "invalid_type",
        });
        expect(result.success).toBe(false);
    });
});
