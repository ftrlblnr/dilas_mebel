import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { verifyCredentials, getUserActiveStatus } from "@/lib/users-server";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        return verifyCredentials(email, password);
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/crm/login" },
  trustHost: true,
  callbacks: {
    authorized: ({ auth: session }) => !!session?.user?.id,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (token.id) {
        const active = await getUserActiveStatus(token.id as string);
        if (!active) return { ...token, id: undefined, role: undefined };
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && token.role) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "MANAGER";
      } else {
        // token was invalidated (deactivated user) — strip session identity
        session.user.id = "";
      }
      return session;
    },
  },
});

export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/crm");
  return session;
}

/** For API routes: use instead of requireAdmin(), which redirect()s and isn't meaningful for JSON responses. */
export async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}
