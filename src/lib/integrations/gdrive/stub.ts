// =============================================================================
// Google Drive Adapter — Stub (deterministic fake, no real API)
// =============================================================================

import type { GDriveAdapter, GDriveFile, GDriveFolder } from "./types";

/** Deterministic hash for reproducible fake IDs */
function fakeId(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    return `stub_${Math.abs(h).toString(36).padStart(8, "0")}`;
}

const STUB_FILES: GDriveFile[] = [
    {
        id: "stub_file_001",
        name: "Contrato_Social.pdf",
        mimeType: "application/pdf",
        webViewLink: "https://drive.google.com/file/d/stub_file_001/view",
        createdTime: "2026-02-15T10:30:00Z",
        modifiedTime: "2026-02-15T10:30:00Z",
        size: 245_000,
    },
    {
        id: "stub_file_002",
        name: "Procuracao_Ad_Judicia.pdf",
        mimeType: "application/pdf",
        webViewLink: "https://drive.google.com/file/d/stub_file_002/view",
        createdTime: "2026-02-20T14:15:00Z",
        modifiedTime: "2026-02-20T14:15:00Z",
        size: 128_000,
    },
    {
        id: "stub_file_003",
        name: "Planilha_Custas.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        webViewLink: "https://drive.google.com/file/d/stub_file_003/view",
        createdTime: "2026-03-01T09:00:00Z",
        modifiedTime: "2026-03-02T16:45:00Z",
        size: 52_000,
    },
];

export class StubGDriveAdapter implements GDriveAdapter {
    async createCaseFolder(caseId: string, caseName: string): Promise<GDriveFolder> {
        const id = fakeId(`folder_${caseId}`);
        return {
            id,
            name: caseName,
            webViewLink: `https://drive.google.com/drive/folders/${id}`,
        };
    }

    async listCaseFiles(_folderId: string): Promise<GDriveFile[]> {
        return STUB_FILES;
    }

    async uploadCaseFile(folderId: string, fileName: string, _content: Buffer): Promise<GDriveFile> {
        const id = fakeId(`file_${folderId}_${fileName}`);
        const now = new Date().toISOString();
        return {
            id,
            name: fileName,
            mimeType: "application/octet-stream",
            webViewLink: `https://drive.google.com/file/d/${id}/view`,
            createdTime: now,
            modifiedTime: now,
        };
    }

    async getShareLink(fileId: string): Promise<string> {
        return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    }
}
