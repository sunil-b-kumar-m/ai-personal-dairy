import { prisma } from "../models/prisma.js";

export async function listRoles() {
  return prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRoleById(id: string) {
  return prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });
}

export async function createRole(data: {
  name: string;
  description?: string;
  isDefault?: boolean;
}) {
  if (data.isDefault) {
    await prisma.role.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.role.create({
    data,
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });
}

export async function updateRole(
  id: string,
  data: { name?: string; description?: string; isDefault?: boolean },
) {
  if (data.isDefault) {
    await prisma.role.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  return prisma.role.update({
    where: { id },
    data,
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });
}

export async function deleteRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!role) return null;

  if (role._count.users > 0) {
    throw new Error("Cannot delete role with assigned users");
  }

  return prisma.role.delete({ where: { id } });
}

export async function setRolePermissions(
  roleId: string,
  permissionIds: string[],
) {
  await prisma.rolePermission.deleteMany({ where: { roleId } });

  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
    });
  }

  return getRoleById(roleId);
}
