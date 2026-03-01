import { signIn } from "@/auth";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-pf-black text-pf-white">
            <div className="w-full max-w-md space-y-8 p-8 text-center">
                {/* LOGO PF */}
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-lg border-2 border-pf-blue bg-pf-black-900 shadow-[0_0_20px_rgba(33,46,198,0.3)]">
                    <span className="font-display text-4xl text-pf-blue">PF</span>
                </div>

                <div className="space-y-2">
                    <h1 className="font-sans text-2xl font-bold tracking-tighter uppercase">
                        Peixoto Feiteiro
                    </h1>
                    <p className="font-sans text-sm text-pf-grey uppercase tracking-widest">
                        SISTEMA INTERNO DE GESTÃO
                    </p>
                </div>

                <div className="mt-12">
                    <form
                        action={async () => {
                            "use server";
                            await signIn("credentials", { redirectTo: "/dashboard" });
                        }}
                    >
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-3 rounded-md bg-pf-blue px-6 py-4 font-sans font-bold text-white transition-all hover:bg-blue-700 hover:shadow-[0_0_15px_rgba(33,46,198,0.5)] active:scale-95"
                        >
                            <svg className="h-5 w-5 fill-current" viewBox="0 0 23 23">
                                <path d="M11.46 0H1.89C.85 0 0 .85 0 1.89v9.57h11.46V0zM23 0h-9.57v11.46H23V0zM11.46 11.54H0V21.1c0 1.05.85 1.9 1.89 1.9h9.57V11.54zM23 11.54h-11.54V23H21.1c1.05 0 1.9-.85 1.9-1.89V11.54z" />
                            </svg>
                            Acessar Dashboard
                        </button>
                    </form>
                    <p className="mt-6 text-xs text-pf-grey italic">
                        Mock Mode Ativo: Acesso direto ao painel.
                    </p>
                </div>
            </div>

            {/* Background Watermark Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden">
                <span className="font-display text-[60vh] select-none">PF</span>
            </div>
        </div >
    );
}
