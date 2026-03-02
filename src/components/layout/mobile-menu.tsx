"use client";

import { useState, createContext, useContext, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

type MobileMenuContextType = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
};

const MobileMenuContext = createContext<MobileMenuContextType>({
    isOpen: false,
    open: () => {},
    close: () => {},
    toggle: () => {},
});

export function useMobileMenu() {
    return useContext(MobileMenuContext);
}

export function MobileMenuProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <MobileMenuContext.Provider
            value={{
                isOpen,
                open: () => setIsOpen(true),
                close: () => setIsOpen(false),
                toggle: () => setIsOpen((v) => !v),
            }}
        >
            {children}
        </MobileMenuContext.Provider>
    );
}

export function MobileMenuButton() {
    const { isOpen, toggle } = useMobileMenu();

    return (
        <button
            onClick={toggle}
            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-md text-pf-black hover:bg-pf-grey/10 transition-colors"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
    );
}

export function MobileOverlay() {
    const { isOpen, close } = useMobileMenu();

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={close}
            aria-hidden="true"
        />
    );
}
