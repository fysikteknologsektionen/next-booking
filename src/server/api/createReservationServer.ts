import { Recurring, ReservationType, Status } from "@prisma/client";
import prisma from "@/server/lib/prisma";
import { CHARACTER_LIMIT, localDateStringToUTCDate, validateDateString, validateLocalDateString, validateVenueId } from "@/lib/helper";
import { denyMail, confirmationMail } from "../lib/mailing";

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
    recurringSkip
}: {
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
    recurringUntil: string | null,
    recurringSkip: string[] | null
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
        !validateLocalDateString(startTime) ||
        !validateLocalDateString(endTime) ||
        !validateLocalDateString(date) ||
        (recurringUntil !== null && !validateDateString(recurringUntil)) ||
        (recurringSkip !== null && recurringSkip.some(s => !validateDateString(s))) ||
        !validateVenueId(venueId)
    ) {
        console.error(startTime, endTime, date, venueId, recurringUntil, recurringSkip);
        return false;
    }

    startTime = localDateStringToUTCDate(startTime).toISOString();
    endTime = localDateStringToUTCDate(endTime).toISOString();
    date = localDateStringToUTCDate(date).toISOString();
    recurringUntil = recurringUntil == null ? null : new Date(recurringUntil).toISOString();
    const recurringSkipArray = recurringSkip == null ? [] : recurringSkip.map(s => new Date(s).toISOString());
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

    let result;
    try {
        result = await prisma.reservation.create({
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
                recurringSkip: recurringSkipArray,
                venueId: venueIdNumber,
                status,
            },
        });
    }
    catch (e) {
        console.error(e);
        return false;
    }

    //Confirmation mail
    if (result && result.venueId) {
        const venue = await prisma.venue.findUnique({
            where: {
                id: result.venueId,
            },
        });

        if (!venue) return false;

        const emailResponse = result.status === Status.PENDING ? confirmationMail(result, venue.name) : denyMail(result, venue.name, true);
    }

    return true;
}

export async function createReservationServerWithStatus({
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
    recurringSkip,
    status
}: {
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
    recurringUntil: string | null,
    recurringSkip: string[] | null,
    status: Status,
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
        !validateLocalDateString(startTime) ||
        !validateLocalDateString(endTime) ||
        !validateLocalDateString(date) ||
        (recurringUntil !== null && !validateDateString(recurringUntil)) ||
        (recurringSkip !== null && recurringSkip.some(s => !validateDateString(s))) ||
        !validateVenueId(venueId)
    ) {
        console.error(startTime, endTime, date, venueId, recurringUntil, recurringSkip);
        return false;
    }

    startTime = localDateStringToUTCDate(startTime).toISOString();
    endTime = localDateStringToUTCDate(endTime).toISOString();
    date = localDateStringToUTCDate(date).toISOString();
    recurringUntil = recurringUntil == null ? null : new Date(recurringUntil).toISOString();
    const recurringSkipArray = recurringSkip == null ? [] : recurringSkip.map(s => new Date(s).toISOString());
    const venueIdNumber = parseInt(venueId);

    clientName = clientName.toString();
    clientDescription = clientDescription.toString();

    // const collisions = await prisma.reservation.findMany({
    //     where: {
    //         status: Status.ACCEPTED,
    //         venueId: venueIdNumber,
    //         startTime: {
    //             lt: endTime,
    //         },
    //         endTime: {
    //             gt: startTime,
    //         },
    //     },
    // });

    // const status = collisions.length > 0 ? Status.DENIED : Status.PENDING;

    let result;
    try {
        result = await prisma.reservation.create({
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
                recurringSkip: recurringSkipArray,
                venueId: venueIdNumber,
                status,
            },
        });
    }
    catch (e) {
        console.error(e);
        return false;
    }

    // //Confirmation mail
    // if (result && result.venueId) {
    //     const venue = await prisma.venue.findUnique({
    //         where: {
    //             id: result.venueId,
    //         },
    //     });

    //     if (!venue) return false;

    //     const emailResponse = result.status === Status.PENDING ? confirmationMail(result, venue.name) : denyMail(result, venue.name, true);
    // }

    return true;
}