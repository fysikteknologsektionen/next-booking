'use client'
import DocumentLink from "@/components/documentLink";
import { Heading, Link, ListItem, OrderedList, Stack, Text, UnorderedList } from "@chakra-ui/react";

export default function Home() {
    return (
        <>
        <Stack gap="3rem" marginBottom="6rem">
            <div>
                <Heading as="h1" size="2xl" marginTop="2rem" marginBottom="0.5em">Allmän information</Heading>
            </div>

            <div>
                <Heading as="h2" size="lg" marginBottom="0.5em">Så här bokar du en lokal:</Heading>
                <OrderedList>
                    <ListItem>Läs under fliken <Text as="b"><Link href="/information" color="teal" isExternal>Information</Link></Text>.</ListItem>
                    <ListItem>Klicka på <Text as="b"><Link href="/create" color="teal" isExternal>Boka lokal</Link></Text>.</ListItem>
                    <ListItem>Fyll i all information och skicka in din bokning.</ListItem>
                    <ListItem><Text as="b">Klart!</Text> Din bokning ska nu synas i kalendern nedan.</ListItem>
                </OrderedList>
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
            </div>

            <div>
                <Heading as="h2" size="lg" marginBottom="0.5em">Kostnader</Heading>
                <Text>När du bokar Focus tillkommer en kostnad enligt <Text as="b">hyreskontraktet</Text> för att använda möblerna som går till att täcka slitage- och underhållskostnad samt en deposition som återbetalas enligt <Text as="b">städ- och depositionslistan</Text>. Vid otillräcklig städning, missbruk eller skada på lokalen debiteras motsvarande kostnad från depositionen.</Text>
            
                <DocumentLink href="/assets/Hyreskontrakt24_25.docx.pdf" name="Hyreskontrakt 2024/2025.pdf"></DocumentLink>
                <DocumentLink href="/assets/Städ_depostitionslista Focus 24_25.docx.pdf" name="Städ- och depositionslista 2024/2025.pdf"></DocumentLink>
            </div>

            <div>
                <Heading as="h2" size="lg" marginBottom="0.5em">Inte sektionsmedlem?</Heading>
                <Text>Kontakta Rustmästaren på <Link href="mailto:dp.rust@ftek.se">dp.rust@ftek.se</Link> innan du bokar.</Text>
            </div>
        </Stack>
        </>
    )
}