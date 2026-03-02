"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { Calculator, Shield, MapPin, Upload } from "lucide-react";

const inputClass =
    "w-full border border-pf-grey/20 bg-pf-grey/5 p-3 text-sm font-sans text-pf-black outline-none focus:border-pf-blue focus:ring-1 focus:ring-pf-blue transition-all rounded";

const LS_KEY = "pf-fiscal-params";

type FiscalParams = {
    codServico: string;
    aliquota: string;
    municipio: string;
};

const DEFAULTS: FiscalParams = {
    codServico: "017.014 - Advocacia",
    aliquota: "14.53",
    municipio: "Sao Paulo - SP",
};

function loadParams(): FiscalParams {
    if (typeof window === "undefined") return DEFAULTS;
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { ...DEFAULTS, ...parsed };
        }
    } catch {
        // ignore
    }
    return DEFAULTS;
}

export default function ParametrosFiscaisPage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [params, setParams] = useState<FiscalParams>(DEFAULTS);
    const [certFileName, setCertFileName] = useState<string | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        setParams(loadParams());
    }, []);

    const handleSave = () => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(params));
            toast("Parametros fiscais salvos com sucesso.");
        } catch {
            toast("Erro ao salvar parametros.", "error");
        }
    };

    const handleDiscard = () => {
        const loaded = loadParams();
        // If nothing saved, use defaults
        const savedRaw = localStorage.getItem(LS_KEY);
        if (savedRaw) {
            setParams(loaded);
            toast("Alteracoes descartadas. Valores restaurados.", "info");
        } else {
            setParams(DEFAULTS);
            toast("Valores restaurados para o padrao.", "info");
        }
    };

    const handleRenovarUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCertFileName(file.name);
            toast(`Certificado "${file.name}" carregado com sucesso.`);
        }
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-pf-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-pf-blue">Fiscal</span>
                </div>
                <PageHeader
                    title="Parametros Fiscais"
                    subtitle="Certificado digital, aliquotas e configuracoes de NFSe"
                />
            </div>

            {/* Hidden file input for certificate upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pfx,.p12"
                className="hidden"
                onChange={handleFileSelected}
            />

            {/* Certificado Digital */}
            <div>
                <div className="pb-3 mb-5 border-b border-pf-grey/20">
                    <h3 className="font-sans text-sm font-bold text-pf-black">Certificado Digital (A1) e NFS-e</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey mt-0.5">
                        Integracao Prefeitura de Sao Paulo -- SP
                    </p>
                </div>
                <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 border border-dashed border-pf-grey/30 bg-pf-grey/5 rounded">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 flex items-center justify-center bg-green-100 text-green-700 rounded">
                                <Shield className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="font-sans text-sm font-bold text-pf-black">
                                    {certFileName ? `Certificado: ${certFileName}` : "Certificado Ativo"}
                                </p>
                                <p className="font-mono text-[10px] text-pf-grey mt-0.5">Vencimento: 15/10/2026</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRenovarUpload}
                            className="flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-widest text-pf-blue hover:text-pf-black transition-colors"
                        >
                            <Upload className="h-3 w-3" />
                            Renovar Upload
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="cod-servico" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Codigo de Servico Padrao</label>
                        <input
                            id="cod-servico"
                            type="text"
                            value={params.codServico}
                            onChange={(e) => setParams((p) => ({ ...p, codServico: e.target.value }))}
                            className={`${inputClass} max-w-md`}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="aliquota" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Aliquota (Simples Nacional %)</label>
                        <input
                            id="aliquota"
                            type="text"
                            value={params.aliquota}
                            onChange={(e) => setParams((p) => ({ ...p, aliquota: e.target.value }))}
                            className={`${inputClass} font-mono max-w-[120px]`}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="municipio" className="text-[10px] font-bold uppercase tracking-[0.1em] text-pf-grey">Municipio de Emissao</label>
                        <div className="relative max-w-md">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
                            <input
                                id="municipio"
                                type="text"
                                value={params.municipio}
                                onChange={(e) => setParams((p) => ({ ...p, municipio: e.target.value }))}
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-pf-grey/10 pt-4">
                        <button
                            onClick={handleDiscard}
                            className="rounded-md border border-pf-grey/20 bg-white px-6 py-2.5 font-sans text-sm font-bold text-pf-grey hover:bg-pf-grey/5 transition-all"
                        >
                            Descartar
                        </button>
                        <button
                            onClick={handleSave}
                            className="rounded-md bg-pf-blue px-6 py-2.5 font-sans text-sm font-bold text-white hover:bg-blue-800 transition-all shadow-sm"
                        >
                            Salvar Parametros Fiscais
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
