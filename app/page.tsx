"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-neon/20 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Build AI experiences faster with a beautiful dark starter
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui, and Framer Motion — pre-wired with a neon dark theme.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button asChild variant="neon">
              <Link href="#features">Explore features</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#about">Learn more</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="space-y-10">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-semibold"
        >
          Features
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            'Next.js 14 App Router',
            'TypeScript strict',
            'Tailwind & dark neon theme',
            'shadcn/ui components',
            'Framer Motion animations',
            'Zod env validation',
          ].map((title, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="rounded-lg border bg-card/50 p-6"
            >
              <h3 className="mb-2 font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="space-y-4">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-semibold"
        >
          About
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="max-w-2xl text-muted-foreground"
        >
          This starter provides a minimal, modern foundation for AI products. Customize the theme tokens, extend the component registry, and ship fast.
        </motion.p>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="space-y-6">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-semibold"
        >
          Get started
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-3"
        >
          <Button asChild variant="neon">
            <Link href="/api/health">Check API health</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="https://nextjs.org" target="_blank" rel="noreferrer">
              Next.js docs
            </Link>
          </Button>
        </motion.div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} aibase. Built with Next.js, Tailwind, shadcn/ui, and Framer Motion.
        </p>
      </footer>
    </div>
  )
}
