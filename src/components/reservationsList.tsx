import { useVenueStore } from "@/lib/venueStore";
import { getReservationsClient } from "@/server/api/getreservations";
import { Button, Heading, IconButton, Spinner, Text } from "@chakra-ui/react";
import { Reservation, Status, Venue } from "@prisma/client";
import { useEffect, useState } from "react";

import styles from "@/components/reservationsList.module.css";
import { EditIcon } from "@chakra-ui/icons";
import { approveReservationClient } from "@/server/api/approveReservation";

export default function ReservationsList() {
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
            setReservations(parsedReservations);
            setLoading(false)
        })();
    }, []);

    return (
        <div style={{
            marginTop: "2rem"
        }}>
            <Text>Admin</Text>
            <Heading>Bokningar</Heading>

            <div className={styles.reservations}>
                <div className={[
                    styles.item,
                    styles.header
                ].join(" ")}>
                    <span>Lokal</span>
                    <span>Bokad av</span>
                    <span>Datum</span>

                    <span></span>
                    <span style={{ textAlign: "right" }}>
                        {isLoading && (
                            <Spinner></Spinner>
                        )}
                    </span>
                </div>

                {reservations.map((reservation, index) => {
                    console.log(reservation.status === Status.ACCEPTED)
                    return (
                        <div key={index} className={styles.item}>
                            <span>{getVenueName(reservation.venueId)}</span>
                            <span>{reservation.clientName}</span>

                            <div>
                                <span>Från {new Date(reservation.startTime).toLocaleString()}</span>
                                <span>&nbsp;till {new Date(reservation.endTime).toLocaleString()}</span>
                            </div>

                            <Button isDisabled={reservation.status === Status.ACCEPTED} colorScheme="green" onClick={() => approveReservationClient(reservation.id)}>Godkänn</Button>
                            <IconButton aria-label="Ändra bokning" title="Ändra bokning" icon={<EditIcon />}></IconButton>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}