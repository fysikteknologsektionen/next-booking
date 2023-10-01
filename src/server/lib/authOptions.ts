import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
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
    session({ session, token }) {
      // Attach additional fields to session
      return {
        ...session,
        user: {
          name: session.user.name,
          image: session.user.image,
          id: token.sub,
          role: token.role,
        },
      };
    },
  },
};

export default authOptions;
