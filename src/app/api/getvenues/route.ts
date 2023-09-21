import { getReservationsServer } from "@/lib/fetching";
import { NextResponse } from "next/server";
import { getVenuesServer } from "@/lib/fetching";


export async function GET() {
    const reservations = await getVenuesServer();
    return NextResponse.json(reservations);
}