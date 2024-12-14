import { validateLocalDateString, validateVenueId } from "@/lib/helper";
import { checkOverlapServer } from "@/server/api/checkReservationOverlap";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const venueId = searchParams.get('venueId');

    if (
        startTime == null ||
        endTime == null ||
        venueId == null
    ) {
        return NextResponse.json({}, {
            status: 400,
            statusText: "Specify startTime, endTime and venueId",
        });
    }

    if (
        !validateLocalDateString(startTime) ||
        !validateLocalDateString(endTime) ||
        !validateVenueId(venueId)
    ) {
        return NextResponse.json({}, {
            status: 400,
            statusText: "Invalid startTime, endTime or venueId",
        });
    }

    const isOverlapping = await checkOverlapServer(startTime, endTime, venueId);

    return NextResponse.json({
        isOverlapping
    });
}