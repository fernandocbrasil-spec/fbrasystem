// =============================================================================
// NFSe Adapter — Factory
// Selects stub vs real adapter based on NFSE_ADAPTER env var
// =============================================================================

import type { NFSeAdapter } from "./types";
import { StubNFSeAdapter } from "./stub";

export type {
    NFSeAdapter,
    NFSeEmitInput,
    NFSeEmitResult,
    NFSeConsultInput,
    NFSeConsultResult,
    NFSeCancelInput,
    NFSeCancelResult,
} from "./types";

let _instance: NFSeAdapter | null = null;

export function getNFSeAdapter(): NFSeAdapter {
    if (_instance) return _instance;

    const adapter = process.env.NFSE_ADAPTER ?? "stub";

    switch (adapter) {
        case "real":
            throw new Error(
                "Real NFSe adapter not implemented yet. Set NFSE_ADAPTER=stub or remove the variable.",
            );
        case "stub":
        default:
            _instance = new StubNFSeAdapter();
            break;
    }

    return _instance;
}

/** Reset cached instance (for testing) */
export function resetNFSeAdapter(): void {
    _instance = null;
}
