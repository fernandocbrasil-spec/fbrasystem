"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui";
import { AlertTriangle } from "lucide-react";
import { createTimeEntry, getCapStatusAction } from "@/lib/actions";
import type { CapStatus } from "@/lib/billing/cap";

// ─── Constants ───────────────────────────────────────────────────────────────

type ActivityType = "reuniao" | "pesquisa" | "elaboracao" | "revisao" | "audiencia" | "administrativo";

const ACTIVITY_LABELS: Record<ActivityType, string> = {
    reuniao: "Reuniao",
    pesquisa: "Pesquisa Juridica",
    elaboracao: "Elaboracao",
    revisao: "Revisao / Analise",
    audiencia: "Audiencia",
    administrativo: "Administrativo",
};

function parseDurationToMinutes(input: string): number | null {
    const match = input.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (m >= 60) return null;
    return h * 60 + m;
}

function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface TimeEntryFormProps {
    /** Fixed case ID — hides case selector when provided */
    caseId?: string;
    /** Case options for dropdown (when caseId is not fixed) */
    caseOptions?: Array<{ id: string; number: string; client: string }>;
    /** Callback after successful creation */
    onSuccess: () => void;
    /** Optional cancel handler */
    onCancel?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TimeEntryForm({ caseId, caseOptions, onSuccess, onCancel }: TimeEntryFormProps) {
    const { toast } = useToast();

    const [selectedCaseId, setSelectedCaseId] = useState(caseId ?? caseOptions?.[0]?.id ?? "");
    const [activityType, setActivityType] = useState<ActivityType>("reuniao");
    const [duration, setDuration] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [billable, setBillable] = useState(true);
    const [capStatus, setCapStatus] = useState<CapStatus | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const resolvedCaseId = caseId ?? selectedCaseId;

    // Load cap status when case changes
    useEffect(() => {
        if (!resolvedCaseId) return;
        const today = new Date().toISOString().split("T")[0];
        getCapStatusAction(resolvedCaseId, today).then(setCapStatus);
    }, [resolvedCaseId]);

    const minutes = parseDurationToMinutes(duration);
    const isValid = description.trim().length > 0 && minutes !== null && minutes > 0 && resolvedCaseId.length > 0;

    const handleSubmit = async () => {
        if (!isValid || !minutes) return;
        setSubmitting(true);

        try {
            const result = await createTimeEntry({
                caseId: resolvedCaseId,
                activityType,
                description: description.trim(),
                durationMinutes: minutes,
                date,
                isBillable: billable,
            });

            if (!result.success) {
                toast(result.error ?? "Erro ao criar apontamento", "warning");
                return;
            }

            if (result.capWarning) {
                toast(result.capWarning, "warning");
            }

            // Reset form
            setActivityType("reuniao");
            setDuration("");
            setDescription("");
            setDate(new Date().toISOString().split("T")[0]);
            setBillable(true);
            if (!caseId && caseOptions?.[0]) setSelectedCaseId(caseOptions[0].id);

            toast(`Lancamento de ${formatDuration(minutes)} salvo como rascunho.`, "success");
            onSuccess();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white border border-pf-grey/20 rounded p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Case selector — hidden when caseId is fixed */}
                {!caseId && caseOptions && (
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Caso</label>
                        <select
                            value={selectedCaseId}
                            onChange={(e) => setSelectedCaseId(e.target.value)}
                            className="w-full h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                        >
                            {caseOptions.map((c) => (
                                <option key={c.id} value={c.id}>{c.number} -- {c.client}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Tipo de Atividade</label>
                    <select
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value as ActivityType)}
                        className="w-full h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                    >
                        {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Duracao (hh:mm)</label>
                    <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="Ex: 01:30"
                        className="w-full h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white font-mono"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Data</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-pf-grey mb-1">Descricao</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva a atividade realizada..."
                    className="w-full h-8 rounded-md border border-pf-grey/20 px-3 text-sm font-sans outline-none focus:border-pf-blue bg-white"
                    onKeyDown={(e) => { if (e.key === "Enter" && isValid) handleSubmit(); }}
                />
            </div>

            {/* Cap indicator */}
            {capStatus && !capStatus.isUncapped && (
                <div className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-semibold ${
                    capStatus.threshold === "ok" ? "bg-emerald-50 text-emerald-700" :
                    capStatus.threshold === "warning" ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                }`}>
                    {capStatus.threshold !== "ok" && <AlertTriangle size={12} />}
                    Cap: {Math.round(capStatus.usedMinutes / 60)}h / {Math.round(capStatus.capMinutes / 60)}h ({Math.round(capStatus.percentage)}%)
                </div>
            )}

            <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-pf-grey cursor-pointer select-none">
                    <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} className="accent-pf-blue" />
                    Faturavel
                </label>
                <div className="flex gap-2">
                    {onCancel && (
                        <Button variant="secondary" size="sm" onClick={onCancel}>
                            Cancelar
                        </Button>
                    )}
                    <Button variant="dark" size="sm" onClick={handleSubmit} disabled={!isValid || submitting}>
                        {submitting ? "Salvando..." : "Lancar"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
