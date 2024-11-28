'use client'
import { Heading, Link, ListItem, OrderedList, Stack, Text, UnorderedList } from "@chakra-ui/react";

export default function Home() {
    return (
        <Stack gap="3rem">
            <div>
                <Heading as="h1" size="2xl" marginBottom="0.5em">Allmän information</Heading>
            </div>

            <div>
                <Heading as="h2" size="lg" marginBottom="0.5em">Så här bokar du en lokal</Heading>
                <OrderedList>
                    <ListItem>Klicka på <Text as="b"><Link href="/create-reservation">Boka lokal</Link></Text>.</ListItem>
                    <ListItem>Fyll i all information.</ListItem>
                    <ListItem><Text as="b">Klart!</Text> Din bokning ska nu synas i <Link href="/">kalendern</Link>.</ListItem>
                </OrderedList>
            </div>

            <div>
                <Heading as="h2" size="lg" marginBottom="0.5em">Bokningsregler</Heading>
                <Text>Alla arrangemang måste anmälas minst två dagar i förväg. Information om hur du gör detta finner du på sidan om <Link href="https://ftek.se/festanmalan/">Anmälan av arrangemang</Link>. Vid slutet av bokningen ska ni vara klara för avsyning.</Text>
            
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
                <Text>När du bokar Focus tillkommer en kostnad enligt <Link href="https://ftek.se/wp-content/uploads/2018/08/Hyreskontrakt-Focus-mobler.pdf">hyreskontraktet</Link> för att använda möblerna som går till täcka slitage- och underhållskostnad samt en deposition som återbetalas enligt <Link href="https://ftek.se/wp-content/uploads/2018/08/Stad-och-depositionslista-Focus.pdf">städ- och depositionslistan</Link>. Gällande hyra debiteras + deposition för otillräcklig städning eller skada på lokalen.</Text>
            </div>

            <div>
                <Heading as="h2" size="lg" marginBottom="0.5em">Inte sektionsmedlem?</Heading>
                <Text>Kontakta Rustmästaren på <Link href="mailto:dp.rust@ftek.se">dp.rust@ftek.se</Link> innan du bokar.</Text>
            </div>
        </Stack>
    )
}