import prisma from '../prisma'

export async function createUser(data: {
  email: string
  name?: string | null
  passwordHash: string
  role?: 'ADMIN' | 'USER'
}) {
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name ?? null,
      passwordHash: data.passwordHash,
      role: data.role ?? 'USER',
    },
  })
}

export function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export function listUsers(params?: { skip?: number; take?: number }) {
  return prisma.user.findMany({
    skip: params?.skip,
    take: params?.take,
    orderBy: { createdAt: 'desc' },
  })
}

export function updateUser(id: string, data: {
  email?: string
  name?: string | null
  passwordHash?: string
  role?: 'ADMIN' | 'USER'
}) {
  return prisma.user.update({ where: { id }, data })
}

export function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } })
}
