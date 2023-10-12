// app/page.tsx

"use client";

import Calendar from '@/components/calendar'
import { useVenueStore } from '@/lib/venueStore'
import { getVenuesClient } from '@/server/api/getvenues';
import { Heading } from '@chakra-ui/react'
import { useEffect, useState } from 'react';

export default function Home() {
  const setVenues = useVenueStore((state) => state.setVenues);

  useEffect(() => {
    (async () => {
      const venues = await getVenuesClient();
      setVenues(venues);
    })()
  }, [ setVenues ])

  return (
    <main style={{
      padding: "2rem"
    }}>
      <Heading marginBottom="0.5em">Kalender</Heading>

      <Calendar></Calendar>
    </main>
  )
}
