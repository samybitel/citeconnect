import 'server-only';
import type { ServiceCategory } from '@prisma/client';
import { prisma } from './db';
import { getDaySlots } from './slots';
import { ApiError } from './api';

/** Vérifie qu'un créneau est réel, futur et libre. Renvoie la Date normalisée. */
export async function assertSlotAvailable(service: ServiceCategory, iso: string, excludeId?: string) {
  const requested = new Date(iso);
  if (Number.isNaN(requested.getTime())) throw new ApiError(400, 'Date de rendez-vous invalide.');

  const day = new Date(requested.getFullYear(), requested.getMonth(), requested.getDate());
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
  const booked = await prisma.appointment.findMany({
    where: {
      service,
      status: 'CONFIRMED',
      date: { gte: day, lte: dayEnd },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { date: true },
  });
  const bookedSet = new Set(booked.map((b) => b.date.toISOString()));
  const slot = getDaySlots(service, day, bookedSet).find((s) => s.iso === requested.toISOString());
  if (!slot || !slot.available) throw new ApiError(409, 'Ce créneau n’est plus disponible. Veuillez en choisir un autre.');
  return requested;
}