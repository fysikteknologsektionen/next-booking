import { isManager } from "@/lib/helper";
import { deleteReservationServer } from "@/server/api/deleteReservation";
import authOptions from "@/server/lib/authOptions";
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

    const result = await deleteReservationServer(reservationID);
    return NextResponse.json(result);
}