'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppointmentBooking } from '@/components/services/AppointmentBooking';
import { Card, CardContent } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';

function BookingInner() {
  const params = useSearchParams();
  const service = params.get('service') ?? undefined;
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <AppointmentBooking initialService={service} />
      </CardContent>
    </Card>
  );
}

export default function NewAppointmentPage() {
  return (
    <div>
      <PageHeader
        title="Prendre rendez-vous"
        description="Choisissez un service, une date et un créneau disponible."
        back={{ href: '/services/appointments', label: 'Mes rendez-vous' }}
      />
      <Suspense fallback={<PageLoader />}>
        <BookingInner />
      </Suspense>
    </div>
  );
}