import { NextResponse } from "next/server";
import { getVenuesServer } from "@/server/api/getvenues";


export async function GET() {
    const reservations = await getVenuesServer();
    return NextResponse.json(reservations);
}