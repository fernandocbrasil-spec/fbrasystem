import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: ReactNode;
};

const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-pf-blue text-white hover:bg-pf-blue/90 active:bg-pf-blue/80",
    secondary: "border border-pf-grey/20 bg-white text-pf-black hover:bg-pf-grey/5 active:bg-pf-grey/10",
    ghost: "text-pf-grey hover:text-pf-black hover:bg-pf-grey/5",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
    dark: "bg-pf-black text-white hover:bg-gray-800 active:bg-gray-700",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-2.5 py-1 text-[11px] gap-1",
    md: "px-3.5 py-1.5 text-xs gap-1.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", icon, children, className = "", disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled}
                className={`inline-flex items-center justify-center rounded-md font-sans font-bold transition-colors active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
                {...props}
            >
                {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
                {children}
            </button>
        );
    },
);
Button.displayName = "Button";
