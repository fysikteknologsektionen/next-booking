import { getCurrentMonth, localDateStringToUTCDate, mod } from "@/lib/helper";
import { Recurring, Status } from "@prisma/client";
import prisma from "../lib/prisma";
import { getReservationsServer } from "./getreservations";

export async function checkOverlapServer(
    startTime: string,
    endTime: string,
    venueId: string
) {
    const startTimeDate = localDateStringToUTCDate(startTime);
    const endTimeDate = localDateStringToUTCDate(endTime);
    const venueIdNumber = parseInt(venueId);

    const reservations = (await getReservationsServer(startTimeDate, endTimeDate, false, [ venueIdNumber ]))
        .filter((r) => (
            r.status === Status.ACCEPTED &&
            // Remove edge cases where startTime of one = endTime of other
            r.startTime.valueOf() < endTimeDate.valueOf() &&
            r.endTime.valueOf() > startTimeDate.valueOf()
        ));
    
    return reservations.length > 0;
}

export async function checkOverlapClient(
    startTime: string,
    endTime: string,
    venueId: number | string
): Promise<boolean> {
    const params = new URLSearchParams({
        startTime: startTime,
        endTime: endTime,
        venueId: venueId.toString(),
    });

    const res = await fetch("/api/reservations/?" + params);
    if (!res.ok) {
        throw new Error("Could not check for overlap");
    }
    
    const json = await res.json();
    return json.isOverlapping;
}