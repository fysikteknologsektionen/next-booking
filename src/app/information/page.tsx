'use client'
import DocumentLink from "@/components/documentLink";
import { isManager } from "@/lib/helper";
import { Heading, Link, List, Stack, Text } from "@chakra-ui/react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { HowToCreateReservationSection, FeedbackSection } from "@/components/information";

export default function Home() {
    const [session, setSession] = useState<Session | null>();
    useEffect(() => {
        (async () => {
          setSession(await getSession());
        })()
    }, []);

    return (
        <>
        <Stack gap="3rem" marginBottom="6rem">
            <div>
                <Heading as="h1" size="5xl" fontWeight="bold" marginTop="2rem" marginBottom="0.5em">Allmän information</Heading>
            </div>

            <HowToCreateReservationSection />

            <div>
                <Heading as="h2" size="3xl" fontWeight="bold" marginBottom="0.5em">Vad har förändrats?</Heading>
                <Text>Målet med det nya bokningssystemet är att slippa Exceldokumentet som användes som databas och alla buggar som uppkom när dokumentet ändrades manuellt. För den som bokar Focus är det likt det gamla bokningssystemet förutom några förändringar:</Text>
                <List.Root>
                    <List.Item>Arrangemangstyp väljs utifrån färdiga kategorier istället för ett textfält.</List.Item>
                    <List.Item>Ett extra fält för beskrivning av arrangemanget har lagts till.</List.Item>
                    <List.Item>Det finns inga bokningstyper som bestämmer tiden utan tider matar man in själv.</List.Item>
                    <List.Item>Det går att göra stående bokningar som återkommer varje vecka eller varje månad (samma datum varje månad).</List.Item>
                </List.Root>

                {isManager(session) && (
                    <>
                        <br />

                        <Text>Som admin godkänner och nekar du bokningar från <Link href="/">startsidan</Link>. Du kan även ändra bokningar innan eller efter de har blivit godkända.</Text>
                    </>
                )}
            </div>

            <div>
                <Heading as="h2" size="3xl" fontWeight="bold" marginBottom="0.5em">Bokningsregler</Heading>
                <Text>Alla arrangemang måste anmälas minst två dagar i förväg. Information om hur du gör detta finner du på sidan om <Text as="b"><Link href="https://ftek.se/festanmalan/" color="teal" target="_blank" rel="noopener noreferrer">Anmälan av arrangemang</Link></Text>. Vid slutet av bokningen ska ni vara klara för avsyning.</Text>
            
                <br/>

                <Text>Följande regler gäller om inget annat är överenskommet med Rustmästare/Hilbertansvarig:</Text>
                <List.Root>
                    <List.Item>Som GU-student kan du bara boka Focus bardel på helgen.</List.Item>
                    <List.Item>Som Fysikteknologsförening eller phaddergrupp kan du bara boka Hilbert på helgen.</List.Item>
                    <List.Item>Gällande hyra debiteras + deposition för otillräcklig städning eller skada på lokalen.</List.Item>
                </List.Root>

                <br />

                <Text>Följande tider gäller:</Text>
                <List.Root>
                    <List.Item>På vardagar kan Focus bokas 08:00 till 12:00, 12:00 till 17:00 samt 17:00 till senast 03:00.</List.Item>
                    <List.Item>På helger gäller alla bokningar under hela dagen.</List.Item>
                </List.Root>
            </div>

            <div>
                <Heading as="h2" size="3xl" fontWeight="bold" marginBottom="0.5em">Kostnader</Heading>
                <Text>När du bokar Focus tillkommer en kostnad enligt <Text as="b">hyreskontraktet</Text> för att använda möblerna som går till att täcka slitage- och underhållskostnad samt en deposition som återbetalas enligt <Text as="b">städ- och depositionslistan</Text>. Vid otillräcklig städning, missbruk eller skada på lokalen debiteras motsvarande kostnad från depositionen.</Text>
            
                <DocumentLink href="/assets/Hyreskontrakt för Focus.pdf" name="Hyreskontrakt 2024/2025.pdf"></DocumentLink>
                <DocumentLink href="/assets/Städ- och depostitionslista för Focus.pdf" name="Städ- och depositionslista 2024/2025.pdf"></DocumentLink>
            </div>

            <div>
                <Heading as="h2" size="3xl" fontWeight="bold" marginBottom="0.5em">Frågor?</Heading>
                <Text>Vid frågor kontakta Rustmästaren på <Link href="mailto:dp.rust@ftek.se" fontWeight="bold" textDecoration="underline">dp.rust@ftek.se</Link>.</Text>
            </div>

            <FeedbackSection />
        </Stack>
        </>
    )
}
