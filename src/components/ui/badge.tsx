type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

type BadgeProps = {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-pf-grey/10 text-pf-grey",
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${variantStyles[variant]} ${className}`}
        >
            {children}
        </span>
    );
}
