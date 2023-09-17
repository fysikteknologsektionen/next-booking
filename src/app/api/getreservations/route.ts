import { getReservationsServer } from "@/lib/fetching";
import { NextResponse } from "next/server";


export async function GET(request:Request) {
    const { searchParams } = new URL(request.url)


    const startTimeUnix = searchParams.get('startTime') ?? "0";
    const endTimeUnix = searchParams.get('endTime') ?? "0"
    const startTime = new Date(parseInt(startTimeUnix))
    const endTime = new Date(parseInt(endTimeUnix))


    const reservations = await getReservationsServer(startTime, endTime);
    return NextResponse.json(reservations);
}