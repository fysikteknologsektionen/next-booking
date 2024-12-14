import { Recurring, ReservationType, Status } from "@prisma/client";
import prisma from "../lib/prisma";
import { localDateStringToUTCDate, validateDateString, validateLocalDateString, validateVenueId } from "@/lib/helper";


// Create a reservation, used on the server
export async function updateReservationServer( {
    reservationID,
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
    status
}:{
    reservationID: number,
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
    status: Status
},
statusChangerId?: number) {
    // No field length limit since only admins
    // update reservations

    if (
        !validateLocalDateString(startTime) ||
        !validateLocalDateString(endTime) ||
        !validateLocalDateString(date) ||
        (recurringUntil !== null && !validateDateString(recurringUntil)) ||
        !validateVenueId(venueId)
    ) {
        return false;
    }

    startTime = localDateStringToUTCDate(startTime).toISOString();
    endTime = localDateStringToUTCDate(endTime).toISOString();
    date = localDateStringToUTCDate(date).toISOString();
    recurringUntil = recurringUntil == null ? null : new Date(recurringUntil).toISOString();
    const venueIdNumber = parseInt(venueId);

    clientName = clientName.toString();
    clientDescription = clientDescription.toString();

    const result = await prisma.reservation.update({
        where: {id: reservationID},
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
            editorId: statusChangerId,
        },
    });;
    return result;
}


// Create a reservation, used on the client
export async function updateReservationClient(reservationDetails: any) {
    try {
        const body = { reservationDetails: reservationDetails };
        const rawResponse = await fetch('/api/reservations/update', {
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
