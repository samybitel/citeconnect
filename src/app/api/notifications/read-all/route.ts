import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { ApiError, ok, route, unauthorized } from '@/lib/api';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const { count } = await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    await audit({ userId: user.id, action: 'NOTIFICATIONS_READ_ALL', entity: 'Notification', ip: getClientIp(req), metadata: { count } });
    return ok({ success: true, count });
  });
}