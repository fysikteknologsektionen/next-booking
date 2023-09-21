
import { getReservationsServer, getVenuesServer } from "@/lib/fetching";
import ReservationsList from "./reservationslist";

export default async function Page() {
    const venues = await getVenuesServer();

    // TODO: get start and end times for the month
    const startTime = new Date("2020-01-01");
    const endTime = new Date("2025-01-01");

    const reservations = await getReservationsServer(startTime, endTime)

    return(
        <ReservationsList venues={venues} inReservations={reservations} inStartTime={startTime} inEndTime={endTime}/>
    )
}