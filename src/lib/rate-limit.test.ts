import { describe, it, expect } from "vitest";
import { rateLimit, rateLimitLogin, rateLimitApproval, rateLimitMutation } from "./rate-limit";

describe("rateLimit", () => {
    it("permite ate o limite de requests", () => {
        const key = "test-allow-" + Date.now();
        const config = { limit: 3, windowSeconds: 60 };

        const r1 = rateLimit(key, config);
        expect(r1.success).toBe(true);
        expect(r1.remaining).toBe(2);

        const r2 = rateLimit(key, config);
        expect(r2.success).toBe(true);
        expect(r2.remaining).toBe(1);

        const r3 = rateLimit(key, config);
        expect(r3.success).toBe(true);
        expect(r3.remaining).toBe(0);
    });

    it("bloqueia apos exceder o limite", () => {
        const key = "test-block-" + Date.now();
        const config = { limit: 2, windowSeconds: 60 };

        rateLimit(key, config);
        rateLimit(key, config);

        const r3 = rateLimit(key, config);
        expect(r3.success).toBe(false);
        expect(r3.remaining).toBe(0);
    });

    it("reseta apos a janela expirar", () => {
        const key = "test-reset-" + Date.now();
        // Janela de 0 segundos = expira imediatamente
        const config = { limit: 1, windowSeconds: 0 };

        const r1 = rateLimit(key, config);
        expect(r1.success).toBe(true);

        // Segunda chamada: janela ja expirou (0s), deve resetar
        const r2 = rateLimit(key, config);
        expect(r2.success).toBe(true);
    });

    it("keys diferentes sao independentes", () => {
        const config = { limit: 1, windowSeconds: 60 };

        const r1 = rateLimit("key-a-" + Date.now(), config);
        const r2 = rateLimit("key-b-" + Date.now(), config);

        expect(r1.success).toBe(true);
        expect(r2.success).toBe(true);
    });
});

describe("pre-configured limiters", () => {
    it("rateLimitLogin permite 5 tentativas", () => {
        const ip = "127.0.0.test-" + Date.now();
        for (let i = 0; i < 5; i++) {
            expect(rateLimitLogin(ip).success).toBe(true);
        }
        expect(rateLimitLogin(ip).success).toBe(false);
    });

    it("rateLimitApproval permite 30 por minuto", () => {
        const userId = "user-approval-" + Date.now();
        for (let i = 0; i < 30; i++) {
            expect(rateLimitApproval(userId).success).toBe(true);
        }
        expect(rateLimitApproval(userId).success).toBe(false);
    });

    it("rateLimitMutation permite 60 por minuto", () => {
        const userId = "user-mutation-" + Date.now();
        for (let i = 0; i < 60; i++) {
            expect(rateLimitMutation(userId).success).toBe(true);
        }
        expect(rateLimitMutation(userId).success).toBe(false);
    });
});
