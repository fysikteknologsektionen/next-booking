'use client'
import { SessionProvider } from "next-auth/react"
import { trpc } from "../_trpc/client"

const AuthLayout = ({
    children, session
}:{
    children:React.ReactNode, session:any
}) => {
    return (
        <SessionProvider session={session}>
            {children}
        </SessionProvider>
    )
}

export default trpc.withTRPC(AuthLayout)