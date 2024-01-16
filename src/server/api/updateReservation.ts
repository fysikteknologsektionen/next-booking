import { Status } from "@prisma/client";
import prisma from "../lib/prisma";


// Create a reservation, used on the server
export async function updateReservationServer( {
    reservationID,
    clientName,
    clientEmail,
    clientDescription,
    venueId,
    date,
    startTime,
    endTime,
    status
}:{
    reservationID: number,
    clientName: string,
    clientEmail: string,
    clientDescription: string | null,
    venueId: number | null,
    date: Date,
    startTime: Date,
    endTime: Date,
    status: Status
},
statusChangerId?: number) {
    const result = await prisma.reservation.update({
        where: {id: reservationID},
        data: {
            clientName,
            clientEmail,
            clientDescription,
            date,
            startTime,
            endTime,
            venueId,
            status,
            editorId: statusChangerId,
        },
    });;
    return result;
}


// Create a reservation, used on the client
export async function updateReservationClient(reservationDetails:{
    reservationID: number,
    clientName: string,
    clientEmail: string,
    clientDescription: string | null,
    venueId: number | null,
    date: Date,
    startTime: Date,
    endTime: Date,
    status: Status
}) {
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
