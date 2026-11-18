import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppointmentsManager } from '@/components/services/AppointmentsManager';
import type { AppointmentData } from '@/components/services/AppointmentBooking';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Rendez-vous' };

export default async function AppointmentsPage() {
  const user = await requireUser();
  const rows = await prisma.appointment.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } });
  const initial: AppointmentData[] = rows.map((a) => ({
    id: a.id,
    service: a.service,
    serviceLabel: a.serviceLabel,
    motif: a.motif,
    date: a.date.toISOString(),
    durationMin: a.durationMin,
    location: a.location,
    reference: a.reference,
    status: a.status,
    isDemo: a.isDemo,
  }));

  return (
    <div>
      <PageHeader
        title="Mes rendez-vous"
        description="Consultez, modifiez ou annulez vos rendez-vous avec les services municipaux."
        back={{ href: '/services', label: 'Service public' }}
        action={<Link href="/services/appointments/new"><Button size="sm"><CalendarPlus className="h-3.5 w-3.5" /> Prendre rendez-vous</Button></Link>}
      />
      <AppointmentsManager initial={initial} />
    </div>
  );
}