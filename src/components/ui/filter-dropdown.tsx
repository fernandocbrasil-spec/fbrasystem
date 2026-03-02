"use client";

import { useState, useRef, useCallback } from "react";
import { Filter, Check } from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";

type FilterOption = { value: string; label: string };

interface FilterDropdownProps {
    label: string;
    options: FilterOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

export function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
    const [open, setOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useClickOutside(containerRef, useCallback(() => setOpen(false), []));

    const toggle = (value: string) => {
        onChange(
            selected.includes(value)
                ? selected.filter((v) => v !== value)
                : [...selected, value]
        );
    };

    const clearAll = () => onChange([]);

    const openDropdown = () => {
        setOpen(true);
        setFocusedIndex(0);
        requestAnimationFrame(() => optionRefs.current[0]?.focus());
    };

    const closeDropdown = () => {
        setOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
    };

    const handleButtonKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDropdown();
        }
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
        switch (e.key) {
            case "Escape":
                e.preventDefault();
                closeDropdown();
                break;
            case "ArrowDown":
                e.preventDefault();
                if (index < options.length - 1) {
                    setFocusedIndex(index + 1);
                    optionRefs.current[index + 1]?.focus();
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (index > 0) {
                    setFocusedIndex(index - 1);
                    optionRefs.current[index - 1]?.focus();
                } else {
                    closeDropdown();
                }
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                toggle(options[index].value);
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={buttonRef}
                onClick={() => (open ? closeDropdown() : openDropdown())}
                onKeyDown={handleButtonKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Filtrar por ${label}`}
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
                <div
                    role="listbox"
                    aria-label={label}
                    aria-multiselectable="true"
                    className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-pf-grey/20 bg-white py-1 shadow-lg"
                >
                    {options.map((opt, index) => {
                        const isSelected = selected.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                ref={(el) => { optionRefs.current[index] = el; }}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => toggle(opt.value)}
                                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                    isSelected
                                        ? "bg-pf-blue/5 text-pf-blue font-semibold"
                                        : "text-pf-black hover:bg-pf-grey/5"
                                } ${focusedIndex === index ? "ring-1 ring-inset ring-pf-blue" : ""}`}
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
