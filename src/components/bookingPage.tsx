"use client";

import { dateToInput, dateToTimeInput, formatDuration, isMailSpelledCorrectly } from "@/lib/helper";
import { createReservationClient } from "@/server/api/createReservation";
import { getReservationsClient } from "@/server/api/getreservations";
import { updateReservationClient } from "@/server/api/updateReservation";
import { WarningIcon } from "@chakra-ui/icons";
import { Button, FormControl, FormErrorIcon, FormErrorMessage, FormLabel, Heading, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Spinner, Text, Textarea, useDisclosure } from "@chakra-ui/react";
import { Reservation, Status, Venue } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FormEvent, FormEventHandler, useEffect, useMemo, useState } from "react";

const fromDefault = new Date();
fromDefault.setSeconds(0, 0);

const toDefault = new Date(fromDefault);
toDefault.setHours(toDefault.getHours() + 1);

export default function BookingPage({
    venues, reservation
}: {
    venues: Venue[],
    reservation?: Reservation
}) {
    const isUpdating = !!reservation;

    const router = useRouter();
    const defaultReservationData = reservation ? reservation : {
        clientName: "",
        clientEmail: "",
        clientDescription: "",
        startTime: fromDefault,
        endTime: toDefault,
        venueId: "",
        status: Status.PENDING
    }

    const [venue, setVenue] = useState<string>(defaultReservationData.venueId?.toString()??"")
    const [name, setName] = useState(defaultReservationData.clientName)
    const [email, setEmail] = useState(defaultReservationData.clientEmail)
    const [description, setDescription] = useState(defaultReservationData.clientDescription??"")
    
    const [fromDateString, setFromDateString] = useState(dateToInput(new Date(defaultReservationData.startTime), false));
    const [fromTimeString, setFromTimeString] = useState(dateToTimeInput(new Date(defaultReservationData.startTime)));

    const [toDateString, setToDateString] = useState(dateToInput(new Date(defaultReservationData.endTime), false));
    const [toTimeString, setToTimeString] = useState(dateToTimeInput(new Date(defaultReservationData.endTime)));
    
    const from = useMemo(() => new Date(fromDateString + "T" + fromTimeString), [ fromDateString, fromTimeString ]);
    const to = useMemo(() => new Date(toDateString + "T" + toTimeString), [ toDateString, toTimeString ]);

    // const [from, setFrom] = useState(new Date(defaultReservationData.startTime))
    // const [to, setTo] = useState(new Date(defaultReservationData.endTime))

    const duration = useMemo(() => new Date(
        to.valueOf() -
        from.valueOf()
    ), [ from, to ]);

    const [status, setStatus] = useState(defaultReservationData.status);

    const [showErrors, setShowErrors] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        console.log(venue)
    }, [ venue ]);

    const submit = (forceCreate = false) => {
        const f = async (e?: FormEvent<HTMLFormElement>) => {
            e?.preventDefault()

            setShowErrors(true);

            if (duration.valueOf() <= 0) {
                console.error("> 0min pls")
                return;
            }

            setLoading(true);

            if (!forceCreate && !reservation) {
                const reservations = await getReservationsClient(from, to, [parseInt(venue)]);
                if (reservations && reservations.filter((val: any) => val.status === Status.ACCEPTED).length > 0) {
                    console.error('Overlapping reservation');
                    setLoading(false);
                    onOpen();

                    return;
                }
            }

            // Collect all reservation details
            const reservationDetails = {
                clientName: name,
                clientEmail: email,
                clientDescription: description,
                venueId: parseInt(venue),
                date: from,
                startTime: from,
                endTime: to,
            }

            // Make POST fetch request using the data
            if (reservation) {
                const reservationDetailsWithID = {
                    ...reservationDetails,
                    reservationID: reservation.id,
                    status: status,
                }
                await updateReservationClient(reservationDetailsWithID)
            } else {
                await createReservationClient(reservationDetails);
            }

            router.push("/");
        }

        return f;
    }

    return (
        <>
            <Heading marginBottom="0.5em">Boka lokal</Heading>
            
            <form onSubmit={submit(false)} style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                maxWidth: "600px"
            }}>
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

                <FormControl isRequired isInvalid={!isMailSpelledCorrectly(email)}>
                    <FormLabel>E-post</FormLabel>
                    <Input
                        type="email"
                        placeholder="exempel@mail.se"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    ></Input>
                    <FormErrorMessage color="orange.400">Din e-post kan vara felstavad!</FormErrorMessage>
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
                                type="date"
                                value={fromDateString}
                                onChange={e => setFromDateString(e.target.value)}
                            ></Input>
                            <Input
                                type="time"
                                value={fromTimeString}
                                onChange={e => setFromTimeString(e.target.value)}
                            ></Input>
                        </FormControl>
                    </div>

                    <div style={{ flex: 1 }}>
                        <FormControl isRequired isInvalid={showErrors && duration.valueOf() <= 0}>
                            <FormLabel>Till</FormLabel>
                            <Input
                                type="date"
                                value={toDateString}
                                onChange={e => setToDateString(e.target.value)}
                            ></Input>
                            <Input
                                type="time"
                                value={toTimeString}
                                onChange={e => setToTimeString(e.target.value)}
                            ></Input>
                            {/* <Input
                                type="datetime-local"
                                value={dateToInput(to)}
                                onChange={e => setTo(new Date(e.target.value))}
                            ></Input> */}
                            <FormErrorMessage>Sluttid måste vara efter starttid</FormErrorMessage>
                        </FormControl>
                    </div>
                </HStack>

                {isUpdating && (
                    <FormControl isRequired>
                        <FormLabel>Status</FormLabel>
                        <Select
                            placeholder=''
                            value={status}
                            onChange={e => setStatus(e.target.value as Status)}
                        >
                            {Object.keys(Status).map(statusKey => {
                                return (
                                    <option key={statusKey} value={statusKey}>{statusKey}</option>
                                )
                            })}
                        </Select>
                        <FormErrorMessage>Error</FormErrorMessage>
                    </FormControl>
                )}

                {venue !== "" && duration.valueOf() > 0 && (
                    <Text>Jag vill boka {venues.find(v => v.id.toString() === venue)?.name} i {formatDuration(duration)}</Text>
                )}

                <HStack>
                    <Button
                        type="submit"
                        isDisabled={isLoading}
                        colorScheme="blue"
                    >
                        {isUpdating ? "Uppdatera bokning" : "Skapa bokning"}
                    </Button>

                    {isLoading && (
                        <Spinner></Spinner>
                    )}
                </HStack>
            </form>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                <ModalHeader>Överlappande bokning</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text>
                        Denna bokningen överlappar befintliga bokningar och kommer automatiskt att nekas. Vill du boka ändå?
                    </Text>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme='blue' mr={3} onClick={onClose}>
                        Avbryt
                    </Button>
                    <Button variant='ghost' colorScheme='red' mr={3} onClick={() => {
                        submit(true)();
                        onClose();
                    }}>
                        Boka ändå
                    </Button>
                    {/* <Button variant='ghost'>Secondary Action</Button> */}
                </ModalFooter>
                </ModalContent>
            </Modal>
        </>
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