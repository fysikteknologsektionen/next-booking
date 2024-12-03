'use client'
import DocumentLink from "@/components/documentLink";
import { isManager } from "@/lib/helper";
import { Heading, Link, ListItem, OrderedList, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";

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
                <Heading as="h1" size="2xl" marginTop="2rem" marginBottom="0.5em">Allmän information</Heading>
            </div>

            <HowToCreateReservationSection />

            <div>
                <Heading as="h2" size="lg" marginBottom="0.5em">Vad har förändrats?</Heading>
                <Text>Målet med det nya bokningssystemet är att slippa Exceldokumentet som användes som databas och alla buggar som uppkom när dokumentet ändrades manuellt. För den som bokar Focus är det likt det gamla bokningssystemet förutom några förändringar:</Text>
                <UnorderedList>
                    <ListItem>Arrangemangstyp väljs utifrån färdiga kategorier istället för ett textfält.</ListItem>
                    <ListItem>Ett extra fält för beskrivning av arrangemanget har lagts till.</ListItem>
                    <ListItem>Det finns inga bokningstyper som bestämmer tiden utan tider matar man in själv.</ListItem>
                    <ListItem>Det går att göra stående bokningar som återkommer varje vecka eller varje månad (samma datum varje månad).</ListItem>
                </UnorderedList>

                {isManager(session) && (
                    <>
                        <br />

                        <Text>Som admin godkänner och nekar du bokningar från <Link href="/">startsidan</Link>. Du kan även ändra bokningar innan eller efter de har blivit godkända.</Text>
                    </>
                )}
            </div>

            <div>
                <Heading as="h2" size="lg" marginBottom="0.5em">Bokningsregler</Heading>
                <Text>Alla arrangemang måste anmälas minst två dagar i förväg. Information om hur du gör detta finner du på sidan om <Text as="b"><Link href="https://ftek.se/festanmalan/" color="teal" isExternal>Anmälan av arrangemang</Link></Text>. Vid slutet av bokningen ska ni vara klara för avsyning.</Text>
            
                <br/>

                <Text>Följande regler gäller om inget annat är överenskommet med Rustmästare/Hilbertansvarig:</Text>
                <UnorderedList>
                    <ListItem>Som GU-student kan du bara boka Focus bardel på helgen.</ListItem>
                    <ListItem>Som Fysikteknologsförening eller phaddergrupp kan du bara boka Hilbert på helgen.</ListItem>
                    <ListItem>Gällande hyra debiteras + deposition för otillräcklig städning eller skada på lokalen.</ListItem>
                </UnorderedList>

                <br />

                <Text>Följande tider gäller:</Text>
                <UnorderedList>
                    <ListItem>På vardagar kan Focus bokas 08:00 till 12:00, 12:00 till 17:00 samt 17:00 till senast 03:00.</ListItem>
                    <ListItem>På helger gäller alla bokningar under hela dagen.</ListItem>
                </UnorderedList>
            </div>

            <div>
                <Heading as="h2" size="lg" marginBottom="0.5em">Kostnader</Heading>
                <Text>När du bokar Focus tillkommer en kostnad enligt <Text as="b">hyreskontraktet</Text> för att använda möblerna som går till att täcka slitage- och underhållskostnad samt en deposition som återbetalas enligt <Text as="b">städ- och depositionslistan</Text>. Vid otillräcklig städning, missbruk eller skada på lokalen debiteras motsvarande kostnad från depositionen.</Text>
            
                <DocumentLink href="/assets/Hyreskontrakt för Focus.pdf" name="Hyreskontrakt 2024/2025.pdf"></DocumentLink>
                <DocumentLink href="/assets/Städ- och depostitionslista för Focus.pdf" name="Städ- och depositionslista 2024/2025.pdf"></DocumentLink>
            </div>

            <div>
                <Heading as="h2" size="lg" marginBottom="0.5em">Inte sektionsmedlem?</Heading>
                <Text>Kontakta Rustmästaren på <Link href="mailto:dp.rust@ftek.se" fontWeight="bold" textDecoration="underline">dp.rust@ftek.se</Link> innan du bokar.</Text>
            </div>

            <FeedbackSection />
        </Stack>
        </>
    )
}

export function HowToCreateReservationSection() {
    return (
        <div>
            <Heading as="h2" size="lg" marginBottom="0.5em">Så här bokar du en lokal:</Heading>
            <OrderedList>
                <ListItem>Läs under fliken <Text as="b"><Link href="/information" color="teal">Information</Link></Text>.</ListItem>
                <ListItem>Klicka på <Text as="b"><Link href="/create" color="teal">Boka lokal</Link></Text>.</ListItem>
                <ListItem>Fyll i all information och skicka in din bokning.</ListItem>
                <ListItem><Text as="b">Klart!</Text> Din bokning ska nu synas i <Text as="b"><Link href="/" color="teal">Kalendern</Link></Text>.</ListItem>
            </OrderedList>
        </div>
    )
}

export function FeedbackSection() {
    return (
        <div>
            <Heading as="h2" size="lg" marginBottom="0.5em">Feedback</Heading>
            <Text>Har du hittat en bugg? Är det något som inte fungerar? Var det bättre förr? Har du andra synpunkter? Skicka feedback till <Link href="mailto:spidera@ftek.se" fontWeight="bold" textDecoration="underline">spidera@ftek.se</Link>!</Text>
        </div>
    )
}