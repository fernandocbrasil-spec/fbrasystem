import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
            <div>
                <h1 className="font-sans text-base font-bold tracking-tight text-pf-black">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-[11px] text-pf-grey mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
