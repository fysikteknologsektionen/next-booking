import './globals.css'
import styles from "./layout.module.css";
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from "./providers";
import Navbar from '@/components/navbar';
import { getServerSession } from 'next-auth';
import Footer from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers session={session}>
          <Navbar></Navbar>

          <div className={styles.mainWrapper}>
            <main className={styles.main}>
              {children}
            </main>
          </div>
          
          <Footer></Footer>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
