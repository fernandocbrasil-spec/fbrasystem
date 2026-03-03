import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Mock Login",
            credentials: {},
            async authorize() {
                // Mock de usuario para teste do sistema
                // TODO: substituir por Azure AD provider em producao
                return {
                    id: "a0000000-0000-4000-8000-000000000001",
                    name: "Fernando Brasil",
                    email: "fernando@pfadvogados.com.br",
                    role: "socio",
                    azureId: "mock-azure-id",
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.azureId = user.azureId;
                token.role = user.role;
                token.userId = user.id;
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
    },
});
