import { Venue } from "@prisma/client";
import prisma from "./prisma";

// ------ Reservations ------
// Gets reservations by date. Used on the server
export async function getReservationsServer(startTime:Date, endTime:Date, venueIDs?:number[]) {
    const reservations = await prisma.reservation.findMany({
        where: {
            date: {
                gte: startTime, // Greater than or equal (start time)
                lte: endTime, // Less than or equal (end time)
            },
            ...(venueIDs ? {venueId: {in: venueIDs}}:{})
        }
    });
    return reservations;
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
    const res = await fetch("/api/getreservations?" + params);
    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data')
    }
    
    return res.json();
}


//------ Venues ------
// Gets all venues. Used on the server
export async function getVenuesServer() {
    const reservations = await prisma.venue.findMany();
    return reservations;
}

// Gets all venues. Used on the client
export async function getVenuesClient() {
    const res = await fetch("/api/getvenues");
    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data')
    }
    
    return res.json();
}