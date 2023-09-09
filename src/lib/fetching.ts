import prisma from "./prisma";

export async function getReservationsServer() {
    const reservations = await prisma.reservation.findMany();
    console.log("Is giving information server-side")
    return reservations;
}

export async function getReservationsClient() {
    const res = await fetch("/api/getreservations");
    console.log("Has fetched")
    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data')
    }
    
    return res.json();
}