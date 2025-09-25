import { getCurrentMonth, mod } from "@/lib/helper";
import { Recurring, Reservation, Status } from "@prisma/client";
import prisma from "../lib/prisma";

// ------ Reservations ------
// Gets reservations by date. Used on the server
export async function getReservationsServer(
    isManager: boolean,
    queryStartTime: Date,
    queryEndTime: Date,
    recurringAsOne: boolean,
    venueIDs?: number[]
) {
    const venueCheck = !venueIDs ? {} : {
        venueId: {
            in: venueIDs
        }
    };

    // Only show accepted unless the user is a manager
    const statusCheck = isManager ? {} : {
        status: Status.ACCEPTED,
    };

    // Guests should not see reservations older than a week
    const oneWeekAgo = new Date();
    oneWeekAgo.setUTCDate(oneWeekAgo.getUTCDate() - 7);
    const hideOld = isManager ? {} : {
        endTime: {
            gte: oneWeekAgo,
        },
    }

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
            ...hideOld,
            ...statusCheck,
            ...venueCheck,
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
                ...statusCheck,
                ...venueCheck,
            }
        });

        for (const recurringReservationBase of recurringReservationBases) {
            if (!recurringReservationBase.recurringUntil) {
                continue;
            }

            // Prevent infinite while loop
            if (
                recurringReservationBase.recurring !== Recurring.WEEKLY &&
                recurringReservationBase.recurring !== Recurring.MONTHLY &&
                recurringReservationBase.recurring !== Recurring.MONTHLY_SAME_DATE &&
                recurringReservationBase.recurring !== Recurring.MONTHLY_SAME_DAY
            ) {
                continue;
            }

            let weekNumber = -1; // The months week number, 0-indexed
            let reservationDay = -1; // Day of week for reservation
            if (recurringReservationBase.recurring === Recurring.MONTHLY_SAME_DAY) {
                const firstDayOfMonth = getCurrentMonth(recurringReservationBase.startTime);
                const startingDay = firstDayOfMonth.getDay();

                const startDate = new Date(recurringReservationBase.startTime);
                startDate.setUTCHours(0, 0, 0, 0);
                const refDay = recurringReservationBase.startTime.getDay();
                const dayDiff = mod(refDay - startingDay, 7);

                for (let i = 0; i < 6; i++) {
                    const d = new Date(firstDayOfMonth);
                    d.setUTCDate(d.getUTCDate() + dayDiff);
                    d.setUTCDate(d.getUTCDate() + i * 7);

                    if (d.valueOf() >= startDate.valueOf()) {
                        weekNumber = i;
                        break;
                    }
                }

                const reservationDate = new Date(recurringReservationBase.startTime);
                reservationDate.setUTCHours(0, 0, 0, 0);
                reservationDay = recurringReservationBase.startTime.getDay();
            }

            const currentDate = new Date(recurringReservationBase.startTime);
            while (true) {
                // Jump to next recurring reservation
                if (recurringReservationBase.recurring === Recurring.WEEKLY) {
                    currentDate.setUTCDate(currentDate.getUTCDate() + 7);
                }
                else if (
                    recurringReservationBase.recurring === Recurring.MONTHLY ||
                    recurringReservationBase.recurring === Recurring.MONTHLY_SAME_DATE
                ) {
                    currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                }
                else if (recurringReservationBase.recurring === Recurring.MONTHLY_SAME_DAY) {
                    currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                    const compareMonth = currentDate.getUTCMonth();
                    const firstDayOfMonth = getCurrentMonth(currentDate).getDay();

                    const dayDiff = mod(reservationDay - firstDayOfMonth, 7);
                    currentDate.setUTCDate(1 + dayDiff + weekNumber * 7);

                    // There are atleast 4 (wlog) mondays every month but possibly 5,
                    // so if the reservation is on the 5:th monday, move it to the 4:th
                    // monday for the months with only 4 mondays
                    if (currentDate.getUTCMonth() !== compareMonth) {
                        currentDate.setUTCDate(currentDate.getUTCDate() - 7);
                    }
                }

                const currentDateWithoutTime = new Date(currentDate);
                currentDateWithoutTime.setHours(0, 0, 0, 0);
                if (currentDateWithoutTime.valueOf() > recurringReservationBase.recurringUntil.valueOf()) {
                    break;
                }

                const fakeReservation = structuredClone(recurringReservationBase);
                const duration = fakeReservation.endTime.valueOf() - fakeReservation.startTime.valueOf();
                fakeReservation.startTime = new Date(currentDate);
                fakeReservation.endTime = new Date(fakeReservation.startTime.valueOf() + duration);

                // Don't return recurring reservations outside
                // the requested time interval
                if (!(fakeReservation.startTime <= queryEndTime && fakeReservation.endTime >= queryStartTime)) {
                    continue;
                }

                // Skip if this date is specifically deleted
                if (shouldSkip(fakeReservation)) {
                    continue;
                }

                // Don't show old reservations for guests
                if (!isManager && fakeReservation.endTime < oneWeekAgo) {
                    continue;
                }

                reservations.push(fakeReservation);
            }
        }
    }

    return reservations;
}

/**
 * Check if a recurring reservation should be skipped.
 * Happens when a single day of a recurring reservation
 * has been deleted.
 */
function shouldSkip(r: Reservation) {
    const startTimeValue = r.startTime.valueOf();
    const anyMatch = r.recurringSkip.some(s => s.valueOf() == startTimeValue);
    return anyMatch;
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