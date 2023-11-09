import prisma from "../lib/prisma";

// ------ Reservations ------
// Gets reservations by date. Used on the server
export async function getReservationsServer(startTime:Date, endTime:Date, venueIDs?:number[]) {
    const reservations = await prisma.reservation.findMany({
        where: {
            OR: [{
                startTime: {
                    gte: startTime,
                    lte: endTime,
                },
            }, {
                endTime: {
                    gte: startTime, // Greater than or equal (start time)
                    lte: endTime, // Less than or equal (end time)
                },
            }, {
                startTime: {
                    lte: startTime,
                },
                endTime: {
                    gte: endTime,
                },
            }],
            ...(venueIDs ? {venueId: {in: venueIDs}}:{})
        }
    });
    return reservations;
}

// Gets a reservation by id. Used on the server
export async function getReservationByIDServer(id:number) {
    const reservation = await prisma.reservation.findMany({
        where: {
            id: id,
        }
    });
    return reservation;
}

// Gets reservations by date. Used on the client
export async function getReservationsClient(startTime:Date, endTime:Date, venueIDs?:number[]) {
    const params = new URLSearchParams({ // Send times as integers
        startTime: startTime.getTime().toString(),
        endTime: endTime.getTime().toString(),
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