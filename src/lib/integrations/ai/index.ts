// =============================================================================
// AI Adapter — Factory
// Selects stub vs real adapter based on AI_ADAPTER env var
// =============================================================================

import type { AIAdapter } from "./types";
import { StubAIAdapter } from "./stub";

export type {
    AIAdapter,
    MeetingSummaryInput,
    MeetingSummaryResult,
} from "./types";

let _instance: AIAdapter | null = null;

export function getAIAdapter(): AIAdapter {
    if (_instance) return _instance;

    const adapter = process.env.AI_ADAPTER ?? "stub";

    switch (adapter) {
        case "real":
            throw new Error(
                "Real AI adapter not implemented yet. Set AI_ADAPTER=stub or remove the variable.",
            );
        case "stub":
        default:
            _instance = new StubAIAdapter();
            break;
    }

    return _instance;
}

/** Reset cached instance (for testing) */
export function resetAIAdapter(): void {
    _instance = null;
}
