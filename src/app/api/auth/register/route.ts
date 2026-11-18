import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession, hashPassword } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin, rateLimit } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { registerSchema } from '@/lib/validation';
import { ApiError, ok, parseBody, route, validate } from '@/lib/api';

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const ip = getClientIp(req);
    if (!rateLimit(`register:${ip}`, 6, 60 * 60 * 1000)) {
      throw new ApiError(429, 'Trop de créations de compte. Réessayez plus tard.');
    }

    const input = validate(registerSchema, await parseBody(req));
    const email = input.email.toLowerCase();
    const birth = new Date(input.birthDate);
    if (Number.isNaN(birth.getTime())) throw new ApiError(400, 'Date de naissance invalide.', { birthDate: 'Date invalide.' });
    const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (age < 0 || age > 120) throw new ApiError(400, 'Date de naissance invalide.', { birthDate: 'Date invalide.' });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: input.username }] },
      select: { email: true, username: true },
    });
    if (existing) {
      const issues: Record<string, string> = {};
      if (existing.email === email) issues.email = 'Cette adresse électronique est déjà utilisée.';
      if (existing.username === input.username) issues.username = 'Cet identifiant est déjà pris.';
      throw new ApiError(409, 'Un compte existe déjà avec ces informations.', issues);
    }

    const user = await prisma.user.create({
      data: {
        email,
        username: input.username,
        passwordHash: await hashPassword(input.password),
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: birth,
        phone: input.phone || null,
      },
    });

    await createSession(user.id, { ip, userAgent: req.headers.get('user-agent') });
    await audit({ userId: user.id, action: 'ACCOUNT_CREATED', entity: 'User', entityId: user.id, ip });
    await notify(user.id, 'SYSTEM', 'Bienvenue sur CiteConnect', 'Votre compte a été créé. Complétez votre profil pour profiter de tous les services.', '/account');

    return ok({ user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, username: user.username } }, 201);
  });
}