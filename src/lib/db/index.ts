import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | null = null;

export function getDb(): DB {
    if (!_db) {
        const url = process.env.DATABASE_URL;
        if (!url) {
            throw new Error("DATABASE_URL is not set");
        }
        const client = postgres(url);
        _db = drizzle(client, { schema });
    }
    return _db;
}

/** Convenience re-export — throws only on first actual use, not on import */
export const db = new Proxy({} as DB, {
    get(_target, prop) {
        return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
