// app/page.tsx

import Calendar from '@/components/calendar'
import { Heading } from '@chakra-ui/react'

export default async function Home() {
  return (
    <main style={{
      padding: "2rem"
    }}>
      <Heading marginBottom="0.5em">Kalender</Heading>

      <Calendar></Calendar>
    </main>
  )
}
