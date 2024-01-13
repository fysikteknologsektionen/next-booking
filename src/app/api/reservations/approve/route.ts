import { approveReservationServer } from "@/server/api/approveReservation";
import { getReservationByIDServer } from "@/server/api/getreservations";
import authOptions from "@/server/lib/authOptions";
import { sendEmail } from "@/server/lib/mailing";
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
    const reservation = (await getReservationByIDServer(reservationID))[0];
    const message = `Din bokning ${reservation.date} är godkänd`
    const emailrespons = await sendEmail(reservation.clientEmail,"Bokning godkänd", message);

    return NextResponse.json(result);
}