"use client";

import { ShieldX } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function AccessDeniedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const from = searchParams.get("from");

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <ShieldX className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Acesso Negado</h1>
                <p className="text-sm text-gray-500 max-w-md">
                    Voce nao tem permissao para acessar esta area do sistema.
                    {from && (
                        <span className="block mt-1 font-mono text-xs text-gray-400">
                            Rota: {from}
                        </span>
                    )}
                </p>
            </div>
            <button
                onClick={() => router.push("/dashboard")}
                className="rounded-lg bg-pf-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
                Voltar ao Dashboard
            </button>
        </div>
    );
}

export default function AcessoNegadoPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-pf-blue border-t-transparent" />
            </div>
        }>
            <AccessDeniedContent />
        </Suspense>
    );
}
