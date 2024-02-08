import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/server/lib/prisma";
import config from "./config";

/**
 * Options object for `next-auth`
 */
const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: config.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: config.GOOGLE_OAUTH_CLIENT_SECRET,
    }),
  ],
  debug: false,
  callbacks: {
    async jwt({ token, user: googleUser, account }) {
      // Evaluates to false on initial login only
      if (!googleUser || !account) {
        // Return existing token
        return token;
      }

      if (!googleUser.name || !googleUser.email) {
        throw Error("Malformed user response from Google.");
      }

      // Update local user data
      const localUser = await prisma.user.upsert({
        where: { googleId: googleUser.id },
        update: {
          name: googleUser.name,
          email: googleUser.email,
          image: googleUser.image,
        },
        create: {
          googleId: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          image: googleUser.image,
        },
      });

      // Create a new token
      return {
        sub: localUser.id,
        name: localUser.name,
        image: localUser.image ?? undefined,
        role: localUser.role,
      };
    },
    async session({ session, token }) {
      // Attach additional fields to session
      const localUser = await prisma.user.findFirst({where: { id: token.sub }})
      return {
        ...session,
        user: {
          name: session.user.name,
          image: localUser?.image,
          id: token.sub,
          role: token.role,
        },
      };
    },
  },
};

export default authOptions;
