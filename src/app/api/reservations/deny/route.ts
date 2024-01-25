import { formatDate, isManager } from "@/lib/helper";
import { denyReservationServer } from "@/server/api/denyReservation";
import { getReservationByIDServer } from "@/server/api/getreservations";
import authOptions from "@/server/lib/authOptions";
import { sendEmail } from "@/server/lib/mailing";
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

    const result = await denyReservationServer(reservationID);

    const reservation = await getReservationByIDServer(reservationID);
    if (reservation) {
        const message = `Hej!\n\nDin bokning ${formatDate(reservation.date)} har blivit nekad\n\n/Fysikteknologsektionens lokalbokning`;
        const emailrespons = await sendEmail(reservation.clientEmail,"Bokning nekad", message);
        return NextResponse.json(result);
    }

    return new NextResponse('Could not find reservation', {
        status: 400,
        statusText: "Could not find reservation"
    });
}