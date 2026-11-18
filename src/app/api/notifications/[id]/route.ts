import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';

export const runtime = 'nodejs';

const readSchema = z.object({ read: z.boolean() });

async function owned(userId: string, id: string) {
  const notif = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notif) throw new ApiError(404, 'Notification introuvable.');
  return notif;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const notif = await owned(user.id, id);
    const input = validate(readSchema, await parseBody(req));
    const updated = await prisma.notification.update({ where: { id: notif.id }, data: { read: input.read } });
    return ok({ notification: updated });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const notif = await owned(user.id, id);
    await prisma.notification.delete({ where: { id: notif.id } });
    await audit({ userId: user.id, action: 'NOTIFICATION_DELETED', entity: 'Notification', entityId: notif.id, ip: getClientIp(req) });
    return ok({ success: true });
  });
}