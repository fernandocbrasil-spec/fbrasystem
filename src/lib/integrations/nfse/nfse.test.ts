import { describe, it, expect, beforeEach } from "vitest";
import { getNFSeAdapter, resetNFSeAdapter } from "./index";
import { StubNFSeAdapter } from "./stub";
import type { NFSeAdapter, NFSeEmitInput } from "./types";

// ─── Factory ────────────────────────────────────────────────────────────────

describe("getNFSeAdapter — factory", () => {
    beforeEach(() => {
        resetNFSeAdapter();
        delete process.env.NFSE_ADAPTER;
    });

    it("returns StubNFSeAdapter when env var is not set", () => {
        const adapter = getNFSeAdapter();
        expect(adapter).toBeInstanceOf(StubNFSeAdapter);
    });

    it("returns StubNFSeAdapter when env var is 'stub'", () => {
        process.env.NFSE_ADAPTER = "stub";
        const adapter = getNFSeAdapter();
        expect(adapter).toBeInstanceOf(StubNFSeAdapter);
    });

    it("throws when env var is 'real' (not implemented)", () => {
        process.env.NFSE_ADAPTER = "real";
        expect(() => getNFSeAdapter()).toThrow("not implemented");
    });

    it("returns same cached instance on repeated calls", () => {
        const a = getNFSeAdapter();
        const b = getNFSeAdapter();
        expect(a).toBe(b);
    });

    it("returns new instance after resetNFSeAdapter", () => {
        const a = getNFSeAdapter();
        resetNFSeAdapter();
        const b = getNFSeAdapter();
        expect(a).not.toBe(b);
    });
});

// ─── Stub Adapter ───────────────────────────────────────────────────────────

describe("StubNFSeAdapter", () => {
    let adapter: NFSeAdapter;

    const sampleInput: NFSeEmitInput = {
        preInvoiceId: "550e8400-e29b-41d4-a716-446655440000",
        clientName: "Grupo Sequoia",
        clientCnpj: "12.345.678/0001-90",
        value: 13045.51,
        taxValue: 1895.31,
        description: "Servicos Advocaticios — CA-2026-001",
    };

    beforeEach(() => {
        adapter = new StubNFSeAdapter();
    });

    describe("emit", () => {
        it("returns nfseNumber starting with SP", async () => {
            const result = await adapter.emit(sampleInput);
            expect(result.nfseNumber).toMatch(/^SP\d+$/);
        });

        it("returns verificationCode of 8 chars", async () => {
            const result = await adapter.emit(sampleInput);
            expect(result.verificationCode).toHaveLength(8);
        });

        it("returns xml containing NFSe tags", async () => {
            const result = await adapter.emit(sampleInput);
            expect(result.xml).toContain("<NFSe>");
            expect(result.xml).toContain("</NFSe>");
            expect(result.xml).toContain(result.nfseNumber);
        });

        it("returns pdfUrl with nfseNumber", async () => {
            const result = await adapter.emit(sampleInput);
            expect(result.pdfUrl).toContain(result.nfseNumber);
            expect(result.pdfUrl).toContain("nfse.prefeitura");
        });

        it("returns providerResponse with stub metadata", async () => {
            const result = await adapter.emit(sampleInput);
            expect(result.providerResponse.provider).toBe("stub");
            expect(result.providerResponse.status).toBe("emitida");
        });

        it("is deterministic — same input produces same nfseNumber", async () => {
            const a = await adapter.emit(sampleInput);
            const b = await adapter.emit(sampleInput);
            expect(a.nfseNumber).toBe(b.nfseNumber);
            expect(a.verificationCode).toBe(b.verificationCode);
        });

        it("different preInvoiceId produces different nfseNumber", async () => {
            const a = await adapter.emit(sampleInput);
            const b = await adapter.emit({ ...sampleInput, preInvoiceId: "different-id" });
            expect(a.nfseNumber).not.toBe(b.nfseNumber);
        });
    });

    describe("consult", () => {
        it("returns status emitida", async () => {
            const result = await adapter.consult({ nfseNumber: "SP1234567" });
            expect(result.status).toBe("emitida");
            expect(result.providerResponse.provider).toBe("stub");
        });
    });

    describe("cancel", () => {
        it("returns status cancelada", async () => {
            const result = await adapter.cancel({
                nfseNumber: "SP1234567",
                reason: "Emissao incorreta",
            });
            expect(result.status).toBe("cancelada");
            expect(result.providerResponse.reason).toBe("Emissao incorreta");
        });
    });
});
