"use client";

import { dateToInput, formatDuration } from "@/lib/helper";
import { Button, FormControl, FormErrorMessage, FormLabel, Heading, HStack, Input, Select, Text, Textarea } from "@chakra-ui/react";
import { Venue } from "@prisma/client";
import { FormEventHandler, useEffect, useMemo, useState } from "react";

const fromDefault = new Date();
fromDefault.setSeconds(0, 0);

const toDefault = new Date(fromDefault);
toDefault.setHours(toDefault.getHours() + 1);

export default function BookingPage({
    venues
}: {
    venues: Venue[]
}) {
    const [venue, setVenue] = useState("")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [description, setDescription] = useState("")
    const [from, setFrom] = useState(fromDefault)
    const [to, setTo] = useState(toDefault)
    const duration = useMemo(() => new Date(
        to.valueOf() -
        from.valueOf()
    ), [ from, to ]);
    const [showErrors, setShowErrors] = useState(false);
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        console.log(venue)
    }, [ venue ]);

    const submit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault()

        if (duration.valueOf() <= 0) {
            console.error("> 0min pls")
            return;
        }

        setShowErrors(true);
        setLoading(true);

        const rawResponse = await fetch('/api/createReservation', {
            method: 'POST',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientName: name,
                clientEmail: email,
                clientDescription: description,
                startTime: from,
                endTime: to,
                venueId: venue
            })
        });
        const content = await rawResponse.json();
        console.log(content);

        console.log("done")

        setLoading(false);
    }

    return (
        <main style={{ padding: "2rem" }}>
            <Heading>Boka lokal</Heading>
            
            <form onSubmit={submit}>
                <FormControl isRequired>
                    <FormLabel>Lokal</FormLabel>
                    <Select
                        placeholder='Välj lokal'
                        value={venue}
                        onChange={e => setVenue(e.target.value)}
                    >
                        {venues.map(venue => {
                            return (
                                <option key={venue.id} value={venue.id}>{venue.name}</option>
                            )
                        })}
                    </Select>
                    <FormErrorMessage>Error</FormErrorMessage>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Namn</FormLabel>
                    <Input
                        placeholder="Mitt namn"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    ></Input>
                    <FormErrorMessage>Testaaa</FormErrorMessage>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>E-post</FormLabel>
                    <Input
                        type="email"
                        placeholder="exempel@mail.se"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    ></Input>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Beskrivning</FormLabel>
                    <Textarea
                        placeholder="test"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    ></Textarea>
                </FormControl>

                <HStack alignItems="flex-start">
                    <div style={{ flex: 1 }}>
                        <FormControl isRequired>
                            <FormLabel>Från</FormLabel>
                            <Input
                                type="datetime-local"
                                value={dateToInput(from)}
                                onChange={e => setFrom(new Date(e.target.value))}
                            ></Input>
                        </FormControl>
                    </div>

                    <div style={{ flex: 1 }}>
                        <FormControl isRequired isInvalid={showErrors && duration.valueOf() <= 0}>
                            <FormLabel>Till</FormLabel>
                            <Input
                                type="datetime-local"
                                value={dateToInput(to)}
                                onChange={e => setTo(new Date(e.target.value))}
                            ></Input>
                            <FormErrorMessage>Sluttid måste vara efter starttid</FormErrorMessage>
                        </FormControl>
                    </div>
                </HStack>

                {venue !== "" && duration.valueOf() > 0 && (
                    <Text>Jag vill boka {venues.find(v => v.id.toString() === venue)?.name} i {formatDuration(duration)}</Text>
                )}

                <Button
                    type="submit"
                    isDisabled={isLoading}
                >Skapa bokning</Button>
            </form>
        </main>
    )
}

function Field({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <div style={{
            marginBottom: "1.5rem",
        }}>
            {children}
        </div>
    )
}