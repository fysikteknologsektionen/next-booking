// app/page.tsx

import { Spinner } from '@chakra-ui/react'
import Calendar from '@/components/calendar'

export default async function Home() {
  return (
    <main>
      {/* <Spinner></Spinner> */}
      <Calendar></Calendar>
    </main>
  )
}
