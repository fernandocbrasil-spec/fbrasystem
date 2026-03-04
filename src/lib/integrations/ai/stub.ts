// =============================================================================
// AI Adapter — Stub
// Returns deterministic fake summaries for development/testing
// =============================================================================

import type { AIAdapter, MeetingSummaryInput, MeetingSummaryResult } from "./types";

export class StubAIAdapter implements AIAdapter {
    async summarizeMeeting(input: MeetingSummaryInput): Promise<MeetingSummaryResult> {
        // Simulate API latency
        await new Promise((resolve) => setTimeout(resolve, 800));

        const participantList = input.participants ?? ["Participante 1", "Participante 2"];

        return {
            summary: `Resumo da reuniao "${input.title}": Foram discutidos os principais pontos do caso, incluindo estrategia juridica, prazos processuais e proximos passos. Os participantes (${participantList.join(", ")}) alinharam as prioridades para as proximas semanas.`,
            keyPoints: [
                "Estrategia juridica definida para o proximo trimestre",
                "Prazos processuais revisados e atualizados",
                "Necessidade de documentacao adicional identificada",
                "Alinhamento sobre honorarios e custos operacionais",
            ],
            actionItems: [
                { description: "Preparar peticao inicial ate sexta-feira", assignee: participantList[0] },
                { description: "Revisar contratos anexos ao processo", assignee: participantList[1] ?? participantList[0] },
                { description: "Agendar reuniao de follow-up para proxima semana" },
            ],
            nextSteps: [
                "Follow-up em 7 dias para revisao de progresso",
                "Enviar documentacao complementar ao cliente",
                "Atualizar cronograma no sistema",
            ],
        };
    }
}
