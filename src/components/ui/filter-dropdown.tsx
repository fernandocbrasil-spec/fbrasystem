"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, Check } from "lucide-react";

type FilterOption = { value: string; label: string };

interface FilterDropdownProps {
    label: string;
    options: FilterOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

export function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggle = (value: string) => {
        onChange(
            selected.includes(value)
                ? selected.filter((v) => v !== value)
                : [...selected, value]
        );
    };

    const clearAll = () => onChange([]);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors ${
                    selected.length > 0
                        ? "border-pf-blue bg-pf-blue/5 text-pf-blue"
                        : "border-pf-grey/20 bg-white text-pf-black hover:bg-pf-blue/5 hover:text-pf-blue hover:border-pf-blue"
                }`}
            >
                <Filter className="h-4 w-4" aria-hidden="true" />
                {label}
                {selected.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pf-blue text-[10px] font-bold text-white">
                        {selected.length}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-pf-grey/20 bg-white py-1 shadow-lg">
                    {options.map((opt) => {
                        const isSelected = selected.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                onClick={() => toggle(opt.value)}
                                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                    isSelected
                                        ? "bg-pf-blue/5 text-pf-blue font-semibold"
                                        : "text-pf-black hover:bg-pf-grey/5"
                                }`}
                            >
                                <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                        isSelected
                                            ? "border-pf-blue bg-pf-blue"
                                            : "border-pf-grey/30"
                                    }`}
                                >
                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                </span>
                                {opt.label}
                            </button>
                        );
                    })}
                    {selected.length > 0 && (
                        <>
                            <div className="mx-3 my-1 border-t border-pf-grey/10" />
                            <button
                                onClick={clearAll}
                                className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-pf-grey hover:text-pf-black transition-colors"
                            >
                                Limpar filtros
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
