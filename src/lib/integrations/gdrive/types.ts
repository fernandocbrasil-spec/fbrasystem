// =============================================================================
// Google Drive Adapter — Interface
// =============================================================================

export interface GDriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    createdTime: string;
    modifiedTime: string;
    size?: number;
}

export interface GDriveFolder {
    id: string;
    name: string;
    webViewLink: string;
}

export interface GDriveAdapter {
    /** Create (or get existing) case folder in Drive */
    createCaseFolder(caseId: string, caseName: string): Promise<GDriveFolder>;

    /** List files inside a case folder */
    listCaseFiles(folderId: string): Promise<GDriveFile[]>;

    /** Upload a file to a case folder */
    uploadCaseFile(folderId: string, fileName: string, content: Buffer): Promise<GDriveFile>;

    /** Get a shareable link for a file */
    getShareLink(fileId: string): Promise<string>;
}
