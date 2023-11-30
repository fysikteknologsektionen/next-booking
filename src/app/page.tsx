// app/page.tsx

"use client";

import Calendar from '@/components/calendar'
import ReservationsList from '@/components/reservationsList';
import { useVenueStore } from '@/lib/venueStore'
import { getVenuesClient } from '@/server/api/getvenues';
import { Heading, ListItem, OrderedList, Stack, Text, VStack } from '@chakra-ui/react'
import { Role } from '@prisma/client';
import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { useState, useEffect } from 'react';
import { Link } from '@chakra-ui/next-js';

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
    <>
      <Stack gap="3rem">
        <div>
          <Heading as="h2" size="lg" marginBottom="0.5em">Så här bokar du en lokal</Heading>
          <OrderedList>
            <ListItem>Klicka på <Text as="b"><Link href="/createReservation">Boka lokal</Link></Text>.</ListItem>
            <ListItem>Fyll i all info.</ListItem>
            <ListItem><Text as="b">Klart!</Text> Din bokning ska nu synas i kalendern nedan.</ListItem>
          </OrderedList>
        </div>

        <div>
          <Heading as="h2" size="lg" marginBottom="0.5em">Kalender</Heading>
          <Text marginBottom="1rem">I kalendern visas alla bokningar. Bokningar som väntar på godkännande visas blekta.</Text>
          <Calendar></Calendar>
        </div>

        {isManager && (
          <ReservationsList></ReservationsList>
        )}
      </Stack>
    </>
  )
}
