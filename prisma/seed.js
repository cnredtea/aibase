/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const dotenv = require('dotenv')

// Load environment variables from .env if present
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create or update admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      passwordHash: 'admin',
      role: 'ADMIN',
    },
  })

  // Create some tags
  const [nature, portrait, travel] = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'Nature' },
      update: {},
      create: { name: 'Nature', description: 'Nature and landscapes' },
    }),
    prisma.tag.upsert({
      where: { name: 'Portrait' },
      update: {},
      create: { name: 'Portrait', description: 'Portrait photography' },
    }),
    prisma.tag.upsert({
      where: { name: 'Travel' },
      update: {},
      create: { name: 'Travel', description: 'Travel and streets' },
    }),
  ])

  // Create sample albums
  const album1 = await prisma.album.create({
    data: {
      title: 'Sample Album 1',
      description: 'An example album with a few photos',
      owner: { connect: { id: admin.id } },
    },
  })

  const album2 = await prisma.album.create({
    data: {
      title: 'Sample Album 2',
      description: 'Another sample album',
      owner: { connect: { id: admin.id } },
    },
  })

  // Create photos in albums
  const photo1 = await prisma.photo.create({
    data: {
      url: 'https://example.com/photos/mountain.jpg',
      thumbnailUrl: 'https://example.com/photos/mountain-thumb.jpg',
      title: 'Mountain Peak',
      description: 'A beautiful mountain at sunrise',
      album: { connect: { id: album1.id } },
      uploader: { connect: { id: admin.id } },
      tags: {
        create: [
          { tag: { connect: { id: nature.id } } },
          { tag: { connect: { id: travel.id } } },
        ],
      },
    },
  })

  await prisma.photoMeta.create({
    data: {
      photoId: photo1.id,
      takenAt: new Date('2024-01-10T06:30:00.000Z'),
      cameraMake: 'Canon',
      cameraModel: 'EOS R6',
      lensModel: 'RF 24-70mm F2.8 L',
      focalLength: 70,
      aperture: 8,
      shutterSpeed: '1/200',
      iso: 200,
      latitude: 46.8523,
      longitude: -121.7603,
      altitude: 2000,
      width: 6000,
      height: 4000,
      orientation: 1,
      flash: false,
      whiteBalance: 'Auto',
      exposureCompensation: 0.0,
    },
  })

  const photo2 = await prisma.photo.create({
    data: {
      url: 'https://example.com/photos/city.jpg',
      thumbnailUrl: 'https://example.com/photos/city-thumb.jpg',
      title: 'City Lights',
      description: 'Night view of the city skyline',
      album: { connect: { id: album1.id } },
      uploader: { connect: { id: admin.id } },
      tags: {
        create: [
          { tag: { connect: { id: travel.id } } },
        ],
      },
    },
  })

  const photo3 = await prisma.photo.create({
    data: {
      url: 'https://example.com/photos/portrait.jpg',
      thumbnailUrl: 'https://example.com/photos/portrait-thumb.jpg',
      title: 'Portrait',
      description: 'Natural light portrait',
      album: { connect: { id: album2.id } },
      uploader: { connect: { id: admin.id } },
      tags: {
        create: [
          { tag: { connect: { id: portrait.id } } },
        ],
      },
    },
  })

  await prisma.photoMeta.create({
    data: {
      photoId: photo3.id,
      takenAt: new Date('2024-03-21T14:12:00.000Z'),
      cameraMake: 'Sony',
      cameraModel: 'A7 IV',
      lensModel: 'FE 85mm F1.8',
      focalLength: 85,
      aperture: 2.2,
      shutterSpeed: '1/500',
      iso: 100,
      width: 6000,
      height: 4000,
      orientation: 1,
    },
  })

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
