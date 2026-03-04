import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { Provider } from "next-auth/providers";

// =============================================================================
// Auth providers — Azure AD for production, mock Credentials for development
// =============================================================================

const providers: Provider[] = [];

// Production: Microsoft Entra ID (Azure AD)
if (
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
) {
    providers.push(
        MicrosoftEntraID({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
            authorization: {
                params: { scope: "openid profile email User.Read" },
            },
            profile(profile) {
                // Map Azure AD profile → NextAuth User
                return {
                    id: profile.sub ?? profile.oid,
                    name: profile.name,
                    email: profile.email ?? profile.preferred_username,
                    azureId: profile.oid ?? profile.sub,
                    // Role is resolved in JWT callback via AZURE_ROLE_MAP
                    role: undefined,
                };
            },
        }),
    );
}

// Development only: mock credentials (NEVER in production)
if (process.env.NODE_ENV === "development") {
    providers.push(
        Credentials({
            name: "Dev Login",
            credentials: {},
            async authorize() {
                return {
                    id: "a0000000-0000-4000-8000-000000000001",
                    name: "Fernando Brasil",
                    email: "fernando@pfadvogados.com.br",
                    role: "socio",
                    azureId: "mock-azure-id",
                };
            },
        }),
    );
}

// =============================================================================
// Role mapping: Azure AD email → ERP role
// Override via AZURE_ROLE_MAP env var (JSON: {"email":"role",...})
// =============================================================================

const DEFAULT_ROLE_MAP: Record<string, string> = {
    "fernando@pfadvogados.com.br": "socio",
    "joserafa@pfadvogados.com.br": "socio",
};

function resolveRole(email: string | undefined | null): string {
    if (!email) return "advogado"; // safe default — least privilege with access

    let roleMap = DEFAULT_ROLE_MAP;
    if (process.env.AZURE_ROLE_MAP) {
        try {
            roleMap = { ...DEFAULT_ROLE_MAP, ...JSON.parse(process.env.AZURE_ROLE_MAP) };
        } catch {
            // Invalid JSON — use defaults
        }
    }

    return roleMap[email.toLowerCase()] ?? "advogado";
}

// =============================================================================
// NextAuth configuration
// =============================================================================

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers,
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60, // 8 hours (workday session)
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production"
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.azureId = user.azureId;
                token.userId = user.id;
                // For Azure AD: resolve role from email mapping
                // For mock credentials: role is already set on the user object
                token.role = user.role ?? resolveRole(user.email);
            }
            // On Azure AD token refresh, keep azureId from account
            if (account?.provider === "microsoft-entra-id" && account.providerAccountId) {
                token.azureId = account.providerAccountId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId ?? "";
                session.user.role = token.role ?? "";
                session.user.azureId = token.azureId ?? "";
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
});
