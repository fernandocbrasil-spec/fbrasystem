// =============================================================================
// NFSe Adapter — Interface
// =============================================================================

export interface NFSeEmitInput {
    preInvoiceId: string;
    clientName: string;
    clientCnpj?: string;
    value: number;
    taxValue: number;
    description: string;
    serviceCode?: string;
}

export interface NFSeEmitResult {
    nfseNumber: string;
    verificationCode: string;
    xml: string;
    pdfUrl: string;
    providerResponse: Record<string, unknown>;
}

export interface NFSeConsultInput {
    nfseNumber: string;
    verificationCode?: string;
}

export interface NFSeConsultResult {
    status: string;
    providerResponse: Record<string, unknown>;
}

export interface NFSeCancelInput {
    nfseNumber: string;
    verificationCode?: string;
    reason: string;
}

export interface NFSeCancelResult {
    status: string;
    providerResponse: Record<string, unknown>;
}

export interface NFSeAdapter {
    /** Emit an NFSe from an approved pre-invoice */
    emit(input: NFSeEmitInput): Promise<NFSeEmitResult>;

    /** Consult the status of an emitted NFSe */
    consult(input: NFSeConsultInput): Promise<NFSeConsultResult>;

    /** Cancel a previously emitted NFSe */
    cancel(input: NFSeCancelInput): Promise<NFSeCancelResult>;
}
