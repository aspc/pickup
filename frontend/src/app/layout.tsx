import { Inter, Playfair_Display } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'
import RideLinkHeader from '@/components/RideLinkHeader'
import RideLinkFooter from '@/components/RideLinkFooter'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/providers/AuthProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'RideLink',
  description: 'Your AI powered RideShare App',
  icons: {
    icon: [{ url: '/favicon.ico?v=2', sizes: 'any' }],
    shortcut: '/favicon.ico?v=2',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen">
        <NextTopLoader
          showSpinner={false}
          height={2}
          color="var(--color-sage)"
        />
        <AuthProvider>
          <TooltipProvider>
            <div className="flex min-h-screen flex-col">
              <RideLinkHeader />
              <div className="flex-1">{children}</div>
              <RideLinkFooter />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
