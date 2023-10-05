import { createReservationServer } from "@/server/api/createReservation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {

    const res = await request.json();
    const { reservationDetails } = res;
    const result = await createReservationServer(reservationDetails)

    return NextResponse.json(result);
}