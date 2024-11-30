// Create a reservation, used on the client
export async function createReservationClient(reservationDetails: any) {
    try {
        const body = { reservationDetails: reservationDetails };
        const rawResponse = await fetch('/api/reservations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const result = await rawResponse.json();
        return result;
    } catch (error) {
        console.error(error);
    }
    return false;
}
