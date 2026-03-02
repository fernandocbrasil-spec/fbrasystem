"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

type ApprovalDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (comment: string) => void;
    entityLabel: string;
    title?: string;
};

export function ApprovalDialog({
    isOpen,
    onClose,
    onConfirm,
    entityLabel,
    title = "Rejeitar Item",
}: ApprovalDialogProps) {
    const [comment, setComment] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setComment("");
            setTimeout(() => textareaRef.current?.focus(), 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (comment.trim()) {
            onConfirm(comment.trim());
            setComment("");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Panel */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-lg border border-pf-grey/20 shadow-xl p-6 mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-sans text-sm font-bold text-pf-black">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-pf-grey hover:text-pf-black transition-colors"
                        aria-label="Fechar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <p className="text-xs text-pf-grey mb-3">
                    Rejeitar: <span className="font-bold text-pf-black">{entityLabel}</span>
                </p>

                <textarea
                    ref={textareaRef}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Motivo da rejeicao (obrigatorio)..."
                    rows={3}
                    className="w-full rounded-md border border-pf-grey/20 px-3 py-2 text-sm font-sans outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none"
                />

                <div className="flex items-center justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="rounded-md border border-pf-grey/20 bg-white px-4 py-1.5 text-xs font-bold text-pf-black hover:bg-pf-grey/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!comment.trim()}
                        className="rounded-md bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Confirmar Rejeicao
                    </button>
                </div>
            </div>
        </div>
    );
}
