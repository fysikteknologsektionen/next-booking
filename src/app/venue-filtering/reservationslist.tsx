'use client'
import { getReservationsClient } from "@/lib/fetching";
import { Reservation } from "@prisma/client";
import { useEffect, useState} from "react";
import VenueDropdown from "./venuedropdown";
import { Venue } from "@prisma/client";

export default function ReservationsList({ venues, inReservations, inStartTime, inEndTime }:{ venues:Venue[], inReservations:Reservation[], inStartTime:Date, inEndTime:Date }) {
    const [activeVenues, setActiveVenues] = useState<number[]>();
    const [reservations, setReservations] = useState<Reservation[]>(inReservations);
    const [startTime, setStartTime] = useState(inStartTime);
    const [endTime, setEndTime] = useState(inEndTime);

    const updateList = async function() {
        let reservations:Reservation[];
        if (activeVenues) {
            reservations = await getReservationsClient(startTime, endTime, activeVenues);
        } else {
            reservations = await getReservationsClient(startTime, endTime);
        }
        setReservations(reservations);
    }

    // TODO: add onchange for all inputs

    return(
        <div>
            <form>
                <VenueDropdown venues={venues}/>
                <label htmlFor="startTime">Start date:</label>
                <input type="date" id="startTime" name="startTime" value="2023-09-17" />
                <label htmlFor="endTime">End date:</label>
                <input type="date" id="endTime" name="endTime" value="2023-09-17" />
                <input type="button" value={"Apply filters!"} onClick={updateList} />
                <ul>
                    {reservations.map((reservation) => <li key={reservation.id}>{reservation.clientName+": "+reservation.clientEmail+", Event: "+reservation.clientDescription+" at "+new Date(reservation.date).toDateString()}</li>)}
                </ul>
            </form>
        </div>
    )
}