import { approveReservationServer } from "@/server/api/approveReservation";
import authOptions from "@/server/lib/authOptions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const res = await request.json();
    const { reservationID } = res;

    const session = await getServerSession(authOptions);
    if (!session || !(session.user.role === "MANAGER" || session.user.role === "ADMIN")) {
        return new NextResponse('You are not authorized to perform this action', {
            status: 403,
            statusText: "You are not authorized to perform this action"
        });
    }

    const result = await approveReservationServer(reservationID);
    if (!result) {
        return new NextResponse('Collision! Could not approve reservation', {
            status: 403,
            statusText: "Collision! Could not approve reservation"
        });
    }

    return NextResponse.json(result);
}