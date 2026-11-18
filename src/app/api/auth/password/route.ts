import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser, destroyAllSessions, getSessionToken, hashPassword, verifyPassword } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { passwordChangeSchema } from '@/lib/validation';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();

    const input = validate(passwordChangeSchema, await parseBody(req));
    if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new ApiError(400, 'Mot de passe actuel incorrect.', { currentPassword: 'Mot de passe incorrect.' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.newPassword) } });
    const token = await getSessionToken();
    await destroyAllSessions(user.id, token ?? undefined);
    await audit({ userId: user.id, action: 'PASSWORD_CHANGED', entity: 'User', entityId: user.id, ip: getClientIp(req) });
    await notify(user.id, 'SYSTEM', 'Mot de passe modifié', 'Votre mot de passe a été mis à jour. Les autres sessions ont été déconnectées.', '/account/security');

    return ok({ success: true });
  });
}