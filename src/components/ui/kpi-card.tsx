import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
    label: string;
    value: string;
    icon: LucideIcon;
    iconColor?: string;
    trend?: { value: string; up: boolean };
    accentColor?: string;
    className?: string;
}

export function KpiCard({
    label,
    value,
    icon: Icon,
    iconColor = "text-pf-blue",
    trend,
    accentColor,
    className,
}: KpiCardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-lg border border-pf-grey/10 p-4",
                accentColor && `border-l-[3px] ${accentColor}`,
                className,
            )}
        >
            <div className="flex items-center gap-1.5 mb-2">
                <Icon size={12} className={`${iconColor} opacity-60`} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-pf-grey/50">
                    {label}
                </span>
            </div>
            <p className="font-sans text-xl font-bold text-pf-black leading-none tracking-tight">
                {value}
            </p>
            {trend && (
                <div className="flex items-center gap-1 mt-2">
                    <div
                        className={`flex items-center gap-0.5 px-1 py-0.5 rounded ${
                            trend.up ? "bg-emerald-50" : "bg-red-50"
                        }`}
                    >
                        {trend.up ? (
                            <TrendingUp size={9} className="text-emerald-600" />
                        ) : (
                            <TrendingDown size={9} className="text-red-500" />
                        )}
                        <span
                            className={`text-[9px] font-bold ${
                                trend.up ? "text-emerald-600" : "text-red-500"
                            }`}
                        >
                            {trend.value}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
