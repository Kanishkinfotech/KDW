import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logAdminAction = async (
  adminId: string,
  action: string,
  entity: string,
  details?: string
) => {
  try {
    if (!adminId) return;
    const user = await prisma.user.findUnique({ where: { id: adminId } });
    if (user) {
      await prisma.auditLog.create({
        data: {
          adminId,
          action,
          entity,
          details,
        },
      });
    }
  } catch (error) {
    // We don't throw here to prevent failing the main request if logging fails
  }
};
