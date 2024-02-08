import { Status } from "@prisma/client";
import prisma from "../lib/prisma";


// Deny a reservation, used on the server
export async function denyReservationServer(reservationID: number, statusChangerId?: number) {
    const result = await prisma.reservation.update({
        where: {
            id: reservationID,
        },
        data: {
            status: Status.DENIED,
            editorId: statusChangerId,
        },
    });
    return result;
}


// Deny a reservation, used on the client
export async function denyReservationClient(reservationID: number) {
    try {
        const body = { reservationID: reservationID };
        const rawResponse = await fetch('/api/reservations/deny', {
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
