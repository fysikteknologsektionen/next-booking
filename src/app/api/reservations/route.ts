import { isManager } from "@/lib/helper";
import { getReservationByIDServer, getReservationsServer } from "@/server/api/getreservations";
import authOptions from "@/server/lib/authOptions";
import { Reservation } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


export async function GET(request:Request) {
    const { searchParams } = new URL(request.url)
    const reservationID = searchParams.get('id');
    const startTimeUnix = searchParams.get('startTime') ?? "0";
    const endTimeUnix = searchParams.get('endTime') ?? "0";
    const venueIDs = [...searchParams.getAll('venueIDs')].map((i) => parseInt(i));
    const recurringAsOne = searchParams.get("recurringAsOne") === "true";

    const startTime = new Date(parseInt(startTimeUnix))
    const endTime = new Date(parseInt(endTimeUnix))

    const session = await getServerSession(authOptions);
    const manager = isManager(session);

    let reservations: Reservation[];
    if (reservationID) {
        const reservation = await getReservationByIDServer(parseInt(reservationID));
        reservations = reservation ? [reservation] : [];
    } else if (venueIDs.length !== 0) {
        reservations = await getReservationsServer(manager, startTime, endTime, recurringAsOne, venueIDs);
    } else {
        reservations = await getReservationsServer(manager, startTime, endTime, recurringAsOne);
    }

    return NextResponse.json(reservations);
}