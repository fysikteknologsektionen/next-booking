import { Recurring, ReservationType, Status } from "@prisma/client";
import prisma from "../lib/prisma";

// Create a reservation, used on the server
export async function createReservationServer( {
    clientName,
    clientCommittee,
    clientEmail,
    clientDescription,
    type,
    venueId,
    date,
    startTime,
    endTime,
    recurring,
    recurringUntil,
}:{
    clientName: string,
    clientCommittee: string | null,
    clientEmail: string,
    clientDescription: string,
    type: ReservationType,
    venueId: number | null,
    date: Date,
    startTime: Date,
    endTime: Date,
    recurring: Recurring,
    recurringUntil: Date | null
}) {
    const collisions = await prisma.reservation.findMany({
        where: {
            status: Status.ACCEPTED,
            venueId: venueId,
            startTime: {
                lt: endTime,
            },
            endTime: {
                gt: startTime,
            },
        },
    });

    const result = await prisma.reservation.create({
        data: {
            clientName,
            clientCommittee,
            clientEmail,
            clientDescription,
            type,
            date,
            startTime,
            endTime,
            recurring,
            recurringUntil,
            venueId,
            status: (collisions && collisions.length > 0) ? Status.DENIED : Status.PENDING,
        },
    });
    return result;
}


// Create a reservation, used on the client
export async function createReservationClient(reservationDetails: any) {
    try {
        const body = { reservationDetails: reservationDetails };
        const rawResponse = await fetch('/api/reservations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return rawResponse;
    } catch (error) {
        console.error(error);
    }
    return;
}
