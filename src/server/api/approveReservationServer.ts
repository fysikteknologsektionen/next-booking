import { Status } from "@prisma/client";
import prisma from "../lib/prisma";
import { acceptMail, denyMail, sendEmail } from "../lib/mailing";

/*  This function needs to be in a file only accessed from server components
    since nodemailer will try to load things not accessible in the browser
    otherwise
*/

// Approve a reservation, used on the server
export async function approveReservationServer(reservationID: number, statusChangerId?: number) {
    const reservation = await prisma.reservation.findUnique({
        where: {
            id: reservationID,
        },
    });

    // If no reservation
    if (!reservation) return { reservation: true }

    // Get all reservations that could conflict with the one being approved
    const collisions = await prisma.reservation.findMany({
        where: {
            id: {
                not: reservation?.id,
            },
            status: Status.ACCEPTED,
            venueId: reservation?.venueId,
            startTime: {
                lt: reservation?.endTime,
            },
            endTime: {
                gt: reservation?.startTime,
            },
        },
    });

    // If conflicting with another already approved reservation, abort 
    if (collisions && collisions.length > 0) return { collision: true };

    // Approve the reservation in the database
    const result = await prisma.reservation.update({
        where: {
            id: reservationID,
        },
        data: {
            status: Status.ACCEPTED,
            editorId: statusChangerId,
        },
    });

    // Send email to the accepted booker
    const message = acceptMail(reservation.date);
    const emailrespons = await sendEmail(reservation?.clientEmail,"Bokning godkänd", message);

    // Deny all other bookings that would be conflicting
    const toBeDenied = await prisma.reservation.findMany({
        where: {
            status: Status.PENDING,
            venueId: result?.venueId,
            startTime: {
                lt: result?.endTime,
            },
            endTime: {
                gt: result?.startTime,
            },
        },
    });

    const autoDeny = await prisma.reservation.updateMany({
        where: {
            status: Status.PENDING,
            venueId: result?.venueId,
            startTime: {
                lt: result?.endTime,
            },
            endTime: {
                gt: result?.startTime,
            },
        },
        data: {
            status: Status.DENIED,
            editorId: statusChangerId,
        },
    });

    
    // Send email to all denied bookings
    await Promise.all(toBeDenied.map(async (deniedReservation) => {
        const message = denyMail(deniedReservation.date);
        const emailresponse = await sendEmail(deniedReservation.clientEmail, "Bokning nekad", message);
    }));

    return {
        updatedReservation: result,
        affectedReservations: toBeDenied
    };
}
