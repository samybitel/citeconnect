import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, Check, Clock, FileText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { categoryById } from '@/lib/constants';
import { PageHeader } from '@/components/layout/PageHeader';
import { StartDossier } from '@/components/services/StartDossier';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.procedure.findUnique({ where: { id } });
  return { title: p ? p.title : 'Démarche' };
}

export default async function ProcedurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const procedure = await prisma.procedure.findFirst({ where: { id, active: true } });
  if (!procedure) notFound();
  const category = categoryById(procedure.category);

  return (
    <div>
      <PageHeader
        title={procedure.title}
        description={procedure.summary}
        back={category ? { href: `/services/${category.slug}`, label: category.label } : { href: '/services', label: 'Service public' }}
        action={
          <>
            <Link href={`/services/appointments/new?service=${procedure.category}`}>
              <Button variant="outline" size="sm"><CalendarDays className="h-3.5 w-3.5" /> Rendez-vous</Button>
            </Link>
            <StartDossier procedureId={procedure.id} procedureTitle={procedure.title} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand-500" /> Présentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{procedure.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {category && <Badge tone="brand">{category.label}</Badge>}
                <Badge tone="neutral"><Clock className="h-3 w-3" /> {procedure.durationLabel}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Étapes de la procédure</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {procedure.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-300">{i + 1}</span>
                    <span className="pt-1 text-sm text-slate-600 dark:text-slate-300">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents requis</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {procedure.requiredDocuments.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {doc}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted">
                Préparez ces pièces avant de commencer. Vous pourrez les déposer depuis votre espace documents.
              </p>
              <Link href="/account/documents" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                Gérer mes documents
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Prêt à commencer ?</p>
              <p className="mt-1 text-xs text-muted">Votre demande sera enregistrée et suivie par le service concerné.</p>
              <div className="mt-4">
                <StartDossier procedureId={procedure.id} procedureTitle={procedure.title} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}