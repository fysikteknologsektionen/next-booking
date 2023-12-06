import './globals.css'
import styles from "./layout.module.css";
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from "./providers";
import Navbar from '@/components/navbar';
import { getServerSession } from 'next-auth';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lokalbokning',
  description: 'Bokningssystem för fysikteknologsektionen',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={session}>
          <Navbar></Navbar>
          <div className={styles.mainWrapper}>
            <main className={styles.main}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
