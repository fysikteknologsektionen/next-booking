// app/page.tsx

"use client";

import Calendar from '@/components/calendar'
import AdminReservationsList from '@/components/adminReservationsList';
import { useVenueStore } from '@/lib/venueStore'
import { getVenuesClient } from '@/server/api/getvenues';
import { Button, Heading, ListItem, OrderedList, Stack, Text, VStack } from '@chakra-ui/react'
import { Role } from '@prisma/client';
import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { useState, useEffect } from 'react';
import { Link } from '@chakra-ui/next-js';
import { isManager } from '@/lib/helper';
import { FeedbackSection, HowToCreateReservationSection } from './information/page';

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
      //console.log(curSession);
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
          <Heading as="h1" size="2xl">Lokalbokning</Heading>
        </div>

        <div>
          <Link href="/create">
            <Button colorScheme="blue">Boka lokal</Button>
          </Link>
        </div>

        <HowToCreateReservationSection />
        <FeedbackSection />

        <div>
          <Heading as="h2" size="lg" marginBottom="0.5em">Kalender</Heading>
          <Text marginBottom="1rem">I kalendern visas alla bokningar. Bokningar som väntar på godkännande visas blekta.</Text>
          <Calendar></Calendar>
        </div>

        {isManager(session) && (
          <AdminReservationsList></AdminReservationsList>
        )}
      </Stack>
    </>
  )
}
