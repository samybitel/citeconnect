import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';

const emailChangeSchema = z.object({
  field: z.literal('email'),
  newValue: z.string().email('Adresse électronique invalide.'),
});

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const requests = await prisma.changeRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    return ok({ requests });
  });
}

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const input = validate(emailChangeSchema, await parseBody(req));
    const newValue = input.newValue.toLowerCase();

    if (newValue === user.email) throw new ApiError(400, 'C’est déjà votre adresse actuelle.');
    const taken = await prisma.user.findUnique({ where: { email: newValue } });
    if (taken) throw new ApiError(409, 'Cette adresse électronique est déjà utilisée.');
    const pending = await prisma.changeRequest.findFirst({ where: { userId: user.id, field: 'email', status: 'PENDING' } });
    if (pending) throw new ApiError(409, 'Une demande de changement d’adresse est déjà en attente.');

    const request = await prisma.changeRequest.create({
      data: { userId: user.id, field: 'email', oldValue: user.email, newValue, status: 'PENDING' },
    });
    await audit({ userId: user.id, action: 'CHANGE_REQUEST_CREATED', entity: 'ChangeRequest', entityId: request.id, ip: getClientIp(req), metadata: { field: 'email' } });
    await notify(user.id, 'SYSTEM', 'Demande de modification envoyée', 'Votre changement d’adresse électronique est en attente de validation par nos services.', '/account');
    return ok({ request }, 201);
  });
}