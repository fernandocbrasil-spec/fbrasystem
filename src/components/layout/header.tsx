import { MobileMenuButton } from "./mobile-menu";

export function Header() {
    return (
        <header className="fixed right-0 top-0 z-30 flex h-12 w-full lg:w-[calc(100%-5rem)] items-center justify-between lg:justify-end border-b border-pf-grey/10 bg-white px-4 lg:px-8">
            <MobileMenuButton />
            <span className="font-display text-[11px] tracking-[0.25em] uppercase text-pf-black/60">
                Peixoto Feiteiro Advogados
            </span>
        </header>
    );
}
