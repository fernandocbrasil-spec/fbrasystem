import { auth } from "@/auth";

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
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
