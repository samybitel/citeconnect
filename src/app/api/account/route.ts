import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { profileSchema } from '@/lib/validation';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const changeRequests = await prisma.changeRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return ok({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        birthDate: user.birthDate,
        phone: user.phone,
        avatarPath: user.avatarPath,
        isDemo: user.isDemo,
        createdAt: user.createdAt,
        address: user.address,
      },
      changeRequests,
    });
  });
}

export async function PATCH(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const input = validate(profileSchema, await parseBody(req));
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { firstName: input.firstName, lastName: input.lastName, phone: input.phone || null },
    });
    await audit({ userId: user.id, action: 'PROFILE_UPDATED', entity: 'User', entityId: user.id, ip: getClientIp(req) });
    return ok({ user: { firstName: updated.firstName, lastName: updated.lastName, phone: updated.phone } });
  });
}