import { Heading, Link, ListItem, OrderedList, Text } from "@chakra-ui/react";

export function HowToCreateReservationSection() {
    return (
        <div>
            <Heading as="h2" size="lg" marginBottom="0.5em">Så här bokar du en lokal:</Heading>
            <OrderedList>
                <ListItem>Läs under fliken <Text as="b"><Link href="/information" color="teal">Information</Link></Text>.</ListItem>
                <ListItem>Klicka på <Text as="b"><Link href="/create" color="teal">Boka lokal</Link></Text>.</ListItem>
                <ListItem>Fyll i all information och skicka in din bokning.</ListItem>
                <ListItem><Text as="b">Klart!</Text> Din bokning ska nu synas i <Text as="b"><Link href="/#calendar" color="teal">Kalendern</Link></Text>.</ListItem>
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