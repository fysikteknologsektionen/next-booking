'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { VStack, Text } from "@chakra-ui/react";

export default function LoginPage() {
    const { data:session } = useSession();
    const router = useRouter();

    useEffect(() => {
        session ? router.push('/') : router.push('/profile');
    });

    return (
        <>
            {session ? (<VStack>
                Du är redan inloggad. Går till startsidan...
            </VStack>) : (<VStack>
                <p>En profil krävs <Text as="b">INTE</Text> för att boka lokal.</p>
            </VStack>)}
        </>
    )
}