import prisma from "../lib/prisma";

// Delete a reservation, used on the server
export async function deleteReservationServer(reservationID: number) {
    const result = await prisma.reservation.delete({
        where: {
            id: reservationID,
        },
    });

    return result;
}


// Delete a reservation, used on the client
export async function deleteReservationClient(reservationID: number) {
    try {
        console.log(reservationID)
        const body = { reservationID: reservationID };
        const rawResponse = await fetch('/api/reservations/delete', {
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
