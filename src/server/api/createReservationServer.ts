import { Recurring, ReservationType, Status } from "@prisma/client";
import prisma from "@/server/lib/prisma";
import { CHARACTER_LIMIT, validateDateString, validateVenueId } from "@/lib/helper";
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
    venueId: string,
    date: string,
    startTime: string,
    endTime: string,
    recurring: Recurring,
    recurringUntil: string | null
}) {
    // Validate data
    if (
        clientName.length > CHARACTER_LIMIT.name ||
        clientDescription.length > CHARACTER_LIMIT.description ||
        (clientCommittee && clientCommittee.length > CHARACTER_LIMIT.comittee)
    ) {
        return false;
    }

    if (
        !validateDateString(startTime) ||
        !validateDateString(endTime) ||
        !validateDateString(date) ||
        (recurringUntil !== null && !validateDateString(recurringUntil)) ||
        !validateVenueId(venueId)
    ) {
        return false;
    }

    startTime = new Date(startTime).toISOString();
    endTime = new Date(endTime).toISOString();
    date = new Date(date).toISOString();
    recurringUntil = recurringUntil == null ? null : new Date(recurringUntil).toISOString();
    const venueIdNumber = parseInt(venueId);

    clientName = clientName.toString();
    clientDescription = clientDescription.toString();

    const collisions = await prisma.reservation.findMany({
        where: {
            status: Status.ACCEPTED,
            venueId: venueIdNumber,
            startTime: {
                lt: endTime,
            },
            endTime: {
                gt: startTime,
            },
        },
    });

    const status = collisions.length > 0 ? Status.DENIED : Status.PENDING;

    try {
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
                venueId: venueIdNumber,
                status,
            },
        });
    }
    catch (e) {
        console.error(e);
        return false;
    }

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

    return true;
}