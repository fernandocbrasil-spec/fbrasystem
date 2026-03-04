// =============================================================================
// Google Drive Adapter — Factory
// Selects stub vs real adapter based on GDRIVE_ADAPTER env var
// =============================================================================

import type { GDriveAdapter } from "./types";
import { StubGDriveAdapter } from "./stub";

export type { GDriveAdapter, GDriveFile, GDriveFolder } from "./types";

let _instance: GDriveAdapter | null = null;

export function getGDriveAdapter(): GDriveAdapter {
    if (_instance) return _instance;

    const adapter = process.env.GDRIVE_ADAPTER ?? "stub";

    switch (adapter) {
        case "google":
            throw new Error(
                "Real Google Drive adapter not implemented yet. Set GDRIVE_ADAPTER=stub or remove the variable.",
            );
        case "stub":
        default:
            _instance = new StubGDriveAdapter();
            break;
    }

    return _instance;
}

/** Reset cached instance (for testing) */
export function resetGDriveAdapter(): void {
    _instance = null;
}
