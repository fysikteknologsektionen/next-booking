'use client'
import LoginButton from "@/components/login-btn";
import { useSession } from "next-auth/react"
import { trpc } from "../_trpc/client";

export default function AuthPage() {
    const { data: session } = useSession();


    const getData = trpc.getData.useQuery()
  
    const setData = trpc.setData.useMutation({
        // your react-query properties ...
    })
    return (
        <main>
            <LoginButton />
            <div>{getData.data}</div>
            <div>{setData.data}</div>
        </main>
        
    )
}