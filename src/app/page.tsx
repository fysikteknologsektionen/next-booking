// app/page.tsx

"use client";

import Calendar from '@/components/calendar'
import ReservationsList from '@/components/reservationsList';
import { useVenueStore } from '@/lib/venueStore'
import { getVenuesClient } from '@/server/api/getvenues';
import { Heading } from '@chakra-ui/react'
import { Role } from '@prisma/client';
import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { useState, useEffect } from 'react';

export default function Home() {
  const setVenues = useVenueStore((state) => state.setVenues);
  const [session, setSession] = useState<Session>();

  useEffect(() => {
    (async () => {
      const venues = await getVenuesClient();
      setVenues(venues);
      const curSession = await getSession();
      if (curSession) setSession(curSession);
    })()
  }, [ setVenues ])

  const isManager = session && (session.user.role === Role.MANAGER || session.user.role === Role.ADMIN);

  return (
    <main style={{
      padding: "2rem"
    }}>
      <Heading marginBottom="0.5em">Kalender</Heading>

      <Calendar></Calendar>

      {isManager && (
        <ReservationsList></ReservationsList>
      )}
    </main>
  )
}
