import { getReservationsServer } from "@/lib/fetching";
import { Reservation } from "@prisma/client";

export default async function ReservationsList() {
    const reservations = await getReservationsServer();

    return (
        <ul>
            {reservations.map((reservation:Reservation) => (<li key={reservation.id}>{JSON.stringify(reservation)}</li>))}
        </ul>
    )
}