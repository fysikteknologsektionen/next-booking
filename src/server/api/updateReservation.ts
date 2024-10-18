import { Recurring, ReservationType, Status } from "@prisma/client";
import prisma from "../lib/prisma";


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
    venueId: number | null,
    date: Date,
    startTime: Date,
    endTime: Date,
    recurring: Recurring,
    recurringUntil: Date | null,
    status: Status
},
statusChangerId?: number) {
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
            venueId,
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
