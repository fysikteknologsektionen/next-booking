import { useVenueStore } from "@/lib/venueStore";
import { getReservationsClient } from "@/server/api/getreservations";
import { Button, Card, CardBody, CardHeader, Center, Heading, IconButton, Spinner, Stack, Text } from "@chakra-ui/react";
import { Reservation, Status, Venue } from "@prisma/client";
import { useEffect, useState } from "react";

import styles from "@/components/reservationsList.module.css";
import { CloseIcon, EditIcon } from "@chakra-ui/icons";
import { approveReservationClient } from "@/server/api/approveReservation";
import { getNameOfMonth } from "@/lib/helper";
import { useRouter } from "next/navigation";
import { denyReservationClient } from "@/server/api/denyReservation";

export default function ReservationsList() {
    const [isLoading, setLoading] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    useEffect(() => {
        (async () => {
            const startTime = new Date("1970-01-01");
            const endTime = new Date()
            endTime.setDate(endTime.getDate() + 365)

            setLoading(true)
            const res = await getReservationsClient(startTime, endTime);

            const parsedReservations: Reservation[] = res.map((r: any) => {
                return {
                    ...r,
                    date: new Date(r.date),
                    startTime: new Date(r.startTime),
                    endTime: new Date(r.endTime),
                    createdAt: new Date(r.createdAt),
                    updatedAt: new Date(r.updatedAt)
                };
            })
            parsedReservations.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
            setReservations(parsedReservations);
            setLoading(false)
        })();
    }, []);

    const pendingReservations = reservations.filter(r => r.status === Status.PENDING);
    const handledReservations = reservations.filter(r => r.status !== Status.PENDING);

    return (
        <Card>
            <CardHeader>
                <Heading>Hantera bokningar</Heading>
                <Text>Endast admins kan se detta.</Text>
            </CardHeader>

            <CardBody>
                <div className={styles.reservations}>
                    <div className={[
                        styles.item,
                        styles.header
                    ].join(" ")}>
                        <span>Lokal</span>
                        <span>Bokningsinfo</span>
                        <span>Datum</span>

                        <span></span>
                        <span style={{ textAlign: "right" }}>
                            {isLoading && (
                                <Spinner></Spinner>
                            )}
                        </span>
                    </div>

                    {pendingReservations.filter(r => r.status === Status.PENDING).map((reservation, index) => {
                        return <ReservationItem reservation={reservation} key={index}></ReservationItem>
                    })}

                    {pendingReservations.length === 0 && (
                        <Text color="gray.500">Inga nya bokningar</Text>
                    )}
                </div>

                {handledReservations.length > 0 && (
                    <div className={styles.reservations} style={{ marginTop: "2rem" }}>
                        <div className={[
                            styles.item,
                            styles.header
                        ].join(" ")}>
                            <span>Lokal</span>
                            <span>Bokningsinfo</span>
                            <span>Datum</span>

                            <span></span>
                            <span style={{ textAlign: "right" }}>
                                {isLoading && (
                                    <Spinner></Spinner>
                                )}
                            </span>
                        </div>

                        {handledReservations.map((reservation, index) => {
                            return <ReservationItem reservation={reservation} key={index}></ReservationItem>
                        })}
                    </div>
                )}
            </CardBody>
        </Card>
    )
}

function ReservationItem({
    reservation
}: {
    reservation: Reservation
}) {
    const router = useRouter();
    const venues = useVenueStore((state) => state.venues);
    const getVenue = (venueId: number | null) => {
        return venues.find(v => v.id === venueId);
    };
    const getVenueName = (venueId: number | null) => {
        const venue = getVenue(venueId);

        if (!venue) {
            return `[Unknown Venue: ${venueId}]`;
        }

        return venue.name;
    }

    const isSameDay = (a: Date, b: Date) => {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        )
    }

    const formatTime = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");

        return `${hours}:${minutes}`;
    }

    const formatDate = (date: Date, today = new Date()) => {
        const day = date.getDate();
        const month = getNameOfMonth(date).toLocaleLowerCase();
        const year = date.getFullYear();

        if (year === today.getFullYear()) {
            return `${day} ${month}`;
        }

        return `${day} ${month} ${year}`;
    }

    const renderTime = (reservation: Reservation) => {
        if (isSameDay(reservation.startTime, reservation.endTime)) {
            return (
                <span>
                    {formatDate(reservation.startTime)} {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                </span>
            )
        }

        return (
            <span>
                {formatDate(reservation.startTime)} {formatTime(reservation.startTime)} - {formatDate(reservation.endTime)} {formatTime(reservation.endTime)}
            </span>
        )
    }

    const formatStatus = (status: Status) => {
        if (status === Status.ACCEPTED) {
            return "Godkänd";
        }
        if (status === Status.DENIED) {
            return "Nekad";
        }
        if (status === Status.PENDING) {
            return "Väntar";
        }
    }

    const [disabled, setDisabled] = useState(false);
    const [overrideStatus, setStatus] = useState<Status>(Status.PENDING); 

    const approve = async () => {
        setDisabled(true);
        setStatus(Status.PENDING);

        const res = await approveReservationClient(reservation.id);
        console.log(res);

        if (!res || !res.ok) {
            setDisabled(false);
        }
        else {
            setStatus(Status.ACCEPTED);
        }
    }

    const deny = async () => {
        setDisabled(true);
        setStatus(Status.PENDING);

        const res = await denyReservationClient(reservation.id);
        console.log(res);

        if (!res || !res.ok) {
            setDisabled(false);
        }
        else {
            setStatus(Status.DENIED);
        }
    }

    const status = overrideStatus === Status.PENDING ? reservation.status : overrideStatus;

    const edit = async () => {
        window.location.href = `/update-reservation?reservationID=${reservation.id}`; // router, I hardly know her
    }

    return (
        <Card>
            <div className={styles.item}>
                <span>{getVenueName(reservation.venueId)}</span>
                <Stack>
                    <span>{reservation.clientName} ({reservation.clientEmail})</span>
                    <span>{reservation.clientDescription}</span>
                </Stack>

                <div>
                    {renderTime(reservation)}
                </div>

                {status === Status.PENDING ? (
                    <>
                        <Button isLoading={disabled} isDisabled={disabled} colorScheme="green" onClick={() => approve()}>Godkänn</Button>
                        <IconButton isLoading={disabled} isDisabled={disabled} aria-label="Neka bokning" title="Neka bokning" icon={<CloseIcon />} onClick={() => deny()} colorScheme="red"></IconButton>
                    </>
                ) : (
                    <Button isDisabled={true} colorScheme={status === Status.ACCEPTED ? "green" : "red"} gridColumn="span 2">
                        {formatStatus(status)}
                    </Button>
                )}

                <IconButton aria-label="Ändra bokning" title="Ändra bokning" icon={<EditIcon />} onClick={edit}></IconButton>
            </div>
        </Card>
    )
}