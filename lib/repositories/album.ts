import prisma from '../prisma'

export function createAlbum(data: { title: string; description?: string | null; ownerId: string }) {
  return prisma.album.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      owner: { connect: { id: data.ownerId } },
    },
  })
}

export function getAlbumById(id: string) {
  return prisma.album.findUnique({ where: { id } })
}

export function getAlbumWithPhotos(id: string) {
  return prisma.album.findUnique({
    where: { id },
    include: { photos: { include: { tags: { include: { tag: true } }, meta: true } }, owner: true },
  })
}

export function listAlbumsByUser(ownerId: string, params?: { skip?: number; take?: number }) {
  return prisma.album.findMany({
    where: { ownerId },
    skip: params?.skip,
    take: params?.take,
    orderBy: { createdAt: 'desc' },
  })
}
