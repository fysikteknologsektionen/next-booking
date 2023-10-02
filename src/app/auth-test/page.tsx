'use client'
import LoginButton from "@/components/login-btn";
import { useSession } from "next-auth/react"

export default function AuthPage() {
    const { data: session } = useSession();

    return (
        <LoginButton />
    )
}