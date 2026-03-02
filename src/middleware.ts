import { auth } from "@/auth";

// Rotas restritas por role
const ROLE_ROUTES: Record<string, string[]> = {
    "/cofre": ["socio", "admin"],
    "/configuracoes": ["socio", "admin"],
};

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
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (req.nextUrl.pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
            return Response.redirect(new URL("/dashboard", req.nextUrl));
        }
    }
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
