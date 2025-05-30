// Deny a reservation, used on the client
export async function denyReservationClient(reservationID: number) {
    try {
        const body = { reservationID: reservationID };
        const rawResponse = await fetch('/api/reservations/deny', {
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