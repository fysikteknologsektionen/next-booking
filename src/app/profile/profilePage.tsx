"use client";

import { Button, Text } from "@chakra-ui/react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function ProfilePage() {
    const { data:session } = useSession();

    if (session) {
        return (
            <div>
                <Text>Inloggad som {session.user.name}</Text>
                <Button onClick={() => signOut()}>Logga ut</Button>
            </div>
        )
    }

    return (
        <div>
            <Text>Inte inloggad</Text>
            <Button onClick={() => signIn()}>Logga in</Button>
        </div>
    )
}