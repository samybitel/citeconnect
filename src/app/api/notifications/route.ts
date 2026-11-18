import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { ApiError, ok, route, unauthorized } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);
    return ok({ notifications, unread });
  });
}

export async function DELETE(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const { count } = await prisma.notification.deleteMany({ where: { userId: user.id } });
    await audit({ userId: user.id, action: 'NOTIFICATIONS_CLEARED', entity: 'Notification', ip: getClientIp(req), metadata: { count } });
    return ok({ success: true, count });
  });
}