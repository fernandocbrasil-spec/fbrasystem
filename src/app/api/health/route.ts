import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const start = Date.now();
    let dbStatus: "connected" | "error" = "error";
    let dbLatency = 0;

    try {
        const dbStart = Date.now();
        await db.execute(sql`SELECT 1`);
        dbLatency = Date.now() - dbStart;
        dbStatus = "connected";
    } catch {
        // DB unreachable
    }

    const body = {
        status: dbStatus === "connected" ? "ok" : "degraded",
        version: process.env.npm_package_version ?? "0.1.0",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        db: {
            status: dbStatus,
            latencyMs: dbLatency,
        },
        responseMs: Date.now() - start,
    };

    return Response.json(body, {
        status: dbStatus === "connected" ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
    });
}
