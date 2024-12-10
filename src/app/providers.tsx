// app/providers.tsx
'use client'

import { Provider } from '@/components/ui/provider'
import { SessionProvider } from 'next-auth/react'

export function Providers({ 
  children,
  session
}: { 
  children: React.ReactNode,
  session: any
}) {
  return (
    <SessionProvider session={session}>
      {/* <CacheProvider> */}
        <Provider>
          {children}
        </Provider>
      {/* </CacheProvider> */}
    </SessionProvider>
  )
}