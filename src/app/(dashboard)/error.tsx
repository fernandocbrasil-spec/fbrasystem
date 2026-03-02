"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-center">
                <h2 className="font-sans text-lg font-bold text-pf-black">
                    Algo deu errado
                </h2>
                <p className="mt-1 max-w-md text-sm text-pf-grey">
                    Ocorreu um erro inesperado ao carregar esta pagina.
                    Tente novamente ou entre em contato com o suporte.
                </p>
                {error.digest && (
                    <p className="mt-2 font-mono text-[10px] text-pf-grey/60">
                        Ref: {error.digest}
                    </p>
                )}
            </div>
            <button
                onClick={reset}
                className="flex items-center gap-2 rounded-md bg-pf-blue px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-pf-blue/90 active:scale-95"
            >
                <RotateCcw className="h-3.5 w-3.5" />
                Tentar novamente
            </button>
        </div>
    );
}
