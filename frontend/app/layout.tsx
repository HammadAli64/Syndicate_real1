import type { Metadata } from 'next'
import './globals.css'
import { GlobalEyeBackdrop } from '@/components/GlobalEyeBackdrop'
import { NavApp } from '@/components/NavApp'

export const metadata: Metadata = {
  title: 'nav',
  description: 'Navigation',
  icons: {
    icon: '/blank-favicon.svg',
    shortcut: '/blank-favicon.svg',
    apple: '/blank-favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body suppressHydrationWarning>
        <GlobalEyeBackdrop />
        <NavApp />
        <main className="relative z-10 pt-24 sm:pt-28">{children}</main>
      </body>
    </html>
  )
}
