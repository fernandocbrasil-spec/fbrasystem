import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
    icon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = "", id, ...props }, ref) => {
        const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="font-sans text-[11px] font-bold uppercase tracking-wider text-pf-grey"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pf-grey" aria-hidden="true">
                            {icon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`w-full rounded-md border bg-white px-3 py-2 font-sans text-sm text-pf-black outline-none transition-colors placeholder:text-pf-grey/50 focus:border-pf-blue focus:ring-1 focus:ring-pf-blue ${icon ? "pl-8" : ""} ${error ? "border-red-400" : "border-pf-grey/20"} ${className}`}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-[11px] font-medium text-red-500">{error}</p>
                )}
            </div>
        );
    },
);
Input.displayName = "Input";
