"use client";

import styles from "./bookingPage.module.css";
import { dateToInputUTC, dateToTimeInputUTC, dateToInput, dateToTimeInput, formatDateShort, formatDuration, getRecurringLabel, getStatusLabel, getUserEmail, isMailSpelledCorrectly } from "@/lib/helper";
import { createReservationClient } from "@/server/api/createReservation";
import { getReservationsClient } from "@/server/api/getreservations";
import { updateReservationClient } from "@/server/api/updateReservation";
import { CHARACTER_LIMIT } from "@/lib/helper";
import { Button, createListCollection, Heading, HStack, Input, Link, Spinner, Stack, Text, Textarea } from "@chakra-ui/react";
import { Recurring, Reservation, ReservationType, Status, Venue } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Field } from "./ui/field";
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from "./ui/select";
import { Radio, RadioGroup } from "./ui/radio";
import {
    DialogActionTrigger,
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { checkOverlapClient } from "@/server/api/checkReservationOverlap";
import { toaster } from "./ui/toaster";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const fromDefault = new Date();
fromDefault.setSeconds(0, 0);

const toDefault = (fromDefault: Date) => {
    const d = new Date(fromDefault);
    d.setHours(d.getHours() + 1);
    return d;
}

const recurringUntilDefault = new Date(fromDefault);
recurringUntilDefault.setFullYear(recurringUntilDefault.getFullYear() + 1);

export default function BookingPage({
    venues, reservation
}: {
    venues: Venue[],
    reservation?: Reservation
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const query = {
        startTime: searchParams.get("startTime"),
        endTime: searchParams.get("endTime"),
        clientEmail: searchParams.get("clientEmail"),
        clientName: searchParams.get("clientName"),
    };
    const defaultStartTime = query.startTime ? new Date(query.startTime) : fromDefault;
    const defaultEndTime = query.endTime ? new Date(query.endTime) : toDefault(defaultStartTime);
    const defaultClientEmail = query.clientEmail ?? "";
    const defaultClientName = query.clientName ?? "";

    const isUpdating = !!reservation;
    const defaultReservationData = reservation ?
        reservation :
        {
            clientName: defaultClientName,
            clientCommittee: null,
            clientEmail: defaultClientEmail,
            clientDescription: "",
            type: ReservationType.PREPARATION,
            startTime: defaultStartTime,
            endTime: defaultEndTime,
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
    
    const [fromDateString, setFromDateString] = useState(dateToInputUTC(new Date(defaultReservationData.startTime), false));
    const [fromTimeString, setFromTimeString] = useState(dateToTimeInputUTC(new Date(defaultReservationData.startTime)));

    const [toDateString, setToDateString] = useState(dateToInputUTC(new Date(defaultReservationData.endTime), false));
    const [toTimeString, setToTimeString] = useState(dateToTimeInputUTC(new Date(defaultReservationData.endTime)));
    
    const swedishFrom = fromDateString + "T" + fromTimeString;
    const swedishTo = toDateString + "T" + toTimeString;

    const from = useMemo(() => new Date(swedishFrom), [ swedishFrom]);
    const to = useMemo(() => new Date(swedishTo), [swedishTo]);

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

    const [isOpen, setOpen] = useState(false);

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
                const isOverlapping = await checkOverlapClient(swedishFrom, swedishTo, venue);
                if (isOverlapping) {
                    console.error('Overlapping reservation');
                    setLoading(false);
                    setOpen(true);

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
                date: swedishFrom,
                startTime: swedishFrom,
                endTime: swedishTo,
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
                const errorMessage = reservation ?
                    "Kunde inte uppdatera bokningen. Försök igen senare eller kontakta spidera@ftek.se" :
                    "Kunde inte skapa bokningen. Försök igen senare eller kontakta spidera@ftek.se";
                toaster.create({
                    title: errorMessage,
                    type: "error",
                });
                setLoading(false);
            }
        }

        return f;
    }

    const venueList = createListCollection({
        items: venues.map(v => (
            { label: v.name, value: v.id.toString() }
        ))
    });

    const statusList = createListCollection({
        items: Object.keys(Status).map(s => (
            { label: getStatusLabel(s as Status), value: s }
        ))
    });

    return (
        <>
            <Heading marginBottom="0.5em">Boka lokal</Heading>
            <Text marginBottom="1em">Läs noga igenom <Text as="b"><Link href="/information" color="teal" target="_blank" rel="noopener noreferrer">Informationen</Link></Text> innan du bokar!</Text>
            
            <form onSubmit={submit(false)} style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                maxWidth: "600px"
            }}>
                <Field label="Lokal" required>
                    <SelectRoot
                        collection={venueList}
                        value={venue == "" ? [] : [ venue ]}
                        onValueChange={(e) => setVenue(e.value[0])}
                    >
                        <SelectTrigger>
                            <SelectValueText placeholder="Välj lokal" />
                        </SelectTrigger>
                        <SelectContent>
                            {venueList.items.map((venue) => (
                                <SelectItem item={venue} key={venue.value}>
                                    {venue.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </SelectRoot>
                </Field>

                <Field label="Namn på bokningsansvarig" required>
                    <Input
                        placeholder="Ditt namn"
                        maxLength={CHARACTER_LIMIT.name}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    ></Input>
                </Field>

                <Field label="Kommitté/förening">
                    <Input
                        placeholder="Namn på kommitté/förening"
                        maxLength={CHARACTER_LIMIT.comittee}
                        value={committee ?? ""}
                        onChange={e => setCommittee(e.target.value)}
                    ></Input>
                </Field>

                <Field
                    label="E-post"
                    required
                    invalid={!isMailSpelledCorrectly(email)}
                    errorText="Din e-post kan vara felstavad!"
                >
                    <Input
                        type="email"
                        placeholder="namn@stavaintefel.se"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    ></Input>
                </Field>

                <Field
                    label="Typ av arrangemang"
                    required
                >
                    <RadioGroup onValueChange={(e) => {
                        setReservationType(e.value as ReservationType);
                    }} value={reservationType}>
                        <div className={styles.radioStack}>
                            <Radio value={ReservationType.PREPARATION}>Förberedelser</Radio>
                            <Radio value={ReservationType.SITTING}>Sittning</Radio>
                            <Radio value={ReservationType.PUB}>Pub</Radio>
                            <Radio value={ReservationType.PERFORMANCE}>Föreställning</Radio>
                            <Radio value={ReservationType.OTHER}>Övrig bokning</Radio>
                        </div>
                    </RadioGroup>
                </Field>

                <Field
                    label="Beskrivning"
                    helperText={`${description.length}/${CHARACTER_LIMIT.description} tecken`}
                    required
                >
                    <Textarea
                        placeholder="Beskriv varför du bokar lokalen och annat som kan vara bra att veta"
                        maxLength={500}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    ></Textarea>
                </Field>

                <div className={styles.timeStack}>
                    <div>
                        <Field
                            label="Från"
                            required
                        >
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
                        </Field>
                    </div>

                    <div>
                        <Field
                            label="Till"
                            helperText="Obs! Vid denna tiden ska ni vara klara för avsyning"
                            required
                            invalid={showErrors && duration.valueOf() <= 0}
                            errorText="Sluttid måste vara efter starttid"
                        >
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
                        </Field>
                    </div>
                </div>

                <Field
                    label="Stående bokning"
                    required
                >
                    <Text>Denna bokning återkommer:</Text>
                    <RadioGroup onValueChange={(e) => {
                        setRecurring(e.value as Recurring);
                    }} value={recurring}>
                        <div className={styles.radioStack}>
                            {Object.keys(Recurring).map((key) => {
                                if (key === Recurring.MONTHLY) {
                                    return;
                                }

                                return <Radio key={key} value={key}>{getRecurringLabel(key as Recurring)}</Radio>
                            })}
                        </div>
                    </RadioGroup>
                </Field>

                {recurring !== Recurring.NEVER && (
                    <Field
                        label="Stående till"
                        helperText="Bokningen återkommer till och med denna dag"
                        required
                        invalid={showErrors && recurringUntil.valueOf() <= to.valueOf()}
                        errorText="Tiden måste vara efter sluttid på bokningen"
                    >
                        <Stack>
                            <Input
                                type="date"
                                value={recurringUntilDateString}
                                onChange={e => setRecurringUntilDateString(e.target.value)}
                            ></Input>
                        </Stack>
                    </Field>
                )}

                {/* <FormControl>
                    <FormLabel>Jag vill få mail när min bokning godkänns/nekas</FormLabel>
                    <Checkbox defaultChecked></Checkbox>
                </FormControl> */}

                {isUpdating && (
                    <Field
                        label="Status"
                        required
                    >
                        <SelectRoot
                            collection={statusList}
                            value={[status]}
                            onValueChange={(e) => setStatus(e.value[0] as keyof typeof Status)}
                        >
                            <SelectTrigger>
                                <SelectValueText placeholder="Välj status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusList.items.map((s) => (
                                    <SelectItem item={s} key={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    </Field>
                )}

                <Heading marginTop="1em" size="lg">Granska bokning</Heading>

                {venue == "" ? (
                    <Text>Välj en lokal först</Text>
                ) : duration.valueOf() <= 0 ? (
                    <Text>Sluttid måste vara efter starttid!</Text>
                ) : (
                    <Text>Jag vill boka {venues.find(v => v.id.toString() == venue)?.name} i {formatDuration(duration)}.{recurring !== Recurring.NEVER && (" Bokningen återkommer " + getRecurringLabel(recurring).toLowerCase() + " fram till " + formatDateShort(recurringUntil) + ".")}</Text>
                )}

                <HStack>
                    <Button
                        colorPalette="blue"
                        type="submit"
                        disabled={isLoading || venue == "" || duration.valueOf() <= 0}
                    >
                        {isUpdating ? "Uppdatera bokning" : "Skapa bokning"}
                    </Button>

                    {isLoading && (
                        <Spinner></Spinner>
                    )}
                </HStack>
            </form>

            <DialogRoot lazyMount open={isOpen} onOpenChange={(e) => setOpen(e.open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Överlappande bokning</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        Denna bokningen överlappar befintliga bokningar och kommer automatiskt att nekas. Vill du boka ändå? (bokningen kommer då inte visas i kalendern)
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline">Avbryt</Button>
                        </DialogActionTrigger>

                        <Button variant='ghost' colorPalette='red' mr={3} onClick={() => {
                            submit(true)();
                            setOpen(false);
                        }}>
                            Boka ändå
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>
        </>
    )
}