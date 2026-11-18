import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin, rateLimit } from '@/lib/security';
import { loginSchema } from '@/lib/validation';
import { ApiError, ok, parseBody, route, validate } from '@/lib/api';

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const ip = getClientIp(req);
    if (!rateLimit(`login:${ip}`, 12, 15 * 60 * 1000)) {
      throw new ApiError(429, 'Trop de tentatives. Réessayez dans quelques minutes.');
    }

    const input = validate(loginSchema, await parseBody(req));
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      await audit({ action: 'LOGIN_FAILED', entity: 'Auth', ip, metadata: { email: input.email } });
      throw new ApiError(401, 'Adresse électronique ou mot de passe incorrect.');
    }

    await createSession(user.id, { ip, userAgent: req.headers.get('user-agent') });
    await audit({ userId: user.id, action: 'LOGIN', entity: 'Auth', ip, userAgent: req.headers.get('user-agent') });

    return ok({
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, username: user.username },
    });
  });
}