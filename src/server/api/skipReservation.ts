import { Recurring } from "@prisma/client";
import prisma from "../lib/prisma";

export async function skipReservationServer(reservationID: number, startTime: Date) {
    const result = await prisma.reservation.update({
        where: {
            id: reservationID,
            NOT: {
                recurring: Recurring.NEVER
            }
        },
        data: {
            recurringSkip: {
                push: startTime
            }
        }
    });

    return result;
}

export async function skipReservationClient(reservationID: number, startTime: Date) {
    try {
        const body = {
            reservationID: reservationID,
            startTime: startTime.toISOString(),
        };
        const rawResponse = await fetch('/api/reservations/skip', {
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
