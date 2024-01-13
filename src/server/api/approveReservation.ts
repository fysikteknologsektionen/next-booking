import { Status } from "@prisma/client";
import prisma from "../lib/prisma";
import { sendEmail } from "../lib/mailing";


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

    // TODO: Send email to the accepted booker


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

    //TODO: send email to all denied bookings

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

    return {
        updatedReservation: result,
        affectedReservations: toBeDenied
    };
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
