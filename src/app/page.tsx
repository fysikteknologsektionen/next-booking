// app/page.tsx

"use client";

import Calendar from '@/components/calendar'
import ReservationsList from '@/components/reservationsList';
import { useVenueStore } from '@/lib/venueStore'
import { getVenuesClient } from '@/server/api/getvenues';
import { Heading } from '@chakra-ui/react'
import { Role } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function Home() {
  const setVenues = useVenueStore((state) => state.setVenues);

  useEffect(() => {
    (async () => {
      const venues = await getVenuesClient();
      setVenues(venues);
    })()
  }, [ setVenues ])

  const session = useSession()

  return (
    <main style={{
      padding: "2rem"
    }}>
      <Heading marginBottom="0.5em">Kalender</Heading>

      <Calendar></Calendar>

      {/* {session.data && (session.data?.user.role === Role.MANAGER || session.data?.user.role == Role.ADMIN) && ( */}
        <ReservationsList></ReservationsList>
      {/* )} */}
    </main>
  )
}
