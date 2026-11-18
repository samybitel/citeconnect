import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { assertSlotAvailable } from '@/lib/appointments';
import { appointmentSchema } from '@/lib/validation';
import { APPOINTMENT_LOCATIONS, SERVICE_LABELS } from '@/lib/constants';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';
import { formatDate, formatTime, genReference } from '@/lib/utils';

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const appointments = await prisma.appointment.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });
    return ok({ appointments });
  });
}

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();

    const input = validate(appointmentSchema, await parseBody(req));
    const date = await assertSlotAvailable(input.service, input.date);

    const reference = genReference('RDV');
    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        service: input.service,
        serviceLabel: SERVICE_LABELS[input.service],
        motif: input.motif,
        date,
        durationMin: input.durationMin,
        status: 'CONFIRMED',
        location: APPOINTMENT_LOCATIONS[input.service],
        reference,
      },
    });

    await notify(user.id, 'APPOINTMENT_CONFIRMED', 'Rendez-vous confirmé', `Votre rendez-vous ${SERVICE_LABELS[input.service]} du ${formatDate(date)} à ${formatTime(date)} est confirmé.`, '/services/appointments');
    await audit({ userId: user.id, action: 'APPOINTMENT_CREATED', entity: 'Appointment', entityId: appointment.id, ip: getClientIp(req), metadata: { service: input.service } });

    return ok({ appointment }, 201);
  });
}