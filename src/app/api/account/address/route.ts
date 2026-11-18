import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { addressSchema } from '@/lib/validation';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';

export async function PUT(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const input = validate(addressSchema, await parseBody(req));
    const address = await prisma.address.upsert({
      where: { userId: user.id },
      update: {
        street: input.street,
        complement: input.complement || null,
        postalCode: input.postalCode,
        city: input.city,
        country: input.country,
      },
      create: {
        userId: user.id,
        street: input.street,
        complement: input.complement || null,
        postalCode: input.postalCode,
        city: input.city,
        country: input.country,
      },
    });
    await audit({ userId: user.id, action: 'ADDRESS_UPDATED', entity: 'Address', entityId: address.id, ip: getClientIp(req) });
    return ok({ address });
  });
}