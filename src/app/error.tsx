"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F4F5F7] px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-bold text-gray-900">
                    Algo deu errado
                </h2>
                <p className="mt-1 max-w-md text-sm text-gray-500">
                    Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
                </p>
                {error.digest && (
                    <p className="mt-2 font-mono text-[10px] text-gray-400">
                        Ref: {error.digest}
                    </p>
                )}
            </div>
            <button
                onClick={reset}
                className="flex items-center gap-2 rounded-lg bg-[#212EC6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
            >
                <RotateCcw className="h-4 w-4" />
                Tentar novamente
            </button>
        </div>
    );
}
