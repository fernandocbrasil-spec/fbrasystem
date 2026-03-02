"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

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

    const handleConfirm = () => {
        if (comment.trim()) {
            onConfirm(comment.trim());
            setComment("");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirm}
                        disabled={!comment.trim()}
                    >
                        Confirmar Rejeicao
                    </Button>
                </>
            }
        >
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
        </Modal>
    );
}
