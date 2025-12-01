import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import ConditionalTopNavbar from '@/components/ConditionalTopNavbar'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <Providers>
          <ConditionalTopNavbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}