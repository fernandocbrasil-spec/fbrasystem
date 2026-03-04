// =============================================================================
// NFSe Adapter — Stub (deterministic fake, no real provider)
// =============================================================================

import type {
    NFSeAdapter,
    NFSeEmitInput,
    NFSeEmitResult,
    NFSeConsultInput,
    NFSeConsultResult,
    NFSeCancelInput,
    NFSeCancelResult,
} from "./types";

/** Deterministic hash for reproducible fake values */
function fakeHash(seed: string): number {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

function fakeNFSeNumber(preInvoiceId: string): string {
    const num = fakeHash(`nfse_${preInvoiceId}`) % 9_000_000 + 1_000_000;
    return `SP${num}`;
}

function fakeVerificationCode(preInvoiceId: string): string {
    const code = fakeHash(`verify_${preInvoiceId}`).toString(36).toUpperCase().padStart(8, "0");
    return code.slice(0, 8);
}

function buildStubXml(input: NFSeEmitInput, nfseNumber: string): string {
    return [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<NFSe>`,
        `  <Numero>${nfseNumber}</Numero>`,
        `  <Prestador>PF Advogados Associados</Prestador>`,
        `  <Tomador>${input.clientName}</Tomador>`,
        `  <Servico>`,
        `    <Descricao>${input.description}</Descricao>`,
        `    <Valor>${input.value.toFixed(2)}</Valor>`,
        `    <ISS>${input.taxValue.toFixed(2)}</ISS>`,
        `  </Servico>`,
        `  <Status>Emitida</Status>`,
        `</NFSe>`,
    ].join("\n");
}

export class StubNFSeAdapter implements NFSeAdapter {
    async emit(input: NFSeEmitInput): Promise<NFSeEmitResult> {
        const nfseNumber = fakeNFSeNumber(input.preInvoiceId);
        const verificationCode = fakeVerificationCode(input.preInvoiceId);

        return {
            nfseNumber,
            verificationCode,
            xml: buildStubXml(input, nfseNumber),
            pdfUrl: `https://nfse.prefeitura.sp.gov.br/stub/${nfseNumber}/pdf`,
            providerResponse: {
                provider: "stub",
                timestamp: new Date().toISOString(),
                preInvoiceId: input.preInvoiceId,
                status: "emitida",
            },
        };
    }

    async consult(input: NFSeConsultInput): Promise<NFSeConsultResult> {
        return {
            status: "emitida",
            providerResponse: {
                provider: "stub",
                nfseNumber: input.nfseNumber,
                status: "emitida",
            },
        };
    }

    async cancel(input: NFSeCancelInput): Promise<NFSeCancelResult> {
        return {
            status: "cancelada",
            providerResponse: {
                provider: "stub",
                nfseNumber: input.nfseNumber,
                reason: input.reason,
                status: "cancelada",
            },
        };
    }
}
