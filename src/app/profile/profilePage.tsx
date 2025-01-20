"use client";

import { Button, Heading, Text, VStack } from "@chakra-ui/react";
import { Role } from "@prisma/client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function ProfilePage() {
    const { data:session } = useSession();

    return (
        <>
            <VStack gap="2rem" align="start">
                <div>
                    <Heading as="h2">Profil</Heading>
                    <p>En profil krävs <Text as="b">INTE</Text> för att boka lokal.</p>
                </div>

                {session ? (
                    <VStack gap="1rem" align="start">
                        <div>
                            <Text>Inloggad som {session.user.name}</Text>
                            <Text>Roll: {Role[session.user.role]}</Text>
                        </div>

                        <Button onClick={() => signOut()}>Logga ut</Button>
                    </VStack>
                ) : (
                    <VStack gap="1rem" align="start">
                        <Button onClick={() => signIn()}>Logga in</Button>
                    </VStack>
                )}
            </VStack>
        </>
    )
}