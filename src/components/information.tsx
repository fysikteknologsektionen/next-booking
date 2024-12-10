import { Heading, Link, List, Text } from "@chakra-ui/react";

export function HowToCreateReservationSection() {
    return (
        <div>
            <Heading as="h2" size="3xl" fontWeight="bold" marginBottom="0.5em">Så här bokar du en lokal:</Heading>
            <List.Root as="ol">
                <List.Item>Läs under fliken <Text as="b"><Link href="/information" color="teal">Information</Link></Text>.</List.Item>
                <List.Item>Klicka på <Text as="b"><Link href="/create" color="teal">Boka lokal</Link></Text>.</List.Item>
                <List.Item>Fyll i all information och skicka in din bokning.</List.Item>
                <List.Item><Text as="b">Klart!</Text> Din bokning ska nu synas i <Text as="b"><Link href="/#calendar" color="teal">Kalendern</Link></Text>.</List.Item>
            </List.Root>
        </div>
    )
}

export function FeedbackSection() {
    return (
        <div>
            <Heading as="h2" size="3xl" fontWeight="bold" marginBottom="0.5em">Feedback</Heading>
            <Text>Har du hittat en bugg? Är det något som inte fungerar? Var det bättre förr? Har du andra synpunkter? Skicka feedback till <Link href="mailto:spidera@ftek.se" fontWeight="bold" textDecoration="underline">spidera@ftek.se</Link>!</Text>
        </div>
    )
}