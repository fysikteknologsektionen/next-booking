import { publicProcedure, router } from "./lib/trpc";


export const appRouter = router({
    getData: publicProcedure.query(async () => {
        // Here you would fetch data from a database in a real-life application
    })
})