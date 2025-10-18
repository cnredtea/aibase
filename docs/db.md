# Database setup (Prisma + PostgreSQL)

This project uses Prisma as the ORM and PostgreSQL as the database.

## Prerequisites
- Node.js 18+
- A running PostgreSQL instance

## 1) Configure environment
Copy the example env file and set your database URL:

```bash
cp .env.example .env
# Then edit .env and set DATABASE_URL
```

PostgreSQL connection string format:

```
postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public
```

## 2) Install dependencies
```bash
npm install
```

## 3) Generate Prisma Client
```bash
npm run prisma:generate
```

## 4) Apply migrations
For local development, run:
```bash
npm run db:migrate
```
For CI/CD or production environments, use:
```bash
npm run db:deploy
```

## 5) Seed sample data
```bash
npm run db:seed
```
This creates an admin user (admin@example.com) and some sample albums/photos/tags.

## 6) Inspect data with Prisma Studio
```bash
npm run prisma:studio
```

## Project files
- prisma/schema.prisma – Prisma data model
- prisma/migrations/ – SQL migrations
- prisma/seed.js – Seed script
- lib/prisma.ts – Prisma Client singleton
- lib/repositories/ – Simple repository utilities for Users, Albums, and Photos

## Example usage
```ts
import prisma from '@/lib/prisma'

export async function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
}
```
