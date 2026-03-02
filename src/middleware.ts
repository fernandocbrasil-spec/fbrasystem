import { auth } from "@/auth";

// Rotas restritas por role — qualquer rota que comece com a key exige um dos roles listados
const ROLE_ROUTES: Record<string, string[]> = {
    // Financeiro
    "/financeiro": ["socio", "admin", "financeiro"],
    "/contas-a-pagar": ["socio", "admin", "financeiro"],
    "/faturamento": ["socio", "admin", "financeiro"],
    "/fluxo-de-caixa": ["socio", "admin", "financeiro"],
    "/conciliacao-bancaria": ["socio", "admin", "financeiro"],
    "/contabilidade": ["socio", "admin", "financeiro"],
    // Aprovacoes
    "/aprovacoes": ["socio", "admin"],
    // Time tracking aprovacoes
    "/time-tracking/aprovacoes": ["socio", "admin"],
    // Admin
    "/cofre": ["socio", "admin"],
    "/configuracoes": ["socio", "admin"],
    "/seguranca-logs": ["socio", "admin"],
    "/workflows": ["socio", "admin"],
};

// Sorted by path length descending so more specific routes match first
const sortedRoutes = Object.entries(ROLE_ROUTES).sort(
    ([a], [b]) => b.length - a.length,
);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");

    if (isApiAuthRoute) return;

    if (isAuthPage) {
        if (isLoggedIn) {
            return Response.redirect(new URL("/dashboard", req.nextUrl));
        }
        return;
    }

    if (!isLoggedIn) {
        return Response.redirect(new URL("/login", req.nextUrl));
    }

    // RBAC: verificar permissao de role para rotas restritas
    const userRole = (req.auth?.user as { role?: string } | undefined)?.role ?? "";
    for (const [route, allowedRoles] of sortedRoutes) {
        if (req.nextUrl.pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
            return Response.redirect(new URL("/dashboard", req.nextUrl));
        }
    }
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
