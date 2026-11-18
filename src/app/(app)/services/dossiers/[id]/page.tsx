import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, FileText, Hash } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { categoryById } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';

const DATA_LABELS: Record<string, string> = {
  type: 'Type de demande',
  nom: 'Nom',
  prenom: 'Prénom',
  dateNaissance: 'Date de naissance',
  composition: 'Composition du foyer',
  note: 'Précisions',
  demandeur: 'Demandeur',
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.dossier.findUnique({ where: { id }, include: { procedure: true } });
  return { title: d ? d.procedure.title : 'Dossier' };
}

export default async function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const dossier = await prisma.dossier.findFirst({
    where: { id, userId: user.id },
    include: { procedure: true, events: { orderBy: { createdAt: 'asc' } } },
  });
  if (!dossier) notFound();

  const category = categoryById(dossier.procedure.category);
  const data = (dossier.data ?? {}) as Record<string, unknown>;
  const entries = Object.entries(data).filter(([, v]) => typeof v === 'string' || typeof v === 'number');

  return (
    <div>
      <PageHeader
        title={dossier.procedure.title}
        description={dossier.procedure.summary}
        back={{ href: '/services/dossiers', label: 'Mes démarches' }}
        action={<StatusBadge kind="dossier" status={dossier.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-500" /> Suivi du dossier</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-6 border-l border-slate-200 pl-6 dark:border-[#24304a]">
                {dossier.events.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-brand-500 dark:border-[#11192a]" />
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{ev.label}</p>
                      <StatusBadge kind="dossier" status={ev.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{formatDateTime(ev.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {entries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Informations transmises</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-slate-200/70 dark:divide-[#24304a]">
                  {entries.map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <dt className="text-sm text-muted">{DATA_LABELS[key] ?? key}</dt>
                      <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Hash className="h-4 w-4 text-brand-500" /> Référence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="rounded-xl bg-slate-50 px-3 py-2 font-mono text-sm font-medium text-slate-800 dark:bg-[#0d1526] dark:text-slate-100">{dossier.reference}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Déposé le</span>
                <span className="text-slate-700 dark:text-slate-200">{formatDate(dossier.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Dernière mise à jour</span>
                <span className="text-slate-700 dark:text-slate-200">{formatDate(dossier.updatedAt)}</span>
              </div>
              {dossier.isDemo && <Badge tone="warning">Dossier de démonstration</Badge>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand-500" /> Démarche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {category && <Badge tone="brand">{category.label}</Badge>}
              <p className="text-sm text-slate-600 dark:text-slate-300">{dossier.procedure.summary}</p>
              <p className="text-xs text-muted">Délai indicatif : {dossier.procedure.durationLabel}</p>
              <Link href={`/services/procedures/${dossier.procedureId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                Voir la fiche de la démarche
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}