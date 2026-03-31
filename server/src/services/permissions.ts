import { prisma } from "../models/prisma.js";

export async function listPermissions() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });

  const grouped: Record<string, typeof permissions> = {};
  for (const perm of permissions) {
    if (!grouped[perm.module]) grouped[perm.module] = [];
    grouped[perm.module].push(perm);
  }

  return { permissions, grouped };
}

export async function createPermission(data: {
  name: string;
  description?: string;
  module: string;
}) {
  return prisma.permission.create({ data });
}

export async function updatePermission(
  id: string,
  data: { name?: string; description?: string; module?: string },
) {
  return prisma.permission.update({ where: { id }, data });
}

export async function deletePermission(id: string) {
  const permission = await prisma.permission.findUnique({
    where: { id },
    include: { _count: { select: { roles: true } } },
  });

  if (!permission) return null;

  if (permission._count.roles > 0) {
    throw new Error("Cannot delete permission assigned to roles");
  }

  return prisma.permission.delete({ where: { id } });
}
