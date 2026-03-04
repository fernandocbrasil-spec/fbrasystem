import { auth } from "@/auth";
import type { UserRole } from "@/lib/approval/types";

// =============================================================================
// Server action authorization helper
// Use in every privileged server action to validate session + role
// =============================================================================

export type AuthorizedUser = {
    id: string;
    role: UserRole;
    email: string;
    name: string;
};

type AuthorizeOptions = {
    /** Roles allowed to perform this action. If omitted, any authenticated user is allowed. */
    roles?: UserRole[];
};

type AuthorizeResult =
    | { ok: true; user: AuthorizedUser }
    | { ok: false; error: string };

/**
 * Validate the current session and optionally check role.
 *
 * Usage:
 * ```ts
 * const result = await authorize({ roles: ["socio", "admin"] });
 * if (!result.ok) return { success: false, error: result.error };
 * const { user } = result;
 * ```
 */
export async function authorize(options?: AuthorizeOptions): Promise<AuthorizeResult> {
    const session = await auth();

    if (!session?.user) {
        return { ok: false, error: "Nao autenticado." };
    }

    const role = session.user.role as UserRole | undefined;
    if (!role) {
        return { ok: false, error: "Sessao invalida — role ausente." };
    }

    if (options?.roles && !options.roles.includes(role)) {
        return {
            ok: false,
            error: "Permissao insuficiente para esta acao.",
        };
    }

    return {
        ok: true,
        user: {
            id: session.user.id ?? "",
            role,
            email: session.user.email ?? "",
            name: session.user.name ?? "",
        },
    };
}
