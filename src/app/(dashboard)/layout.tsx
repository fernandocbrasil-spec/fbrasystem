import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ToastWrapper } from "@/components/ui/toast-wrapper";
import { MobileMenuProvider, MobileOverlay } from "@/components/layout/mobile-menu";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userName = session?.user?.name || "Usuário";

    return (
        <ToastWrapper>
            <MobileMenuProvider>
                <div className="min-h-screen bg-background">
                    <a
                        href="#main-content"
                        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-pf-blue focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white"
                    >
                        Pular para o conteudo
                    </a>
                    <MobileOverlay />
                    <Sidebar userRole={userRole} userName={userName} />
                    <Header />
                    <main id="main-content" className="lg:ml-20 pt-12 h-screen overflow-hidden">
                        <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </MobileMenuProvider>
        </ToastWrapper>
    );
}
