import { Reservation, Status } from "@prisma/client";
import prisma from "../lib/prisma";

/**
 * Deny a reservation, used on the server
 * @param result Empty reservation passed as reference
 */
export async function denyReservationServer(
    result: Reservation,
    reservationID: number,
    statusChangerId?: number
): Promise<boolean> {
    try {
        const updatedReservation = await prisma.reservation.update({
            where: {
                id: reservationID,
                status: Status.PENDING,
            },
            data: {
                status: Status.DENIED,
                editorId: statusChangerId,
            },
        });
        // Assign to object passed by reference
        Object.assign(result, updatedReservation);

        return true;
    }
    catch {
        return false;
    }
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
