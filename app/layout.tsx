import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/layout/navbar'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'aibase',
    template: '%s | aibase',
  },
  description: 'Next.js 14 + Tailwind + shadcn/ui + Framer — dark neon starter',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background text-foreground')}>
        <ThemeProvider>
          <Navbar />
          <main className="container py-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
