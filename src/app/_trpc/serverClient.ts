import { appRouter } from "@/server/routers"
import { createContext } from "@/server/lib/trpc";

export async function getServerClient() {
    const context = await createContext()
    return appRouter.createCaller(context)
}