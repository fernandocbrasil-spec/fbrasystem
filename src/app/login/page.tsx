import { signIn } from "@/auth";

const isDevMode = process.env.NODE_ENV === "development";
const hasAzureAD = !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
);

export default function LoginPage() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-pf-black text-white">

            {/* Background — B&W architectural (CSS gradient fallback) */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-pf-black/40 via-pf-black/70 to-pf-black" />
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
                            linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%),
                            repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 80px),
                            repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 120px)
                        `,
                    }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-lg space-y-10 p-8 text-center">

                {/* Logo — PF Monogram */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center bg-pf-blue p-3">
                    <svg viewBox="0 0 40 40" fill="none" className="h-full w-full" aria-label="PF Advogados">
                        <g fill="white">
                            <rect x="8" y="4" width="3.5" height="32" />
                            <rect x="11.5" y="4" width="16" height="3.5" />
                            <rect x="24" y="4" width="3.5" height="15" />
                            <rect x="11.5" y="15.5" width="16" height="3.5" />
                            <rect x="11.5" y="27" width="12" height="3.5" />
                        </g>
                    </svg>
                </div>

                {/* Title */}
                <div className="space-y-3">
                    <h1 className="font-display text-3xl tracking-[0.3em] uppercase text-white">
                        Peixoto Feiteiro
                    </h1>
                    <p className="text-sm tracking-[0.5em] uppercase text-pf-grey">
                        Advogados
                    </p>
                </div>

                {/* Partners */}
                <div className="flex items-center justify-center gap-4 text-[11px] tracking-[0.2em] uppercase text-pf-grey/60">
                    <span>Peixoto</span>
                    <span className="text-pf-grey/30">|</span>
                    <span>Feiteiro</span>
                    <span className="text-pf-grey/30">|</span>
                    <span>Machado</span>
                    <span className="text-pf-grey/30">|</span>
                    <span>Tarandach</span>
                </div>

                {/* CTAs */}
                <div className="flex flex-col items-center gap-4 pt-4">
                    {/* Azure AD (production) */}
                    {hasAzureAD && (
                        <form
                            action={async () => {
                                "use server";
                                await signIn("microsoft-entra-id", { redirectTo: "/dashboard" });
                            }}
                        >
                            <button
                                type="submit"
                                className="flex items-center gap-2.5 rounded-full bg-pf-blue px-8 py-3 text-sm font-bold text-white tracking-wide transition-all hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(33,46,198,0.4)] active:scale-95"
                            >
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 23 23">
                                    <path d="M11.46 0H1.89C.85 0 0 .85 0 1.89v9.57h11.46V0zM23 0h-9.57v11.46H23V0zM11.46 11.54H0V21.1c0 1.05.85 1.9 1.89 1.9h9.57V11.54zM23 11.54h-11.54V23H21.1c1.05 0 1.9-.85 1.9-1.89V11.54z" />
                                </svg>
                                Entrar com Microsoft
                            </button>
                        </form>
                    )}

                    {/* Dev mock (development only) */}
                    {isDevMode && (
                        <form
                            action={async () => {
                                "use server";
                                await signIn("credentials", { redirectTo: "/dashboard" });
                            }}
                        >
                            <button
                                type="submit"
                                className={`flex items-center gap-2.5 rounded-full px-8 py-3 text-sm font-bold tracking-wide transition-all active:scale-95 ${
                                    hasAzureAD
                                        ? "border border-pf-grey/30 text-pf-grey hover:bg-white/5"
                                        : "bg-pf-blue text-white hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(33,46,198,0.4)]"
                                }`}
                            >
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 23 23">
                                    <path d="M11.46 0H1.89C.85 0 0 .85 0 1.89v9.57h11.46V0zM23 0h-9.57v11.46H23V0zM11.46 11.54H0V21.1c0 1.05.85 1.9 1.89 1.9h9.57V11.54zM23 11.54h-11.54V23H21.1c1.05 0 1.9-.85 1.9-1.89V11.54z" />
                                </svg>
                                Dev Login (Mock)
                            </button>
                        </form>
                    )}

                    {/* No providers available */}
                    {!hasAzureAD && !isDevMode && (
                        <p className="text-sm text-red-400">
                            Nenhum provedor de autenticacao configurado.
                            Verifique as variaveis de ambiente.
                        </p>
                    )}
                </div>

                {isDevMode && (
                    <p className="text-[10px] text-pf-grey/40 italic">
                        Ambiente de Desenvolvimento
                    </p>
                )}
            </div>

            {/* Bottom accent bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-pf-blue z-10" />
        </div>
    );
}
