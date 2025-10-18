import prisma from '../prisma'

export function createPhoto(data: {
  albumId: string
  uploaderId: string
  url: string
  thumbnailUrl?: string | null
  title?: string | null
  description?: string | null
  tags?: string[] // tag names
  meta?: {
    takenAt?: Date | null
    cameraMake?: string | null
    cameraModel?: string | null
    lensModel?: string | null
    focalLength?: number | null
    aperture?: number | null
    shutterSpeed?: string | null
    iso?: number | null
    latitude?: number | null
    longitude?: number | null
    altitude?: number | null
    width?: number | null
    height?: number | null
    orientation?: number | null
    flash?: boolean | null
    whiteBalance?: string | null
    exposureCompensation?: number | null
  }
}) {
  return prisma.photo.create({
    data: {
      url: data.url,
      thumbnailUrl: data.thumbnailUrl ?? null,
      title: data.title ?? null,
      description: data.description ?? null,
      album: { connect: { id: data.albumId } },
      uploader: { connect: { id: data.uploaderId } },
      tags: data.tags && data.tags.length > 0
        ? {
            create: data.tags.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          }
        : undefined,
      meta: data.meta
        ? {
            create: {
              takenAt: data.meta.takenAt ?? undefined,
              cameraMake: data.meta.cameraMake ?? undefined,
              cameraModel: data.meta.cameraModel ?? undefined,
              lensModel: data.meta.lensModel ?? undefined,
              focalLength: data.meta.focalLength ?? undefined,
              aperture: data.meta.aperture ?? undefined,
              shutterSpeed: data.meta.shutterSpeed ?? undefined,
              iso: data.meta.iso ?? undefined,
              latitude: data.meta.latitude ?? undefined,
              longitude: data.meta.longitude ?? undefined,
              altitude: data.meta.altitude ?? undefined,
              width: data.meta.width ?? undefined,
              height: data.meta.height ?? undefined,
              orientation: data.meta.orientation ?? undefined,
              flash: data.meta.flash ?? undefined,
              whiteBalance: data.meta.whiteBalance ?? undefined,
              exposureCompensation: data.meta.exposureCompensation ?? undefined,
            },
          }
        : undefined,
    },
  })
}

export function listPhotosByAlbum(albumId: string, params?: { skip?: number; take?: number }) {
  return prisma.photo.findMany({
    where: { albumId },
    skip: params?.skip,
    take: params?.take,
    orderBy: { createdAt: 'desc' },
    include: { tags: { include: { tag: true } }, meta: true },
  })
}

export function getPhotoById(id: string) {
  return prisma.photo.findUnique({ where: { id }, include: { tags: { include: { tag: true } }, meta: true } })
}

export async function addTagToPhoto(photoId: string, tagName: string) {
  const tag = await ensureTag(tagName)
  return prisma.photoTag.upsert({
    where: { photoId_tagId: { photoId, tagId: tag.id } },
    update: {},
    create: {
      photo: { connect: { id: photoId } },
      tag: { connect: { id: tag.id } },
    },
  })
}

export function removeTagFromPhoto(photoId: string, tagId: string) {
  return prisma.photoTag.delete({ where: { photoId_tagId: { photoId, tagId } } })
}

async function ensureTag(name: string) {
  const existing = await prisma.tag.findUnique({ where: { name } })
  if (existing) return existing
  return prisma.tag.create({ data: { name } })
}
