import { Status } from "@prisma/client";
import prisma from "../lib/prisma";
import { sendEmail } from "../lib/mailing";

/*  This function needs to be in a file only accessed from server components
    since nodemailer will try to load things not accessible in the browser
    otherwise
*/

// Approve a reservation, used on the server
export async function approveReservationServer(reservationID: number) {
    const reservation = await prisma.reservation.findUnique({
        where: {
            id: reservationID,
        },
    });
    // Get all reservations that could conflict with the one being approved
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

    // If conflicting with another already approved reservation, abort 
    if (collisions && collisions.length > 0) return;

    // Approve the reservation in the database
    const result = await prisma.reservation.update({
        where: {
            id: reservationID,
        },
        data: {
            status: Status.ACCEPTED
        },
    });

    // Send email to the accepted booker
    const message = `Hej!\n\nDin bokning ${reservation?.date} är godkänd\n\n/Fysikteknologsektionens lokalbokning`
    const emailrespons = await sendEmail(reservation?.clientEmail,"Bokning godkänd", message);

    // Deny all other bookings that would be conflicting
    const toBeDenied = await prisma.reservation.findMany({
        where: {
            status: Status.PENDING,
            venueId: result?.venueId,
            startTime: {
                lte: result?.endTime,
            },
            endTime: {
                gte: result?.startTime,
            },
        },
    });

    const autoDeny = await prisma.reservation.updateMany({
        where: {
            status: Status.PENDING,
            venueId: result?.venueId,
            startTime: {
                lte: result?.endTime,
            },
            endTime: {
                gte: result?.startTime,
            },
        },
        data: {
            status: Status.DENIED,
        },
    });

    
    // Send email to all denied bookings
    for (let i = 0; i< toBeDenied.length; i++ ) {
        const message = `Hej!\n\nDin bokning ${toBeDenied[i].date} har blivit nekad\n\n/Fysikteknologsektionens lokalbokning`
        const emailrespons = await sendEmail(toBeDenied[i].clientEmail,"Bokning nekad", message);
    }

    return {
        updatedReservation: result,
        affectedReservations: toBeDenied
    };
}
