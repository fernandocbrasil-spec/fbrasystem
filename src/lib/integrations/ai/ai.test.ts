import { describe, it, expect, beforeEach } from "vitest";
import { getAIAdapter, resetAIAdapter } from "./index";
import { StubAIAdapter } from "./stub";

describe("AI Adapter Factory", () => {
    beforeEach(() => {
        resetAIAdapter();
        delete process.env.AI_ADAPTER;
    });

    it("returns StubAIAdapter by default", () => {
        const adapter = getAIAdapter();
        expect(adapter).toBeInstanceOf(StubAIAdapter);
    });

    it("returns StubAIAdapter when AI_ADAPTER=stub", () => {
        process.env.AI_ADAPTER = "stub";
        const adapter = getAIAdapter();
        expect(adapter).toBeInstanceOf(StubAIAdapter);
    });

    it("throws for AI_ADAPTER=real", () => {
        process.env.AI_ADAPTER = "real";
        expect(() => getAIAdapter()).toThrow("Real AI adapter not implemented");
    });

    it("caches the singleton instance", () => {
        const a = getAIAdapter();
        const b = getAIAdapter();
        expect(a).toBe(b);
    });

    it("resetAIAdapter clears the cache", () => {
        const a = getAIAdapter();
        resetAIAdapter();
        const b = getAIAdapter();
        expect(a).not.toBe(b);
    });
});

describe("StubAIAdapter", () => {
    const stub = new StubAIAdapter();

    it("returns a summary string", async () => {
        const result = await stub.summarizeMeeting({
            meetingId: "test-123",
            title: "Reuniao Estrategia",
            transcript: "Discutimos o caso...",
        });
        expect(result.summary).toContain("Reuniao Estrategia");
        expect(typeof result.summary).toBe("string");
        expect(result.summary.length).toBeGreaterThan(20);
    });

    it("returns key points array", async () => {
        const result = await stub.summarizeMeeting({
            meetingId: "test-123",
            title: "Test",
            transcript: "Transcript...",
        });
        expect(Array.isArray(result.keyPoints)).toBe(true);
        expect(result.keyPoints.length).toBeGreaterThan(0);
    });

    it("returns action items with descriptions", async () => {
        const result = await stub.summarizeMeeting({
            meetingId: "test-123",
            title: "Test",
            transcript: "Transcript...",
        });
        expect(Array.isArray(result.actionItems)).toBe(true);
        expect(result.actionItems.length).toBeGreaterThan(0);
        for (const ai of result.actionItems) {
            expect(ai.description).toBeTruthy();
        }
    });

    it("returns next steps array", async () => {
        const result = await stub.summarizeMeeting({
            meetingId: "test-123",
            title: "Test",
            transcript: "Transcript...",
        });
        expect(Array.isArray(result.nextSteps)).toBe(true);
        expect(result.nextSteps.length).toBeGreaterThan(0);
    });

    it("includes participants in summary when provided", async () => {
        const result = await stub.summarizeMeeting({
            meetingId: "test-123",
            title: "Test",
            transcript: "Transcript...",
            participants: ["Fernando", "Jose"],
        });
        expect(result.summary).toContain("Fernando");
        expect(result.summary).toContain("Jose");
    });

    it("assigns action items to provided participants", async () => {
        const result = await stub.summarizeMeeting({
            meetingId: "test-123",
            title: "Test",
            transcript: "Transcript...",
            participants: ["Fernando", "Jose"],
        });
        const assignees = result.actionItems.filter((ai) => ai.assignee).map((ai) => ai.assignee);
        expect(assignees).toContain("Fernando");
    });

    it("returns default participants when none provided", async () => {
        const result = await stub.summarizeMeeting({
            meetingId: "test-123",
            title: "Test",
            transcript: "Transcript...",
        });
        expect(result.summary).toContain("Participante 1");
    });
});
