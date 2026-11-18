import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { SubscriptionsManager, type Plan } from '@/components/transport/SubscriptionsManager';

export const metadata = { title: 'Abonnements' };

export default async function SubscriptionsPage() {
  await requireUser();
  const plans = await prisma.transportPlan.findMany({ where: { active: true }, orderBy: { priceCents: 'asc' } });
  const serialized: Plan[] = plans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    durationDays: p.durationDays,
    modes: p.modes,
    popular: p.popular,
  }));

  return (
    <div>
      <PageHeader
        title="Abonnements"
        description="Voyages illimités sur tout le réseau : bus, train et tramway."
        back={{ href: '/transport', label: 'Transport' }}
      />
      <SubscriptionsManager plans={serialized} />
    </div>
  );
}