import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function DashboardNotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pf-grey/10">
                <FileQuestion className="h-8 w-8 text-pf-grey" />
            </div>
            <div className="text-center">
                <h2 className="font-sans text-lg font-bold text-pf-black">
                    Pagina nao encontrada
                </h2>
                <p className="mt-1 max-w-md text-sm text-pf-grey">
                    O endereco que voce acessou nao existe ou foi removido.
                </p>
            </div>
            <Link
                href="/dashboard"
                className="rounded-md bg-pf-blue px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-pf-blue/90 active:scale-95"
            >
                Voltar ao Dashboard
            </Link>
        </div>
    );
}
