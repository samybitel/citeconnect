import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateShort } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const metadata = { title: 'Mes démarches' };

export default async function DossiersPage() {
  const user = await requireUser();
  const dossiers = await prisma.dossier.findMany({
    where: { userId: user.id },
    include: { procedure: true },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div>
      <PageHeader
        title="Mes démarches"
        description="Suivez l’avancement de vos dossiers administratifs."
        back={{ href: '/services', label: 'Service public' }}
        action={<Link href="/services"><Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5" /> Nouvelle démarche</Button></Link>}
      />

      {dossiers.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Aucune démarche en cours"
          description="Commencez une démarche depuis l’espace service public pour la suivre ici."
          action={<Link href="/services"><Button size="sm">Explorer les services</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {dossiers.map((d) => (
            <Link key={d.id} href={`/services/dossiers/${d.id}`} className="card group flex items-center gap-4 p-4 transition-all hover:shadow-card-hover">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{d.procedure.title}</p>
                  {d.isDemo && <Badge tone="warning">Démo</Badge>}
                </div>
                <p className="truncate text-xs text-muted">Réf. {d.reference} · mis à jour le {formatDateShort(d.updatedAt)}</p>
              </div>
              <StatusBadge kind="dossier" status={d.status} />
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}