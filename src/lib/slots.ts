import type { ServiceCategory } from '@prisma/client';

interface DaySchedule {
  open: number[]; // jours ouverts (0 = dimanche … 6 = samedi)
  ranges: [number, number][]; // plages en minutes depuis minuit
  slotMin: number;
}

const WEEKDAYS = [1, 2, 3, 4, 5];

export const SCHEDULES: Record<ServiceCategory, DaySchedule> = {
  ETAT_CIVIL: { open: WEEKDAYS, ranges: [[540, 990]], slotMin: 30 }, // 09:00–16:30
  URBANISME: { open: [1, 2, 4, 5], ranges: [[540, 720], [840, 960]], slotMin: 30 },
  LOGEMENT: { open: WEEKDAYS, ranges: [[570, 750], [840, 1020]], slotMin: 30 },
  SCOLAIRE: { open: WEEKDAYS, ranges: [[510, 690], [810, 990]], slotMin: 30 },
  ACCOUNT: { open: WEEKDAYS, ranges: [[540, 1020]], slotMin: 30 },
};

export interface Slot {
  iso: string;
  label: string;
  available: boolean;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

/** Créneaux théoriques d'une journée pour un service (vide si fermé). */
export function buildDaySlots(service: ServiceCategory, day: Date): Date[] {
  const schedule = SCHEDULES[service];
  if (!schedule.open.includes(day.getDay())) return [];
  const slots: Date[] = [];
  for (const [start, end] of schedule.ranges) {
    for (let m = start; m + schedule.slotMin <= end; m += schedule.slotMin) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, min, 0, 0));
    }
  }
  return slots;
}

export function getDaySlots(service: ServiceCategory, day: Date, booked: Set<string>): Slot[] {
  const now = Date.now();
  return buildDaySlots(service, day).map((d) => {
    const iso = d.toISOString();
    return {
      iso,
      label: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      available: !booked.has(iso) && d.getTime() > now,
    };
  });
}

export function isOpenDay(service: ServiceCategory, day: Date) {
  return SCHEDULES[service].open.includes(day.getDay());
}