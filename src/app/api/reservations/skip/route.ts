import { isManager } from "@/lib/helper";
import { skipReservationServer } from "@/server/api/skipReservation";
import authOptions from "@/server/lib/authOptions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const res = await request.json();
    const { reservationID, startTime } = res;

    const session = await getServerSession(authOptions);
    if (!isManager(session)) {
        return new NextResponse('You are not authorized to perform this action', {
            status: 401,
            statusText: "You are not authorized to perform this action"
        });
    }

    try {
        const result = await skipReservationServer(reservationID, startTime);
        return NextResponse.json(result);
    }
    catch (e) {
        console.error(e);
        return new NextResponse("Internal Server Error", {
            status: 500,
            statusText: "Internal Server Error"
        });
    }
}