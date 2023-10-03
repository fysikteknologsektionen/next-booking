import authOptions from "./authOptions";
import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { httpBatchLink } from "@trpc/client"
import config from "./config";

export async function createContext() {
  const session = await getServerSession(
    authOptions
  );
  // Adds URL for React Server Components to work
  const url = httpBatchLink({
    url: `${config.APP_URL}/api/trpc`,
  })
  return {
    session,
    links: [url],
  };
}

const t = initTRPC.context<typeof createContext>().create();

export const { router, procedure: publicProcedure } = t;

const requireRole = (role: Role) =>
  t.middleware(({ next, ctx }) => {
    if (!ctx.session || ctx.session.user.role < role) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({
      ctx: {
        session: ctx.session,
      },
    });
  });

export const managerProcedure = publicProcedure.use(requireRole("MANAGER"));
export const adminProcedure = publicProcedure.use(requireRole("ADMIN"));
