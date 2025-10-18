"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
]

export function Navbar() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="text-base font-semibold">
          <span className="text-foreground">ai</span>
          <span className="text-neon drop-shadow-[0_0_8px_hsl(var(--neon)/0.8)]">base</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-muted-foreground transition-colors hover:text-foreground',
                pathname === l.href && 'text-foreground'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
