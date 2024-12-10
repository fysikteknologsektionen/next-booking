import { Reservation, Status } from "@prisma/client";
import { denyMail } from "@/server/lib/mailing";
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

        // Send deny email
        if (result && result.venueId) {
            const venue = await prisma.venue.findUnique({
                where: {
                    id: result.venueId,
                },
            });
    
            if (!venue) return false;
    
            const emailResponse = denyMail(result, venue.name, false);
        }

        return true;
    }
    catch {
        return false;
    }
}
