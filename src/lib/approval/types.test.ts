import { describe, it, expect } from "vitest";
import {
    canUserApprove,
    APPROVAL_AUTHORITY,
    PAYABLE_TRANSITIONS,
    RECEIVABLE_TRANSITIONS,
    TIME_ENTRY_TRANSITIONS,
    APPROVAL_STATUS_LABELS,
    APPROVAL_STATUS_COLORS,
    type ApprovalEntityType,
    type UserRole,
} from "./types";

// --- canUserApprove ---

describe("canUserApprove", () => {
    const entityTypes: ApprovalEntityType[] = ["payable", "receivable", "time_entry"];
    const roles: UserRole[] = ["socio", "admin", "advogado", "financeiro"];

    it("socio pode aprovar todos os tipos", () => {
        for (const entity of entityTypes) {
            expect(canUserApprove(entity, "socio")).toBe(true);
        }
    });

    it("admin pode aprovar todos os tipos", () => {
        for (const entity of entityTypes) {
            expect(canUserApprove(entity, "admin")).toBe(true);
        }
    });

    it("advogado NAO pode aprovar nenhum tipo", () => {
        for (const entity of entityTypes) {
            expect(canUserApprove(entity, "advogado")).toBe(false);
        }
    });

    it("financeiro NAO pode aprovar nenhum tipo", () => {
        for (const entity of entityTypes) {
            expect(canUserApprove(entity, "financeiro")).toBe(false);
        }
    });

    it("authority matrix lista apenas socio e admin", () => {
        for (const entity of entityTypes) {
            expect(APPROVAL_AUTHORITY[entity]).toEqual(["socio", "admin"]);
        }
    });
});

// --- Transition Maps ---

describe("PAYABLE_TRANSITIONS", () => {
    it("pendente pode ir para aprovado ou rejeitado", () => {
        expect(PAYABLE_TRANSITIONS.pendente).toEqual(["aprovado", "rejeitado"]);
    });

    it("aprovado pode ir para agendado", () => {
        expect(PAYABLE_TRANSITIONS.aprovado).toEqual(["agendado"]);
    });

    it("rejeitado pode voltar para pendente (resubmit)", () => {
        expect(PAYABLE_TRANSITIONS.rejeitado).toEqual(["pendente"]);
    });

    it("agendado pode ir para pago", () => {
        expect(PAYABLE_TRANSITIONS.agendado).toEqual(["pago"]);
    });

    it("pago e estado terminal", () => {
        expect(PAYABLE_TRANSITIONS.pago).toEqual([]);
    });

    it("nao permite transicoes invalidas", () => {
        // pago nao pode voltar
        expect(PAYABLE_TRANSITIONS.pago).not.toContain("pendente");
        expect(PAYABLE_TRANSITIONS.pago).not.toContain("aprovado");
        // pendente nao pode pular para pago
        expect(PAYABLE_TRANSITIONS.pendente).not.toContain("pago");
        expect(PAYABLE_TRANSITIONS.pendente).not.toContain("agendado");
    });
});

describe("RECEIVABLE_TRANSITIONS", () => {
    it("pendente nao precisa de aprovacao (estado normal)", () => {
        expect(RECEIVABLE_TRANSITIONS.pendente).toEqual([]);
    });

    it("desconto_solicitado pode ser aprovado ou rejeitado", () => {
        expect(RECEIVABLE_TRANSITIONS.desconto_solicitado).toEqual(["aprovado", "rejeitado"]);
    });

    it("baixa_solicitada pode ser aprovada ou rejeitada", () => {
        expect(RECEIVABLE_TRANSITIONS.baixa_solicitada).toEqual(["aprovado", "rejeitado"]);
    });

    it("aprovado e rejeitado sao terminais", () => {
        expect(RECEIVABLE_TRANSITIONS.aprovado).toEqual([]);
        expect(RECEIVABLE_TRANSITIONS.rejeitado).toEqual([]);
    });
});

describe("TIME_ENTRY_TRANSITIONS", () => {
    it("rascunho pode ser submetido (pendente)", () => {
        expect(TIME_ENTRY_TRANSITIONS.rascunho).toEqual(["pendente"]);
    });

    it("pendente pode ser aprovado, rejeitado ou retratado (rascunho)", () => {
        expect(TIME_ENTRY_TRANSITIONS.pendente).toEqual(["aprovado", "rejeitado", "rascunho"]);
    });

    it("aprovado pode ser faturado ou reenviado para pendente", () => {
        expect(TIME_ENTRY_TRANSITIONS.aprovado).toEqual(["faturado", "pendente"]);
    });

    it("rejeitado pode voltar para rascunho", () => {
        expect(TIME_ENTRY_TRANSITIONS.rejeitado).toEqual(["rascunho"]);
    });

    it("faturado e terminal", () => {
        expect(TIME_ENTRY_TRANSITIONS.faturado).toEqual([]);
    });
});

// --- Labels & Colors ---

describe("APPROVAL_STATUS_LABELS", () => {
    const expectedStatuses = [
        "pendente", "aprovado", "rejeitado", "agendado", "pago",
        "desconto_solicitado", "baixa_solicitada", "faturado",
    ];

    it("tem label para todos os status", () => {
        for (const status of expectedStatuses) {
            expect(APPROVAL_STATUS_LABELS[status]).toBeDefined();
            expect(typeof APPROVAL_STATUS_LABELS[status]).toBe("string");
        }
    });
});

describe("APPROVAL_STATUS_COLORS", () => {
    const expectedStatuses = [
        "pendente", "aprovado", "rejeitado", "agendado", "pago",
        "desconto_solicitado", "baixa_solicitada", "faturado",
    ];

    it("tem cor para todos os status", () => {
        for (const status of expectedStatuses) {
            expect(APPROVAL_STATUS_COLORS[status]).toBeDefined();
            expect(APPROVAL_STATUS_COLORS[status]).toContain("bg-");
            expect(APPROVAL_STATUS_COLORS[status]).toContain("text-");
        }
    });
});
