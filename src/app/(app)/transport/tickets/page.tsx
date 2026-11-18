import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { TicketsManager, type Product } from '@/components/transport/TicketsManager';

export const metadata = { title: 'Tickets' };

export default async function TicketsPage() {
  await requireUser();
  const products = await prisma.ticketProduct.findMany({ where: { active: true }, orderBy: { priceCents: 'asc' } });
  const serialized: Product[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    rides: p.rides,
    validityMinutes: p.validityMinutes,
    modes: p.modes,
  }));

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Achetez vos tickets et affichez votre titre de transport numérique."
        back={{ href: '/transport', label: 'Transport' }}
      />
      <TicketsManager products={serialized} />
    </div>
  );
}