'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, CalendarPlus, MapPin, Pencil, X } from 'lucide-react';
import { AppointmentBooking, type AppointmentData } from './AppointmentBooking';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/client';
import { formatDateShort, formatTime } from '@/lib/utils';

export function AppointmentsManager({ initial }: { initial: AppointmentData[] }) {
  const toast = useToast();
  const [appointments, setAppointments] = useState(initial);
  const [modifyTarget, setModifyTarget] = useState<AppointmentData | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentData | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await api<{ appointments: AppointmentData[] }>('/api/appointments');
      setAppointments(data.appointments);
    } catch (e) {
      toast.error('Erreur de chargement', errorMessage(e));
    }
  }, [toast]);

  const now = Date.now();
  const upcoming = appointments
    .filter((a) => a.status === 'CONFIRMED' && new Date(a.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const history = appointments
    .filter((a) => !(a.status === 'CONFIRMED' && new Date(a.date).getTime() >= now))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api(`/api/appointments/${cancelTarget.id}`, { method: 'DELETE' });
      toast.success('Rendez-vous annulé');
      setCancelTarget(null);
      await reload();
    } catch (e) {
      toast.error('Erreur', errorMessage(e));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">À venir</h2>
          <Link href="/services/appointments/new"><Button size="sm"><CalendarPlus className="h-3.5 w-3.5" /> Nouveau</Button></Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="Aucun rendez-vous à venir"
            description="Réservez un créneau avec un service municipal en quelques clics."
            action={<Link href="/services/appointments/new"><Button size="sm">Prendre rendez-vous</Button></Link>}
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                  <span className="text-lg font-bold leading-none">{new Date(a.date).getDate()}</span>
                  <span className="text-[10px] uppercase">{new Date(a.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{a.serviceLabel}</p>
                    <StatusBadge kind="appointment" status={a.status} />
                    {a.isDemo && <Badge tone="warning">Démo</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-300">{a.motif}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDateShort(a.date)} · {formatTime(a.date)}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.location}</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setModifyTarget(a)}><Pencil className="h-3.5 w-3.5" /> Modifier</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400" onClick={() => setCancelTarget(a)}><X className="h-3.5 w-3.5" /> Annuler</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Historique</h2>
          <div className="card divide-y divide-slate-200/70 dark:divide-[#24304a]">
            {history.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{a.serviceLabel}</p>
                  <p className="truncate text-xs text-muted">{formatDateShort(a.date)} · {formatTime(a.date)} · {a.motif}</p>
                </div>
                <StatusBadge kind="appointment" status={a.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal open={!!modifyTarget} onClose={() => setModifyTarget(null)} title="Modifier le rendez-vous" size="lg">
        {modifyTarget && (
          <AppointmentBooking
            existing={modifyTarget}
            onDone={async () => {
              setModifyTarget(null);
              await reload();
            }}
          />
        )}
      </Modal>

      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Annuler le rendez-vous" size="sm" footer={
        <>
          <Button variant="ghost" onClick={() => setCancelTarget(null)}>Conserver</Button>
          <Button variant="danger" loading={cancelling} onClick={confirmCancel}><X className="h-4 w-4" /> Annuler le rendez-vous</Button>
        </>
      }>
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Annuler votre rendez-vous {cancelTarget?.serviceLabel} du {cancelTarget ? formatDateShort(cancelTarget.date) : ''} à {cancelTarget ? formatTime(cancelTarget.date) : ''} ? Le créneau sera libéré.
          </p>
        </div>
      </Modal>
    </div>
  );
}