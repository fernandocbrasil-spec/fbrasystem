import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface SectionHeaderProps {
    title: string;
    icon?: ReactNode;
    count?: number;
    action?: { label: string; href: string };
}

export function SectionHeader({ title, icon, count, action }: SectionHeaderProps) {
    return (
        <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="text-xs font-bold text-pf-black">{title}</h3>
            {count !== undefined && (
                <span className="ml-auto w-5 h-5 rounded-full bg-pf-blue text-white text-[10px] font-bold flex items-center justify-center">
                    {count}
                </span>
            )}
            {action && (
                <Link
                    href={action.href}
                    className="ml-auto text-[10px] text-pf-blue font-bold hover:text-pf-black flex items-center gap-1 transition-colors"
                >
                    {action.label} <ArrowUpRight size={10} />
                </Link>
            )}
        </div>
    );
}
