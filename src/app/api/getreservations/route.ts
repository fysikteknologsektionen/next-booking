import { getReservationsServer } from "@/lib/fetching";
import { NextResponse } from "next/server";


export async function GET() {
    const reservations = await getReservationsServer();
    return NextResponse.json(reservations);
}