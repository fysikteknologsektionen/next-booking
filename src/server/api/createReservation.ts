import prisma from "../lib/prisma";


// Create a reservation, used on the server
export async function createReservationServer( {
    clientName,
    clientEmail,
    clientDescription,
    venueId,
    date,
    startTime,
    endTime,
}:{
    clientName: string,
    clientEmail: string,
    clientDescription: string | null,
    venueId: number | null,
    date: Date,
    startTime: Date,
    endTime: Date,
}) {
    
    const result = await prisma.reservation.create({
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
export async function createReservationClient(reservationDetails:{
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
        const rawResponse = await fetch('/api/createReservation', {
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
