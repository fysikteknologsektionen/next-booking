'use client'
import { getReservationsClient } from "@/lib/fetching";
import { Reservation } from "@prisma/client";
import { useEffect, useState} from "react";
import VenueDropdown from "./venuedropdown";
import { Venue } from "@prisma/client";

export default function ReservationsList({ venues, inReservations, inStartTime, inEndTime }:{ venues:Venue[], inReservations:Reservation[], inStartTime:Date, inEndTime:Date }) {
    const [activeVenues, setActiveVenues] = useState<number[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>(inReservations);
    const [startTime, setStartTime] = useState(inStartTime);
    const [endTime, setEndTime] = useState(inEndTime);

    const updateList = async function() {
        let reservations:Reservation[];
        if (activeVenues.length>0) {
            reservations = await getReservationsClient(startTime, endTime, activeVenues);
        } else {
            reservations = await getReservationsClient(startTime, endTime);
        }
        setReservations(reservations);
    }

    const selectVenue = function(id:number) {
        if (activeVenues?.indexOf(id) === -1) {
            setActiveVenues([...activeVenues, id])
        } else {
            let arr = [...activeVenues];
            arr.splice(arr.indexOf(id), 1);
            setActiveVenues(arr);
        }
    }

    return(
        <div>
            <form>
                <VenueDropdown venues={venues} onCheck={selectVenue} />
                <label htmlFor="startTime">Start date:</label>
                <input type="date" id="startTime" name="startTime" onChange={(date) => setStartTime(new Date(date.timeStamp))} />
                <label htmlFor="endTime">End date:</label>
                <input type="date" id="endTime" name="endTime"  onChange={(date) => setEndTime(new Date(date.timeStamp))} />
                <input type="button" value={"Re-query database!"} onClick={updateList} />
                <ul>
                    {reservations.map((reservation) => <li key={reservation.id}>{reservation.clientName+": "+reservation.clientEmail+", Event: "+reservation.clientDescription+" at "+new Date(reservation.date).toDateString()}</li>)}
                </ul>
            </form>
        </div>
    )
}