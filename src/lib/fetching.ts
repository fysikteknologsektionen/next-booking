import prisma from "./prisma";

// Gets reservations by date. Used on the server
export async function getReservationsServer(startTime:Date, endTime:Date) {

    const reservations = await prisma.reservation.findMany({
        where: {
            date: {
                gte: startTime, // Greater than or equal (start time)
                lte: endTime, // Less than or equal (end time)
            }
        }
    });
    return reservations;
}

// Gets reservations by date. Used on the client
export async function getReservationsClient(startTime:Date, endTime:Date) {
    const res = await fetch("/api/getreservations?" + new URLSearchParams({ // Send times as integers
        startTime: startTime.getTime().toString(),
        endTime: endTime.getTime().toString(),
    }));
    console.log("Has fetched")
    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data')
    }
    
    return res.json();
}