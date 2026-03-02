import { type ReactNode } from "react";

type TableProps = {
    children: ReactNode;
    className?: string;
};

export function Table({ children, className = "" }: TableProps) {
    return (
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full px-4 sm:px-6 lg:px-8">
                <table className={`w-full text-left font-sans text-sm ${className}`}>
                    {children}
                </table>
            </div>
        </div>
    );
}

type ThProps = {
    children: ReactNode;
    className?: string;
};

export function Th({ children, className = "" }: ThProps) {
    return (
        <th className={`pb-2 text-[10px] font-bold uppercase tracking-widest text-pf-grey ${className}`}>
            {children}
        </th>
    );
}

type TdProps = {
    children: ReactNode;
    className?: string;
};

export function Td({ children, className = "" }: TdProps) {
    return (
        <td className={`py-2.5 text-sm text-pf-black ${className}`}>
            {children}
        </td>
    );
}
