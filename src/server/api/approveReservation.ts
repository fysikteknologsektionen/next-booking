import { Status } from "@prisma/client";
import prisma from "../lib/prisma";


// Approve a reservation, used on the server
export async function approveReservationServer(reservationID: number) {
    const reservation = await prisma.reservation.findUnique({
        where: {
            id: reservationID,
        },
    });
    const collisions = await prisma.reservation.findMany({
        where: {
            status: Status.ACCEPTED,
            venueId: reservation?.venueId,
            startTime: {
                lte: reservation?.endTime,
            },
            endTime: {
                gte: reservation?.startTime,
            },
        },
    });

    if (collisions && collisions.length > 0) return;

    const result = await prisma.reservation.update({
        where: {
            id: reservationID,
        },
        data: {
            status: Status.ACCEPTED
        },
    });
    return result;
}


// Approve a reservation, used on the client
export async function approveReservationClient(reservationID:number) {
    try {
        const body = { reservationID: reservationID };
        const rawResponse = await fetch('/api/reservations/approve', {
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
