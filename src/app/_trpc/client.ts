import { type AppRouter } from "@/server/routers"
import { createTRPCNext } from "@trpc/next"

export const trpc =  createTRPCNext<AppRouter>({
    config: () => ({ links: [] }),
  });