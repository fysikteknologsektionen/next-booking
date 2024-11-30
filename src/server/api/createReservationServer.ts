import { Recurring, ReservationType, Status } from "@prisma/client";
import prisma from "@/server/lib/prisma";
import { CHARACTER_LIMIT } from "@/lib/helper";
import { denyMail, confirmationMail, sendEmail } from "../lib/mailing";

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
    // Validate data
    if (
        clientName.length > CHARACTER_LIMIT.name ||
        clientDescription.length > CHARACTER_LIMIT.description ||
        (clientCommittee && clientCommittee.length > CHARACTER_LIMIT.comittee)
    ) {
        return false;
    }

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

    // Confirmation mail
    // if (result && result.venueId) {
    //     const venue = await prisma.venue.findUnique({
    //         where: {
    //             id: result.venueId,
    //         },
    //     });

    //     if (!venue) return false;

    //     const message = result.status === Status.PENDING ? confirmationMail(result, venue.name) : denyMail(result.date);
    //     const emailresponse = await sendEmail(result.clientEmail, "Bokning", message);
    // }

    return !!result;
}