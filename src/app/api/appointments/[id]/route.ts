import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { assertSlotAvailable } from '@/lib/appointments';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';

const modifySchema = z.object({
  motif: z.string().min(3, 'Motif requis.').max(200).optional(),
  date: z.string().min(1).optional(),
  durationMin: z.number().int().min(15).max(120).optional(),
});

async function ownedEditable(userId: string, id: string) {
  const appt = await prisma.appointment.findFirst({ where: { id, userId } });
  if (!appt) throw new ApiError(404, 'Rendez-vous introuvable.');
  if (appt.status !== 'CONFIRMED' || appt.date.getTime() < Date.now()) {
    throw new ApiError(400, 'Seuls les rendez-vous à venir et confirmés peuvent être modifiés ou annulés.');
  }
  return appt;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const appt = await ownedEditable(user.id, id);

    const input = validate(modifySchema, await parseBody(req));
    if (input.motif === undefined && input.date === undefined && input.durationMin === undefined) {
      throw new ApiError(400, 'Aucune modification fournie.');
    }

    const data: { motif?: string; date?: Date; durationMin?: number } = {};
    if (input.motif !== undefined) data.motif = input.motif;
    if (input.durationMin !== undefined) data.durationMin = input.durationMin;
    if (input.date !== undefined) data.date = await assertSlotAvailable(appt.service, input.date, appt.id);

    const updated = await prisma.appointment.update({ where: { id: appt.id }, data });
    await notify(user.id, 'SYSTEM', 'Rendez-vous modifié', `Votre rendez-vous ${appt.serviceLabel} du ${formatDate(updated.date)} à ${formatTime(updated.date)} a été mis à jour.`, '/services/appointments');
    await audit({ userId: user.id, action: 'APPOINTMENT_MODIFIED', entity: 'Appointment', entityId: appt.id, ip: getClientIp(req) });

    return ok({ appointment: updated });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const appt = await ownedEditable(user.id, id);

    await prisma.appointment.update({ where: { id: appt.id }, data: { status: 'CANCELLED' } });
    await notify(user.id, 'SYSTEM', 'Rendez-vous annulé', `Votre rendez-vous ${appt.serviceLabel} du ${formatDate(appt.date)} à ${formatTime(appt.date)} a été annulé.`, '/services/appointments');
    await audit({ userId: user.id, action: 'APPOINTMENT_CANCELLED', entity: 'Appointment', entityId: appt.id, ip: getClientIp(req) });

    return ok({ success: true });
  });
}