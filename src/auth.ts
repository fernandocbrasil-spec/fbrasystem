import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Mock Login",
            credentials: {},
            async authorize() {
                // Mock de usuário para teste do sistema
                return {
                    id: "123",
                    name: "Sócio Diretor",
                    email: "socio@pfadvogados.com.br",
                    role: "socio",
                    azureId: "mock-azure-id"
                };
            }
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.azureId = (user as any).azureId;
                token.role = (user as any).role;
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.userId as string;
                (session.user as any).role = token.role as string;
                (session.user as any).azureId = token.azureId as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});
