import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectOption = {
    value: string;
    label: string;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
        const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="font-sans text-[11px] font-bold uppercase tracking-wider text-pf-grey"
                    >
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={`w-full rounded-md border bg-white px-3 py-2 font-sans text-sm text-pf-black outline-none transition-colors focus:border-pf-blue focus:ring-1 focus:ring-pf-blue ${error ? "border-red-400" : "border-pf-grey/20"} ${className}`}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="text-[11px] font-medium text-red-500">{error}</p>
                )}
            </div>
        );
    },
);
Select.displayName = "Select";
