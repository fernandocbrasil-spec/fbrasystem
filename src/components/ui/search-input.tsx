"use client";

import { Search, X } from "lucide-react";
import { useRef, type InputHTMLAttributes } from "react";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    onClear?: () => void;
};

export function SearchInput({ value, onClear, className = "", ...props }: SearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasValue = typeof value === "string" ? value.length > 0 : !!value;

    return (
        <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pf-grey" aria-hidden="true" />
            <input
                ref={inputRef}
                type="text"
                value={value}
                className={`h-8 w-48 rounded-md border border-pf-grey/20 bg-white pl-8 pr-8 text-sm font-sans outline-none transition-colors placeholder:text-pf-grey/50 focus:border-pf-blue focus:ring-1 focus:ring-pf-blue ${className}`}
                {...props}
            />
            {hasValue && onClear && (
                <button
                    type="button"
                    onClick={() => {
                        onClear();
                        inputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-pf-grey hover:text-pf-black transition-colors"
                    aria-label="Limpar busca"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
