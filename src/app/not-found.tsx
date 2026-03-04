import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F4F5F7] px-4">
            <div className="text-center">
                <p className="text-6xl font-bold text-gray-200">404</p>
                <h2 className="mt-4 text-lg font-bold text-gray-900">
                    Pagina nao encontrada
                </h2>
                <p className="mt-1 max-w-md text-sm text-gray-500">
                    A pagina que voce procura nao existe ou foi movida.
                </p>
            </div>
            <Link
                href="/dashboard"
                className="rounded-lg bg-[#212EC6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
                Voltar ao Dashboard
            </Link>
        </div>
    );
}
