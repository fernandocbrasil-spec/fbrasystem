"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
    id: string;
    message: string;
    type: ToastType;
};

type ToastContextType = {
    toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
    return useContext(ToastContext);
}

const icons: Record<ToastType, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
};

const colors: Record<ToastType, string> = {
    success: "border-green-500 bg-green-50 text-green-800",
    error: "border-red-500 bg-red-50 text-red-800",
    warning: "border-amber-500 bg-amber-50 text-amber-800",
    info: "border-pf-blue bg-blue-50 text-pf-blue",
};

const iconColors: Record<ToastType, string> = {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-amber-500",
    info: "text-pf-blue",
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "success") => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const Icon = icons[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 3500);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    return (
        <div
            className={cn(
                "pointer-events-auto flex items-center gap-3 border-l-4 px-4 py-3 shadow-lg animate-in slide-in-from-right-5 fade-in duration-300 min-w-[280px] max-w-[400px]",
                colors[toast.type]
            )}
        >
            <Icon className={cn("h-4 w-4 shrink-0", iconColors[toast.type])} />
            <span className="text-xs font-medium flex-1">{toast.message}</span>
            <button
                onClick={() => onRemove(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
