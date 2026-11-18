import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { prisma } from '@/lib/db';
import { categoryBySlug } from '@/lib/constants';
import { Icon } from '@/components/icons';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = categoryBySlug(category);
  return { title: c ? c.label : 'Service' };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = categoryBySlug(category);
  if (!c) notFound();

  const procedures = await prisma.procedure.findMany({
    where: { category: c.id, active: true },
    orderBy: { title: 'asc' },
  });

  return (
    <div>
      <PageHeader
        title={c.label}
        description={c.description}
        back={{ href: '/services', label: 'Service public' }}
        action={
          <Link href={`/services/appointments/new?service=${c.id}`}>
            <Button variant="outline" size="sm"><CalendarDays className="h-3.5 w-3.5" /> Prendre rendez-vous</Button>
          </Link>
        }
      />

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-[#24304a] dark:bg-[#11192a]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          <Icon name={c.icon} className="h-5 w-5" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{c.description}</p>
      </div>

      {procedures.length === 0 ? (
        <EmptyState icon={<Icon name={c.icon} className="h-5 w-5" />} title="Aucune démarche disponible" description="Revenez prochainement, de nouvelles démarches seront ajoutées." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {procedures.map((p) => (
            <Link key={p.id} href={`/services/procedures/${p.id}`} className="card group flex flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-navy dark:text-white">{p.title}</p>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{p.summary}</p>
              <div className="mt-auto flex items-center gap-1.5 text-xs text-muted">
                <Clock className="h-3.5 w-3.5" /> Délai : {p.durationLabel}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}