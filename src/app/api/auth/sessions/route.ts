import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser, destroyAllSessions, getSessionToken } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { ApiError, ok, route, unauthorized } from '@/lib/api';

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const token = await getSessionToken();
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, expiresAt: true, userAgent: true, ip: true },
    });
    return ok({
      sessions: sessions.map((s) => ({
        id: s.id.slice(-8),
        current: s.id === token,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        userAgent: s.userAgent,
        ip: s.ip,
      })),
    });
  });
}

export async function DELETE(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const token = await getSessionToken();
    await destroyAllSessions(user.id, token ?? undefined);
    await audit({ userId: user.id, action: 'SESSIONS_REVOKED', entity: 'Session', ip: getClientIp(req) });
    return ok({ success: true });
  });
}