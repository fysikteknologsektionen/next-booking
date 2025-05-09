// Create multiple reservations, used on the client (only by managers)
export async function createMultipleReservationsClient(reservationDetails: any[]) {
    try {
        const body = { reservationDetails: reservationDetails };
        const rawResponse = await fetch('/api/reservations/create-multiple', {
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
