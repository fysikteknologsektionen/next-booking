import prisma from "../lib/prisma";

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
