import { isManager } from "@/lib/helper";
import { denyReservationServer } from "@/server/api/denyReservationServer";
import authOptions from "@/server/lib/authOptions";
import { Reservation } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const res = await request.json();
    const { reservationID } = res;

    const session = await getServerSession(authOptions);

    if (!isManager(session)) {
        return new NextResponse('You are not authorized to perform this action', {
            status: 401,
            statusText: "You are not authorized to perform this action"
        });
    }

    const updatedReservation = <Reservation>{};
    const ok = await denyReservationServer(updatedReservation, reservationID, session?.user.id);

    if (!ok) {
        return new NextResponse('Could not deny reservation', {
            status: 400,
            statusText: "Could not deny reservation"
        });
    }

    return NextResponse.json(updatedReservation);
}