import { formatDate, isManager } from "@/lib/helper";
import { denyReservationServer } from "@/server/api/denyReservation";
import { getReservationByIDServer } from "@/server/api/getreservations";
import authOptions from "@/server/lib/authOptions";
import { denyMail, sendEmail } from "@/server/lib/mailing";
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

    const message = denyMail(updatedReservation.date);
    const emailResponse = await sendEmail(updatedReservation.clientEmail, "Bokning nekad", message);
    
    // emailResponse should be checked so the mail actually
    // did get sent

    return NextResponse.json(updatedReservation);
}