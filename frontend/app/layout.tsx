import type { Metadata } from 'next'
import './globals.css'
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
        <NavApp />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  )
}
