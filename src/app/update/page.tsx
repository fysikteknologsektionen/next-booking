"use client"
import { getVenuesClient } from "@/server/api/getvenues"
import BookingPage from "../../components/bookingPage"
import { useEffect, useState } from "react";
import { Reservation, Venue } from "@prisma/client";
import { getReservationByIDClient } from "@/server/api/getreservations";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
    const [venues, setVenues] = useState<Venue[]>([])
    const [reservation, setReservation] = useState<Reservation>()

    const searchParams = useSearchParams()

    const router = useRouter()

    useEffect(() => {
        (async () => {
            const venuesFetched = await getVenuesClient();
            setVenues(venuesFetched);
            const reservationID = searchParams.get("reservationID");
            if (reservationID) {
                const reservationsFetched = await getReservationByIDClient(parseInt(reservationID));
                if (!reservationsFetched || reservationsFetched.length === 0) {
                    router.push("/")
                    return;
                }
                const reservationFetched = reservationsFetched[0];
                console.log(reservationFetched);
                setReservation(reservationFetched);
            } else {
                router.push("/");
            }
            
        })()
      }, [setVenues, router, searchParams]);

    if (reservation) {
        return (
            <BookingPage
                venues={venues} reservation={reservation}
            ></BookingPage>
        )
    }

    return <></>
}