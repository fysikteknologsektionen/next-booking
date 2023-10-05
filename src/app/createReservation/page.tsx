import { getVenuesServer } from "@/server/api/getvenues"
import BookingPage from "./bookingPage"

export default async function Home() {
    const venues = await getVenuesServer()

    return (
        <BookingPage
            venues={venues}
        ></BookingPage>
    )
}