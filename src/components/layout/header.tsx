export async function Header() {
    return (
        <header className="fixed right-0 top-0 z-30 flex h-12 w-[calc(100%-5rem)] items-center justify-end border-b border-pf-grey/10 bg-white px-8">
            <span className="font-display text-[11px] tracking-[0.25em] uppercase text-pf-black/60">
                Peixoto Feiteiro Advogados
            </span>
        </header>
    );
}
