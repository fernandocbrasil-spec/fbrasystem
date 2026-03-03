/**
 * Utility functions for converting between DB types and Mock display types.
 * Used by server actions to maintain backward compatibility with existing UI.
 */

/** Convert decimal string from DB to "R$ 1.250,00" display format */
export function formatCurrency(value: string | null): string {
    if (!value) return "R$ 0,00";
    const num = parseFloat(value);
    return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Parse "R$ 1.250,00" back to "1250.00" for DB storage */
export function parseCurrency(display: string): string {
    const cleaned = display
        .replace(/R\$\s?/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? "0.00" : num.toFixed(2);
}

/** Convert DB date (YYYY-MM-DD) to display format (DD/MM/YYYY) */
export function formatDateBR(dateStr: string | null): string {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}

/** Parse display date (DD/MM/YYYY) to DB format (YYYY-MM-DD) */
export function parseDateBR(display: string): string {
    const [d, m, y] = display.split("/");
    return `${y}-${m}-${d}`;
}

/** Convert DB timestamp to display format (DD/MM/YYYY) */
export function formatTimestampBR(date: Date | null): string {
    if (!date) return "";
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

/** Format number to compact KPI display: 1500 → "R$ 2k", 1200000 → "R$ 1.20M" */
export function fmtKpi(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${sign}R$ ${Math.round(abs / 1_000)}k`;
    return `${sign}R$ ${abs.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
