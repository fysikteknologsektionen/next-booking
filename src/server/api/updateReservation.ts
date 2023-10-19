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
}:{
    reservationID: number,
    clientName: string,
    clientEmail: string,
    clientDescription: string | null,
    venueId: number | null,
    date: Date,
    startTime: Date,
    endTime: Date,
}) {
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
