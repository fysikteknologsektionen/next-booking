import { Status } from "@prisma/client";
import prisma from "../lib/prisma";
import { acceptMail, denyMail } from "../lib/mailing";

/*  This function needs to be in a file only accessed from server components
    since nodemailer will try to load things not accessible in the browser
    otherwise
*/

// Approve a reservation, used on the server
export async function approveReservationServer(reservationID: number, statusChangerId?: number) {
    const reservation = await prisma.reservation.findUnique({
        where: {
            id: reservationID,
            status: Status.PENDING,
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
    if (result && result.venueId) {
        const venue = await prisma.venue.findUnique({
            where: {
                id: result.venueId,
            },
        });

        if (!venue) return { reservation: true };

        const emailResponse = acceptMail(reservation, venue.name);
    }


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
    const venues = await prisma.venue.findMany();

    await Promise.all(toBeDenied.map(async (deniedReservation) => {
        const venue = venues.find(r => {
            return r.id === deniedReservation.id
        });
        if (venue) {
            const emailResponse = denyMail(deniedReservation, venue.name, false);
        }
    }));

    return {
        updatedReservation: result,
        affectedReservations: toBeDenied
    };
}
