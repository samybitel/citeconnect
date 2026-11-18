import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { daysUntil, formatDate } from '@/lib/utils';
import { Icon } from '@/components/icons';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const metadata = { title: 'Transport' };

const LINKS = [
  { href: '/transport/subscriptions', icon: 'card', title: 'Abonnements', desc: 'Souscrivez, consultez et renouvelez votre abonnement.' },
  { href: '/transport/tickets', icon: 'ticket', title: 'Tickets', desc: 'Achetez des tickets et affichez votre titre numérique.' },
  { href: '/transport/nfc', icon: 'nfc', title: 'NFC Express', desc: 'Validez vos voyages sans contact (simulation).' },
  { href: '/transport/modes', icon: 'bus', title: 'Moyens de transport', desc: 'Bus, train et tramway : lignes et informations.' },
];

export default async function TransportPage() {
  const user = await requireUser();
  const now = new Date();
  const [subscription, validTickets] = await Promise.all([
    prisma.subscription.findFirst({ where: { userId: user.id, status: 'ACTIVE', endDate: { gte: now } }, include: { plan: true }, orderBy: { endDate: 'asc' } }),
    prisma.ticket.count({ where: { userId: user.id, status: 'VALID' } }),
  ]);
  const subDays = subscription ? daysUntil(subscription.endDate) : null;

  return (
    <div>
      <PageHeader title="Transport" description="Abonnements, tickets et validation sans contact pour tous vos déplacements." />

      <div className="grid gap-4 sm:grid-cols-2">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy text-white shadow-sm">
              <Icon name={l.icon} className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy dark:text-white">{l.title}</p>
              <p className="truncate text-xs text-muted">{l.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">Abonnement actuel</p>
              {subscription && <StatusBadge kind="subscription" status={subscription.status} />}
            </div>
            {subscription ? (
              <div className="mt-3">
                <p className="text-lg font-semibold text-navy dark:text-white">{subscription.plan.name}</p>
                <p className="text-xs text-muted">Bus · Train · Tramway</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Expire le {formatDate(subscription.endDate)}</span>
                  {subDays !== null && <Badge tone={subDays <= 7 ? 'warning' : 'brand'}>{subDays > 0 ? `${subDays} j restants` : 'Expiré'}</Badge>}
                </div>
                <Link href="/transport/subscriptions" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Gérer mon abonnement <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">Aucun abonnement actif.</p>
                <Link href="/transport/subscriptions" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Voir les formules <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">Tickets disponibles</p>
            <p className="mt-3 text-3xl font-bold text-navy dark:text-white">{validTickets}</p>
            <p className="text-xs text-muted">ticket{validTickets > 1 ? 's' : ''} valide{validTickets > 1 ? 's' : ''} dans votre poche</p>
            <Link href="/transport/tickets" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Acheter ou consulter <ArrowRight className="h-3.5 w-3.5" /></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}