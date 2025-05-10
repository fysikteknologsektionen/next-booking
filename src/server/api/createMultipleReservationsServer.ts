import { Recurring, ReservationType, Status } from "@prisma/client";
import { createReservationServerWithStatus } from "./createReservationServer";

export async function createMultipleReservationsServer(reservations: {
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
}[]) {
    for (const reservation of reservations) {
        const result = await createReservationServerWithStatus(reservation);
        if (!result) {
            return false;
        }
    }

    return true;
}