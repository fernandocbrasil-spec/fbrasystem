import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface User extends DefaultUser {
        role?: string;
        azureId?: string;
    }

    interface Session {
        user: {
            id: string;
            role: string;
            azureId: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        userId?: string;
        role?: string;
        azureId?: string;
    }
}
