import type { NextAuthOptions } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { PrismaAdapter } from "@next-auth/prisma-adapter";

import prisma from "@/lib/prisma";

function getOptionalProvider(provider: "github" | "google") {
  if (provider === "github") {
    const clientId = process.env.GITHUB_ID;
    const clientSecret = process.env.GITHUB_SECRET;
    if (!clientId || !clientSecret) return null;
    return Github({ clientId, clientSecret });
  }

  const clientId = process.env.GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_SECRET;
  if (!clientId || !clientSecret) return null;
  return Google({ clientId, clientSecret });
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [getOptionalProvider("github"), getOptionalProvider("google")].filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  ),
  callbacks: {
    async jwt({ token }) {
      if (token.sub) {
        token.userId = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      const userId = token.userId;
      if (typeof userId === "string") {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });
        session.user = {
          ...session.user,
          id: userId,
          username: user?.username ?? undefined,
        };
      }
      return session;
    },
  },
} satisfies NextAuthOptions;
