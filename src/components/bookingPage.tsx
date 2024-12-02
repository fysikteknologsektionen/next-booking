"use client";

import styles from "./bookingPage.module.css";
import { closest10min, dateToInput, dateToTimeInput, formatDateShort, formatDuration, getRecurringLabel, isMailSpelledCorrectly } from "@/lib/helper";
import { createReservationClient } from "@/server/api/createReservation";
import { getReservationsClient } from "@/server/api/getreservations";
import { updateReservationClient } from "@/server/api/updateReservation";
import { CHARACTER_LIMIT } from "@/lib/helper";
import { WarningIcon } from "@chakra-ui/icons";
import { Button, Checkbox, FormControl, FormErrorIcon, FormErrorMessage, FormHelperText, FormLabel, Heading, HStack, Input, Link, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Radio, RadioGroup, Select, Spinner, Stack, Text, Textarea, useDisclosure } from "@chakra-ui/react";
import { Recurring, Reservation, ReservationType, Status, Venue } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FormEvent, FormEventHandler, useEffect, useMemo, useState } from "react";

const fromDefault = new Date();
fromDefault.setSeconds(0, 0);

const toDefault = new Date(fromDefault);
toDefault.setHours(toDefault.getHours() + 1);

const recurringUntilDefault = new Date(fromDefault);
recurringUntilDefault.setFullYear(recurringUntilDefault.getFullYear() + 1);

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
        clientCommittee: null,
        clientEmail: "",
        clientDescription: "",
        type: ReservationType.PREPARATION,
        startTime: fromDefault,
        endTime: toDefault,
        venueId: "",
        status: Status.PENDING,
        recurring: Recurring.NEVER,
        recurringUntil: recurringUntilDefault
    }

    const [venue, setVenue] = useState<string>(defaultReservationData.venueId?.toString()??"")
    const [name, setName] = useState(defaultReservationData.clientName)
    const [committee, setCommittee] = useState(defaultReservationData.clientCommittee)
    const [email, setEmail] = useState(defaultReservationData.clientEmail)
    const [reservationType, setReservationType] = useState(defaultReservationData.type)
    const [description, setDescription] = useState(defaultReservationData.clientDescription)
    
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

    // Recurring reservation
    const [recurring, setRecurring] = useState(defaultReservationData.recurring);
    const [recurringUntilDateString, setRecurringUntilDateString] = useState(dateToInput(new Date(defaultReservationData.recurringUntil ?? recurringUntilDefault), false));
    const recurringUntil = useMemo(() => new Date(recurringUntilDateString), [ recurringUntilDateString ]);

    const [status, setStatus] = useState(defaultReservationData.status);

    const [showErrors, setShowErrors] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const { isOpen, onOpen, onClose } = useDisclosure();

    const submit = (forceCreate = false) => {
        const f = async (e?: FormEvent<HTMLFormElement>) => {
            e?.preventDefault()

            setShowErrors(true);

            if (duration.valueOf() <= 0) {
                console.error("> 0min pls")
                return;
            }
            if (description.length > CHARACTER_LIMIT.description) {
                return;
            }
            if (committee && committee.length > CHARACTER_LIMIT.comittee) {
                return;
            }
            if (name.length > CHARACTER_LIMIT.name) {
                return;
            }

            setLoading(true);

            if (!forceCreate && !reservation) {
                const reservations = await getReservationsClient(from, to, [parseInt(venue)]);
                //console.log(reservations)
                if (reservations && reservations.filter((val: any) => (
                    val.status === Status.ACCEPTED &&
                    // Remove edge cases where startTime of one = endTime of other
                    new Date(val.startTime).valueOf() < to.valueOf() &&
                    new Date(val.endTime).valueOf() > from.valueOf()
                )).length > 0) {
                    console.error('Overlapping reservation');
                    setLoading(false);
                    onOpen();

                    return;
                }
            }

            // Collect all reservation details
            const reservationDetails = {
                clientName: name,
                clientCommittee: committee,
                clientEmail: email,
                clientDescription: description,
                type: reservationType,
                venueId: parseInt(venue),
                date: from,
                startTime: from,
                endTime: to,
                recurring: recurring,
                recurringUntil: recurringUntil
            }

            // Make POST fetch request using the data
            let result;
            if (reservation) {
                const reservationDetailsWithID = {
                    ...reservationDetails,
                    reservationID: reservation.id,
                    status: status,
                }
                result = await updateReservationClient(reservationDetailsWithID)
            } else {
                result = await createReservationClient(reservationDetails);
            }

            if (result) {
                router.push("/");
            } else {
                setLoading(false);
            }
        }

        return f;
    }

    return (
        <>
            <Heading marginBottom="0.5em">Boka lokal</Heading>
            <Text marginBottom="1em">Läs noga igenom <Text as="b"><Link href="/information" color="teal" isExternal>Informationen</Link></Text> innan du bokar!</Text>
            
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
                    <FormLabel>Namn på bokningsansvarig</FormLabel>
                    <Input
                        placeholder="Ditt namn"
                        maxLength={CHARACTER_LIMIT.name}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    ></Input>
                    <FormErrorMessage>Error</FormErrorMessage>
                </FormControl>

                <FormControl>
                    <FormLabel>Kommitté/förening</FormLabel>
                    <Input
                        placeholder="Namn på kommitté/förening"
                        maxLength={CHARACTER_LIMIT.comittee}
                        value={committee ?? ""}
                        onChange={e => setCommittee(e.target.value)}
                    ></Input>
                    <FormErrorMessage>Error</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!isMailSpelledCorrectly(email)}>
                    <FormLabel>E-post</FormLabel>
                    <Input
                        type="email"
                        placeholder="namn@stavaintefel.se"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    ></Input>
                    <FormErrorMessage color="orange.400">Din e-post kan vara felstavad!</FormErrorMessage>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Typ av arrangemang</FormLabel>
                    <RadioGroup onChange={(value) => {
                        setReservationType(value as ReservationType);
                    }} value={reservationType}>
                        <div className={styles.radioStack}>
                            <Radio value={ReservationType.PREPARATION}>Förberedelser</Radio>
                            <Radio value={ReservationType.SITTING}>Sittning</Radio>
                            <Radio value={ReservationType.PUB}>Pub</Radio>
                            <Radio value={ReservationType.PERFORMANCE}>Föreställning</Radio>
                            <Radio value={ReservationType.OTHER}>Övrigt</Radio>
                        </div>
                    </RadioGroup>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Beskrivning</FormLabel>
                    <Textarea
                        placeholder="Beskriv varför du bokar lokalen och annat som kan vara bra att veta"
                        maxLength={500}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    ></Textarea>
                    <FormHelperText>{description.length}/{CHARACTER_LIMIT.description} tecken</FormHelperText>
                </FormControl>

                <div className={styles.timeStack}>
                    <div>
                        <FormControl isRequired>
                            <FormLabel>Från</FormLabel>
                            <Stack>
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
                            </Stack>
                        </FormControl>
                    </div>

                    <div>
                        <FormControl isRequired isInvalid={showErrors && duration.valueOf() <= 0}>
                            <FormLabel>Till</FormLabel>
                            <Stack>
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
                            </Stack>
                            <FormHelperText>Obs! Vid denna tiden ska ni vara klara för avsyning</FormHelperText>
                            <FormErrorMessage>Sluttid måste vara efter starttid</FormErrorMessage>
                        </FormControl>
                    </div>
                </div>

                <FormControl isRequired>
                    <FormLabel>Stående bokning</FormLabel>
                    <FormHelperText>Denna bokning återkommer:</FormHelperText>
                    <RadioGroup onChange={(value) => {
                        setRecurring(value as Recurring);
                    }} value={recurring}>
                        <div className={styles.radioStack}>
                            {Object.keys(Recurring).map((key) => {
                                return <Radio key={key} value={key}>{getRecurringLabel(key as Recurring)}</Radio>
                            })}
                        </div>
                    </RadioGroup>
                </FormControl>

                {recurring !== Recurring.NEVER && (
                    <FormControl isRequired isInvalid={showErrors && recurringUntil.valueOf() <= to.valueOf()}>
                        <FormLabel>Stående till</FormLabel>
                        <Stack>
                            <Input
                                type="date"
                                value={recurringUntilDateString}
                                onChange={e => setRecurringUntilDateString(e.target.value)}
                            ></Input>
                        </Stack>
                        <FormHelperText>Bokningen återkommer till och med denna dag</FormHelperText>
                        <FormErrorMessage>Tiden måste vara efter sluttid på bokningen</FormErrorMessage>
                    </FormControl>
                )}

                {/* <FormControl>
                    <FormLabel>Jag vill få mail när min bokning godkänns/nekas</FormLabel>
                    <Checkbox defaultChecked></Checkbox>
                </FormControl> */}

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

                <Heading marginTop="1em" size="lg">Granska bokning</Heading>

                {venue == "" ? (
                    <Text>Välj en lokal först</Text>
                ) : duration.valueOf() <= 0 ? (
                    <Text>Sluttid måste vara efter starttid!</Text>
                ) : (
                    <Text>Jag vill boka {venues.find(v => v.id.toString() === venue)?.name} i {formatDuration(duration)}.{recurring !== Recurring.NEVER && (" Bokningen återkommer " + getRecurringLabel(recurring).toLowerCase() + " fram till " + formatDateShort(recurringUntil) + ".")}</Text>
                )}

                <HStack>
                    <Button
                        type="submit"
                        isDisabled={isLoading || venue == "" || duration.valueOf() <= 0}
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
                        Denna bokningen överlappar befintliga bokningar och kommer automatiskt att nekas. Vill du boka ändå? (bokningen kommer då inte visas i kalendern)
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
                </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}