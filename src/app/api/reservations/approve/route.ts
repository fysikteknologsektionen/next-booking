import { isManager } from "@/lib/helper";
import { approveReservationServer } from "@/server/api/approveReservationServer";
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

    const result = await approveReservationServer(reservationID, session?.user.id);
    if (!result) {
        return new NextResponse('Collision! Could not approve reservation', {
            status: 403,
            statusText: "Collision! Could not approve reservation"
        });
    } else if (result.reservation) {
        return new NextResponse('Could not find reservation', {
            status: 400,
            statusText: "Could not find reservation"
        });
    }


    return NextResponse.json(result);
}