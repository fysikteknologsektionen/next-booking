import { getReservationByIDServer, getReservationsServer } from "@/server/api/getreservations";
import { Reservation } from "@prisma/client";
import { NextResponse } from "next/server";


export async function GET(request:Request) {
    const { searchParams } = new URL(request.url)


    const startTimeUnix = searchParams.get('startTime') ?? "0";
    const endTimeUnix = searchParams.get('endTime') ?? "0";
    const venueIDs = [...searchParams.getAll('venueIDs')].map((i)=>parseInt(i));
    const startTime = new Date(parseInt(startTimeUnix))
    const endTime = new Date(parseInt(endTimeUnix))
    const reservationID = searchParams.get('id');
    let reservations: Reservation[];
    if (reservationID) {
        const reservation = await getReservationByIDServer(parseInt(reservationID));
        reservations = reservation ? [reservation] : [];
    } else if (venueIDs.length !== 0) {
        reservations = await getReservationsServer(startTime, endTime, venueIDs);
    } else {
        reservations = await getReservationsServer(startTime, endTime);
    }

    return NextResponse.json(reservations);
}