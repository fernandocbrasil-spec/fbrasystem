import { describe, it, expect, beforeEach } from "vitest";
import { getGDriveAdapter, resetGDriveAdapter } from "./index";
import { StubGDriveAdapter } from "./stub";
import type { GDriveAdapter, GDriveFile, GDriveFolder } from "./types";

// ─── Factory ────────────────────────────────────────────────────────────────

describe("getGDriveAdapter — factory", () => {
    beforeEach(() => {
        resetGDriveAdapter();
        delete process.env.GDRIVE_ADAPTER;
    });

    it("returns StubGDriveAdapter when env var is not set", () => {
        const adapter = getGDriveAdapter();
        expect(adapter).toBeInstanceOf(StubGDriveAdapter);
    });

    it("returns StubGDriveAdapter when env var is 'stub'", () => {
        process.env.GDRIVE_ADAPTER = "stub";
        const adapter = getGDriveAdapter();
        expect(adapter).toBeInstanceOf(StubGDriveAdapter);
    });

    it("throws when env var is 'google' (not implemented)", () => {
        process.env.GDRIVE_ADAPTER = "google";
        expect(() => getGDriveAdapter()).toThrow("not implemented");
    });

    it("returns same cached instance on repeated calls", () => {
        const a = getGDriveAdapter();
        const b = getGDriveAdapter();
        expect(a).toBe(b);
    });

    it("returns new instance after resetGDriveAdapter", () => {
        const a = getGDriveAdapter();
        resetGDriveAdapter();
        const b = getGDriveAdapter();
        expect(a).not.toBe(b);
    });
});

// ─── Stub Adapter ───────────────────────────────────────────────────────────

describe("StubGDriveAdapter", () => {
    let adapter: GDriveAdapter;

    beforeEach(() => {
        adapter = new StubGDriveAdapter();
    });

    describe("createCaseFolder", () => {
        it("returns a folder with deterministic id based on caseId", async () => {
            const folder = await adapter.createCaseFolder("case-123", "Assessoria Contabil");
            expect(folder.id).toMatch(/^stub_/);
            expect(folder.name).toBe("Assessoria Contabil");
            expect(folder.webViewLink).toContain("drive.google.com");
            expect(folder.webViewLink).toContain(folder.id);
        });

        it("returns same id for same caseId", async () => {
            const a = await adapter.createCaseFolder("case-123", "Name A");
            const b = await adapter.createCaseFolder("case-123", "Name B");
            expect(a.id).toBe(b.id);
        });

        it("returns different id for different caseId", async () => {
            const a = await adapter.createCaseFolder("case-123", "A");
            const b = await adapter.createCaseFolder("case-456", "B");
            expect(a.id).not.toBe(b.id);
        });
    });

    describe("listCaseFiles", () => {
        it("returns a non-empty array of stub files", async () => {
            const files = await adapter.listCaseFiles("any-folder-id");
            expect(files.length).toBeGreaterThan(0);
        });

        it("each file has required fields", async () => {
            const files = await adapter.listCaseFiles("any-folder-id");
            for (const file of files) {
                expect(file.id).toBeTruthy();
                expect(file.name).toBeTruthy();
                expect(file.mimeType).toBeTruthy();
                expect(file.webViewLink).toContain("drive.google.com");
                expect(file.createdTime).toBeTruthy();
                expect(file.modifiedTime).toBeTruthy();
            }
        });
    });

    describe("uploadCaseFile", () => {
        it("returns a file with deterministic id", async () => {
            const file = await adapter.uploadCaseFile("folder-1", "test.pdf", Buffer.from("data"));
            expect(file.id).toMatch(/^stub_/);
            expect(file.name).toBe("test.pdf");
            expect(file.webViewLink).toContain("drive.google.com");
        });

        it("returns same id for same folder+filename", async () => {
            const a = await adapter.uploadCaseFile("folder-1", "test.pdf", Buffer.from("a"));
            const b = await adapter.uploadCaseFile("folder-1", "test.pdf", Buffer.from("b"));
            expect(a.id).toBe(b.id);
        });
    });

    describe("getShareLink", () => {
        it("returns a sharing URL containing the file id", async () => {
            const link = await adapter.getShareLink("stub_file_001");
            expect(link).toContain("stub_file_001");
            expect(link).toContain("sharing");
        });
    });
});
