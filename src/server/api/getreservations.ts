import { Recurring } from "@prisma/client";
import prisma from "../lib/prisma";

// ------ Reservations ------
// Gets reservations by date. Used on the server
export async function getReservationsServer(queryStartTime: Date, queryEndTime: Date, recurringAsOne: boolean, venueIDs?: number[]) {
    const reservations = await prisma.reservation.findMany({
        where: {
            OR: [{
                startTime: {
                    gte: queryStartTime,
                    lte: queryEndTime,
                },
            }, {
                endTime: {
                    gte: queryStartTime, // Greater than or equal (start time)
                    lte: queryEndTime, // Less than or equal (end time)
                },
            }, {
                startTime: {
                    lte: queryStartTime,
                },
                endTime: {
                    gte: queryEndTime,
                },
            }],
            ...(venueIDs ? {venueId: {in: venueIDs}}:{})
        }
    });

    if (!recurringAsOne) {
        const recurringReservationBases = await prisma.reservation.findMany({
            where: {
                OR: [{
                    startTime: {
                        gte: queryStartTime,
                        lte: queryEndTime,
                    },
                }, {
                    endTime: {
                        gte: queryStartTime, // Greater than or equal (start time)
                        lte: queryEndTime, // Less than or equal (end time)
                    },
                }, {
                    startTime: {
                        lte: queryStartTime,
                    },
                    endTime: {
                        gte: queryEndTime,
                    },
                }, {
                    recurringUntil: {
                        gte: queryStartTime
                    }
                }],
                recurring: {
                    not: Recurring.NEVER
                },
                ...(venueIDs ? {venueId: {in: venueIDs}}:{})
            }
        });

        for (const recurringReservationBase of recurringReservationBases) {
            if (!recurringReservationBase.recurringUntil) {
                continue;
            }

            // Prevent infinite while loop
            if (
                recurringReservationBase.recurring !== Recurring.WEEKLY &&
                recurringReservationBase.recurring !== Recurring.MONTHLY
            ) {
                continue;
            }

            const currentDate = new Date(recurringReservationBase.startTime);
            while (true) {
                // Jump to next recurring reservation
                if (recurringReservationBase.recurring === Recurring.WEEKLY) {
                    currentDate.setDate(currentDate.getDate() + 7);
                }
                else if (recurringReservationBase.recurring === Recurring.MONTHLY) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }

                const currentDay = new Date(currentDate);
                currentDay.setHours(0, 0, 0, 0);
                if (currentDay.valueOf() > recurringReservationBase.recurringUntil.valueOf()) {
                    break;
                }

                const fakeReservation = structuredClone(recurringReservationBase);
                const duration = fakeReservation.endTime.valueOf() - fakeReservation.startTime.valueOf();
                fakeReservation.startTime = new Date(currentDate);
                fakeReservation.endTime = new Date(fakeReservation.startTime.valueOf() + duration);

                reservations.push(fakeReservation);
            }
        }
    }

    return reservations;
}

// Gets a reservation by id. Used on the server
export async function getReservationByIDServer(id:number) {
    const reservation = await prisma.reservation.findUnique({
        where: {
            id: id,
        }
    });
    return reservation;
}

// Gets reservations by date. Used on the client
export async function getReservationsClient(startTime:Date, endTime:Date, venueIDs?:number[], recurringAsOne?: boolean) {
    const params = new URLSearchParams({ // Send times as integers
        startTime: startTime.getTime().toString(),
        endTime: endTime.getTime().toString(),
        recurringAsOne: (recurringAsOne ?? false).toString(),
    });
    // If there are venues specified, add them to the params
    if (venueIDs) {
        for (let i = 0; i<venueIDs.length; i++) {
            params.append("venueIDs", venueIDs[i].toString())
        }
    }
    // Send the request
    const res = await fetch("/api/reservations?" + params);
    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        // throw new Error('Failed to fetch data')
        return null
    }
    
    return res.json();
}

export async function getReservationByIDClient(id:number) {
    const params = new URLSearchParams({ // Send reservation id
        id: id.toString()
    });

    // Send the request
    const res = await fetch("/api/reservations?" + params);
    if (!res.ok) {
        // // This will activate the closest `error.js` Error Boundary
        // throw new Error('Failed to fetch data')
        return null;
    }
    
    return res.json();
}