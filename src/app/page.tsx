// app/page.tsx

"use client";

import Calendar from '@/components/calendar'
import AdminPanel from '@/components/adminPanel';
import { useVenueStore } from '@/lib/venueStore'
import { getVenuesClient } from '@/server/api/getvenues';
import { Button, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { useState, useEffect } from 'react';
import { isManager } from '@/lib/helper';
import { HowToCreateReservationSection } from '@/components/information';

export default function Home() {
  const setVenues = useVenueStore((state) => state.setVenues);
  const [session, setSession] = useState<Session>();

  useEffect(() => {
    (async () => {
      const venues = await getVenuesClient();
      setVenues(venues);
    })()
  }, [ setVenues ]);

  useEffect(() => {
    (async () => {
      const curSession = await getSession();
      if (!curSession) {
        return;
      }

      setSession(curSession);
    })()
  }, []);

  return (
    <>
      <Stack gap="3rem">
        <div>
          <Heading as="h1" size="5xl" fontWeight="bold">Lokalbokning</Heading>
        </div>

        <div>
          <Link href="/create">
            <Button colorPalette="blue">Boka lokal</Button>
          </Link>
        </div>

        <HowToCreateReservationSection />

        <div>
          <Heading as="h2" size="3xl" fontWeight="bold" marginBottom="0.5em">Kalender</Heading>
          <Text marginBottom="1rem">I kalendern visas alla bokningar. Bokningar som väntar på godkännande visas blekta.</Text>
          <Calendar></Calendar>
        </div>

        {isManager(session) && (
          <AdminPanel></AdminPanel>
        )}
      </Stack>
    </>
  )
}
