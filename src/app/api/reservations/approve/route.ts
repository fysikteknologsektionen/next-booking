import { approveReservationServer } from "@/server/api/approveReservation";
import authOptions from "@/server/lib/authOptions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const res = await request.json();
    const { reservationID } = res;

    let response;
    const session = await getServerSession(authOptions);
    
    if (session?.user.role === "MANAGER" || session?.user.role === "ADMIN") {
        const result = await approveReservationServer(reservationID);
        if (!result) response = new NextResponse('Collision! Could not approve reservation', {
            status: 400,
        });
        else response = NextResponse.json(result);
    } else {
        response = new NextResponse('You are not authorized to perform this action', {
            status: 403,
        });
    }
    
    return response;
}