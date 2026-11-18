import type { NextRequest } from 'next/server';
import type { ServiceCategory } from '@prisma/client';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { getDaySlots, isOpenDay } from '@/lib/slots';
import { ok, route, unauthorized, fail } from '@/lib/api';

const SERVICES: ServiceCategory[] = ['ETAT_CIVIL', 'URBANISME', 'LOGEMENT', 'SCOLAIRE', 'ACCOUNT'];

export async function GET(req: NextRequest) {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();

    const service = req.nextUrl.searchParams.get('service') as ServiceCategory | null;
    const date = req.nextUrl.searchParams.get('date');
    if (!service || !SERVICES.includes(service)) return fail('Service invalide.', 400);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Date invalide.', 400);

    const [y, m, d] = date.split('-').map(Number);
    const day = new Date(y, m - 1, d);
    if (!isOpenDay(service, day)) return ok({ open: false, slots: [] });

    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
    const booked = await prisma.appointment.findMany({
      where: { service, status: 'CONFIRMED', date: { gte: dayStart, lte: dayEnd } },
      select: { date: true },
    });
    const bookedSet = new Set(booked.map((b) => b.date.toISOString()));

    return ok({ open: true, slots: getDaySlots(service, day, bookedSet) });
  });
}