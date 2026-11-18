import Link from 'next/link';
import { ArrowRight, CalendarDays, FileText } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { Icon } from '@/components/icons';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const metadata = { title: 'Service public' };

export default async function ServicesPage() {
  const user = await requireUser();
  const now = new Date();
  const [dossierCount, upcomingCount] = await Promise.all([
    prisma.dossier.count({ where: { userId: user.id } }),
    prisma.appointment.count({ where: { userId: user.id, status: 'CONFIRMED', date: { gte: now } } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Service public"
        description="Effectuez vos démarches administratives et prenez rendez-vous avec les services municipaux."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/services/appointments" className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy text-white shadow-sm">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-navy dark:text-white">Rendez-vous</p>
              {upcomingCount > 0 && <Badge tone="brand">{upcomingCount} à venir</Badge>}
            </div>
            <p className="truncate text-xs text-muted">Consultez les créneaux et réservez en quelques clics.</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
        </Link>

        <Link href="/services/dossiers" className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy text-white shadow-sm">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-navy dark:text-white">Mes démarches</p>
              {dossierCount > 0 && <Badge tone="neutral">{dossierCount} dossier{dossierCount > 1 ? 's' : ''}</Badge>}
            </div>
            <p className="truncate text-xs text-muted">Suivez l’avancement de vos dossiers administratifs.</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
        </Link>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">Catégories de démarches</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {SERVICE_CATEGORIES.map((c) => (
          <Link key={c.id} href={`/services/${c.slug}`} className="card group flex flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                <Icon name={c.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-navy dark:text-white">{c.label}</p>
                <p className="truncate text-xs text-muted">{c.short}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{c.description}</p>
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Besoin d’aide pour une démarche ? Prenez rendez-vous avec un agent qui vous accompagnera.
          </p>
          <Link href="/services/appointments/new" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Prendre rendez-vous <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}