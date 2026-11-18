import Link from 'next/link';
import { ArrowRight, Bell, CalendarDays, ChevronRight, FileText, Ticket } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { APP_NAME, SERVICE_CATEGORIES } from '@/lib/constants';
import { calcAge, daysUntil, formatDate, formatTime, fullName, greeting } from '@/lib/utils';
import { Icon } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata = { title: 'Tableau de bord' };

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();

  const [appointments, subscription, notifications, dossiers, documents] = await Promise.all([
    prisma.appointment.findMany({ where: { userId: user.id, status: 'CONFIRMED', date: { gte: now } }, orderBy: { date: 'asc' }, take: 3 }),
    prisma.subscription.findFirst({ where: { userId: user.id, status: 'ACTIVE' }, include: { plan: true }, orderBy: { endDate: 'asc' } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: [{ read: 'asc' }, { createdAt: 'desc' }], take: 4 }),
    prisma.dossier.findMany({ where: { userId: user.id }, include: { procedure: true }, orderBy: { updatedAt: 'desc' }, take: 3 }),
    prisma.document.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 2 }),
  ]);

  const unread = notifications.filter((n) => !n.read).length;
  const subDays = subscription ? daysUntil(subscription.endDate) : null;

  return (
    <div className="space-y-6">
      {/* Bandeau de bienvenue */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-navy p-6 text-white sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <Avatar src={user.avatarPath ? '/api/account/avatar' : undefined} firstName={user.firstName} lastName={user.lastName} size="lg" className="ring-white/20" />
          <div>
            <p className="text-sm text-white/70">{greeting()},</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{fullName(user)}</h1>
            <p className="mt-1 text-sm text-white/70">
              {formatDate(now)} · {calcAge(user.birthDate)} ans · identifiant {user.username}
            </p>
          </div>
        </div>
        <p className="relative mt-5 max-w-lg text-sm text-white/80">
          Bienvenue sur {APP_NAME}. Retrouvez ci-dessous vos prochains rendez-vous, votre abonnement et vos démarches en cours.
        </p>
      </section>

      {/* Accès rapide aux modules */}
      <section className="grid gap-4 sm:grid-cols-3">
        <QuickCard href="/account" icon="user" index="01" title="Mon compte" desc="Profil, adresse et documents officiels." />
        <QuickCard href="/services" icon="scroll" index="02" title="Service public" desc="Démarches et prise de rendez-vous." />
        <QuickCard href="/transport" icon="bus" index="03" title="Transport" desc="Abonnements, tickets et NFC Express." />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Prochains rendez-vous */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-500" /> Prochains rendez-vous</CardTitle>
            <Link href="/services/appointments" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Tout voir</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length === 0 ? (
              <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="Aucun rendez-vous à venir" description="Prenez rendez-vous avec un service municipal en quelques clics." action={<Link href="/services/appointments/new" className="text-sm font-medium text-brand-600 hover:underline">Prendre rendez-vous</Link>} className="py-8" />
            ) : (
              appointments.map((a) => (
                <Link key={a.id} href="/services/appointments" className="flex items-center gap-3 rounded-xl border border-slate-200/70 p-3 transition-colors hover:bg-slate-50 dark:border-[#24304a] dark:hover:bg-[#172138]">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                    <span className="text-base font-bold leading-none">{new Date(a.date).getDate()}</span>
                    <span className="text-[10px] uppercase">{new Date(a.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{a.serviceLabel}</p>
                    <p className="truncate text-xs text-muted">{formatTime(a.date)} · {a.motif}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Abonnement transport */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Ticket className="h-4 w-4 text-brand-500" /> Abonnement transport</CardTitle>
            <Link href="/transport/subscriptions" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Gérer</Link>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="rounded-2xl border border-slate-200/70 p-4 dark:border-[#24304a]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-navy dark:text-white">{subscription.plan.name}</p>
                    <p className="text-xs text-muted">Bus · Train · Tramway</p>
                  </div>
                  <StatusBadge kind="subscription" status={subscription.status} />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted">Expire le</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatDate(subscription.endDate)}</p>
                  </div>
                  {subDays !== null && (
                    <Badge tone={subDays <= 7 ? 'warning' : 'brand'}>{subDays > 0 ? `${subDays} j restants` : 'Expiré'}</Badge>
                  )}
                </div>
                <Link href="/transport/subscriptions" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                  Renouveler l’abonnement <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <EmptyState icon={<Ticket className="h-5 w-5" />} title="Aucun abonnement actif" description="Souscrivez à un abonnement pour voyager sur tout le réseau." action={<Link href="/transport/subscriptions" className="text-sm font-medium text-brand-600 hover:underline">Voir les abonnements</Link>} className="py-8" />
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-500" /> Notifications
              {unread > 0 && <Badge tone="brand">{unread} non lues</Badge>}
            </CardTitle>
            <Link href="/notifications" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Centre</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <EmptyState icon={<Bell className="h-5 w-5" />} title="Aucune notification" className="py-8" />
            ) : (
              notifications.map((n) => (
                <Link key={n.id} href={n.link ?? '/notifications'} className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-[#172138]">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-brand-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${n.read ? 'text-slate-600 dark:text-slate-300' : 'font-semibold text-slate-800 dark:text-slate-100'}`}>{n.title}</p>
                    <p className="truncate text-xs text-muted">{n.body}</p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Démarches en cours */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand-500" /> Dernières démarches</CardTitle>
            <Link href="/services/dossiers" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Tout voir</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {dossiers.length === 0 ? (
              <EmptyState icon={<FileText className="h-5 w-5" />} title="Aucune démarche" description="Commencez une démarche depuis l’espace service public." action={<Link href="/services" className="text-sm font-medium text-brand-600 hover:underline">Explorer les services</Link>} className="py-8" />
            ) : (
              dossiers.map((d) => (
                <Link key={d.id} href="/services/dossiers" className="flex items-center gap-3 rounded-xl border border-slate-200/70 p-3 transition-colors hover:bg-slate-50 dark:border-[#24304a] dark:hover:bg-[#172138]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{d.procedure.title}</p>
                    <p className="truncate text-xs text-muted">Réf. {d.reference}</p>
                  </div>
                  <StatusBadge kind="dossier" status={d.status} />
                </Link>
              ))
            )}
            {documents.length > 0 && (
              <div className="border-t border-slate-200/70 pt-3 dark:border-[#24304a]">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Documents récents</p>
                <div className="flex flex-wrap gap-2">
                  {documents.map((doc) => (
                    <Link key={doc.id} href="/account/documents" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-[#172138] dark:text-slate-300 dark:hover:bg-[#1c2740]">
                      <FileText className="h-3.5 w-3.5" /> {doc.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Catégories de services */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Services publics</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SERVICE_CATEGORIES.map((c) => (
            <Link key={c.id} href={`/services/${c.slug}`} className="card flex flex-col gap-2 p-4 transition-shadow hover:shadow-card-hover">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                <Icon name={c.icon} className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.label}</p>
              <p className="text-xs text-muted">{c.short}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickCard({ href, icon, index, title, desc }: { href: string; icon: string; index: string; title: string; desc: string }) {
  return (
    <Link href={href} className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy text-white shadow-sm">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-navy dark:text-white">{title}</p>
          <span className="text-xs font-semibold text-slate-300 dark:text-slate-600">{index}</span>
        </div>
        <p className="truncate text-xs text-muted">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
    </Link>
  );
}