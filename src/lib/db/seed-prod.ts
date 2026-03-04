import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { roles, users, partners } from "./schema";
import { sql } from "drizzle-orm";

// =============================================================================
// Production Seed — Roles, real users, and partners ONLY
// No fake leads, clients, cases, or financial data
// Usage: npm run db:seed-prod
// =============================================================================

if (process.env.NODE_ENV === "production") {
    console.warn("WARNING: Running seed-prod in production environment.");
    console.warn("This will insert roles and initial users. Press Ctrl+C within 5s to abort.");
    await new Promise((resolve) => setTimeout(resolve, 5000));
}

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const client = postgres(url);
const db = drizzle(client);

// Deterministic UUIDs — must match auth.ts mock user
const UUID = {
    ROLE_SOCIO: "b0000000-0000-4000-8000-000000000001",
    ROLE_ADVOGADO: "b0000000-0000-4000-8000-000000000002",
    ROLE_FINANCEIRO: "b0000000-0000-4000-8000-000000000003",
    ROLE_ADMIN: "b0000000-0000-4000-8000-000000000004",
    USER_FERNANDO: "a0000000-0000-4000-8000-000000000001",
    USER_JOSE_RAFAEL: "a0000000-0000-4000-8000-000000000002",
};

async function seedProd() {
    console.log("Seeding production database...\n");

    // 1. Roles
    console.log("1. Inserting roles...");
    await db.insert(roles).values([
        { id: UUID.ROLE_SOCIO, name: "socio", permissions: { all: true } },
        { id: UUID.ROLE_ADVOGADO, name: "advogado", permissions: {} },
        { id: UUID.ROLE_FINANCEIRO, name: "financeiro", permissions: {} },
        { id: UUID.ROLE_ADMIN, name: "admin", permissions: { all: true } },
    ]).onConflictDoNothing();

    // 2. Real users (socios)
    console.log("2. Inserting users...");
    await db.insert(users).values([
        {
            id: UUID.USER_FERNANDO,
            email: "fernando@pfadvogados.com.br",
            name: "Fernando Peixoto",
            roleId: UUID.ROLE_SOCIO,
            hourlyRate: "650",
            isActive: true,
        },
        {
            id: UUID.USER_JOSE_RAFAEL,
            email: "joserafa@pfadvogados.com.br",
            name: "Jose Rafael Feiteiro",
            roleId: UUID.ROLE_SOCIO,
            hourlyRate: "650",
            isActive: true,
        },
    ]).onConflictDoNothing();

    // 3. Partners (for Cofre module)
    console.log("3. Inserting partners...");
    await db.insert(partners).values([
        {
            userId: UUID.USER_FERNANDO,
            sharePercentage: "50.00",
        },
        {
            userId: UUID.USER_JOSE_RAFAEL,
            sharePercentage: "50.00",
        },
    ]).onConflictDoNothing();

    // Verify
    const roleCount = await db.select({ count: sql<number>`count(*)` }).from(roles);
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    console.log(`\nDone. Roles: ${roleCount[0]?.count}, Users: ${userCount[0]?.count}`);
}

seedProd()
    .then(() => {
        console.log("Production seed completed successfully.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Production seed failed:", err);
        process.exit(1);
    });
