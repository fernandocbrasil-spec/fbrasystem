import { auth, signOut } from "@/auth";
import { LogOut, User as UserIcon } from "lucide-react";

export async function Header() {
    const session = await auth();
    const userName = session?.user?.name || "Usuário";
    const userRole = (session?.user as any)?.role || "Colaborador";

    return (
        <header className="fixed right-0 top-0 z-30 flex h-12 w-[calc(100%-5rem)] items-center justify-end border-b border-pf-grey/10 bg-white px-8">
            <div className="flex items-center gap-6">
                {/* USER PROFILE */}
                <div className="flex items-center gap-3 border-r border-pf-grey/20 pr-6">
                    <div className="flex flex-col items-end">
                        <span className="font-sans text-sm font-bold text-pf-black">
                            {userName}
                        </span>
                        <span className="font-sans text-[10px] font-medium uppercase tracking-tighter text-pf-blue">
                            {userRole}
                        </span>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pf-grey/10 text-pf-black ring-1 ring-pf-grey/20">
                        <UserIcon className="h-4 w-4" />
                    </div>
                </div>

                {/* LOGOUT */}
                <form
                    action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/login" });
                    }}
                >
                    <button
                        type="submit"
                        className="group flex h-8 w-8 items-center justify-center rounded-md text-pf-grey transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Sair do sistema"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </header>
    );
}
