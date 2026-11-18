'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldError, FieldHint, Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { api, ClientApiError, errorMessage } from '@/lib/client';
import { APPOINTMENT_LOCATIONS, SERVICE_CATEGORIES, SERVICE_LABELS } from '@/lib/constants';
import { isOpenDay, type Slot } from '@/lib/slots';
import { cn, formatDate, formatTime } from '@/lib/utils';

export interface AppointmentData {
  id: string;
  service: string;
  serviceLabel: string;
  motif: string;
  date: string;
  durationMin: number;
  location: string;
  reference: string;
  status: string;
  isDemo: boolean;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const SERVICE_OPTIONS = [...SERVICE_CATEGORIES.map((c) => c.id), 'ACCOUNT'] as string[];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function AppointmentBooking({ existing, initialService, onDone }: { existing?: AppointmentData; initialService?: string; onDone?: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const editing = !!existing;

  const defaultService = existing?.service ?? (initialService && SERVICE_OPTIONS.includes(initialService) ? initialService : 'ETAT_CIVIL');
  const [service, setService] = useState(defaultService);
  const initialDate = existing ? new Date(existing.date) : null;
  const [cursor, setCursor] = useState(() => {
    const base = initialDate ?? new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(initialDate ? new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()) : null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(existing?.date ?? null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [dayOpen, setDayOpen] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [motif, setMotif] = useState(existing?.motif ?? '');
  const [durationMin, setDurationMin] = useState(existing?.durationMin ?? 30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});

  const dayKey = selectedDay ? ymd(selectedDay) : null;

  const loadSlots = useCallback(async (svc: string, key: string) => {
    setLoadingSlots(true);
    try {
      const data = await api<{ open: boolean; slots: Slot[] }>(`/api/appointments/slots?service=${svc}&date=${key}`);
      setSlots(data.slots);
      setDayOpen(data.open);
    } catch (e) {
      setError(errorMessage(e));
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (!dayKey) {
      setSlots(null);
      return;
    }
    loadSlots(service, dayKey);
  }, [service, dayKey, loadSlots]);

  function changeService(svc: string) {
    setService(svc);
    setSelectedDay(null);
    setSelectedSlot(null);
    setSlots(null);
  }

  function pickDay(d: Date) {
    setSelectedDay(d);
    setSelectedSlot(null);
    setError(null);
  }

  const today = startOfToday();
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(cursor.year, cursor.month, 1)),
    [cursor],
  );
  const canGoPrev = cursor.year > today.getFullYear() || (cursor.year === today.getFullYear() && cursor.month > today.getMonth());

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const firstWeekday = (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.year, cursor.month, i + 1)),
  ];

  const canSubmit = !!selectedSlot && motif.trim().length >= 3 && !submitting;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setError(null);
    setIssues({});
    setSubmitting(true);
    try {
      if (editing && existing) {
        await api(`/api/appointments/${existing.id}`, { method: 'PATCH', body: JSON.stringify({ motif: motif.trim(), date: selectedSlot, durationMin }) });
        toast.success('Rendez-vous modifié', 'Votre nouveau créneau est confirmé.');
      } else {
        await api('/api/appointments', { method: 'POST', body: JSON.stringify({ service, motif: motif.trim(), date: selectedSlot, durationMin }) });
        toast.success('Rendez-vous confirmé', 'Un e-mail de confirmation vous a été envoyé (simulation).');
      }
      if (onDone) onDone();
      else {
        router.push('/services/appointments');
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ClientApiError && err.issues) setIssues(err.issues);
      else setError(errorMessage(err));
      if (dayKey) loadSlots(service, dayKey);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">{error}</div>}

      {/* Service */}
      <div>
        <Label htmlFor="appt-service">Service concerné</Label>
        {editing ? (
          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-700 dark:border-[#24304a] dark:bg-[#0d1526] dark:text-slate-200">
            {SERVICE_LABELS[service as keyof typeof SERVICE_LABELS] ?? service}
          </div>
        ) : (
          <Select id="appt-service" value={service} onChange={(e) => changeService(e.target.value)}>
            {SERVICE_OPTIONS.map((s) => (
              <option key={s} value={s}>{SERVICE_LABELS[s as keyof typeof SERVICE_LABELS]}</option>
            ))}
          </Select>
        )}
      </div>

      {/* Calendrier */}
      <div>
        <Label>Choisissez une date</Label>
        <div className="rounded-2xl border border-slate-200/70 p-4 dark:border-[#24304a]">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} disabled={!canGoPrev} className="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-[#172138]" aria-label="Mois précédent">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">{monthLabel}</p>
            <button type="button" onClick={() => shiftMonth(1)} className="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#172138]" aria-label="Mois suivant">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <div key={w} className="pb-1 text-[11px] font-medium uppercase text-muted">{w}</div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={`b${i}`} />;
              const past = d < today;
              const open = isOpenDay(service as never, d);
              const selectable = open && !past;
              const isSelected = selectedDay && ymd(d) === ymd(selectedDay);
              return (
                <button
                  key={ymd(d)}
                  type="button"
                  disabled={!selectable}
                  onClick={() => pickDay(d)}
                  className={cn(
                    'focus-ring flex h-9 items-center justify-center rounded-lg text-sm transition-colors',
                    isSelected
                      ? 'bg-brand-600 font-semibold text-white'
                      : selectable
                        ? 'text-slate-700 hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-brand-950'
                        : 'cursor-not-allowed text-slate-300 dark:text-slate-600',
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">Les jours grisés sont fermés ou déjà passés.</p>
        </div>
      </div>

      {/* Créneaux */}
      <div>
        <Label>Créneaux disponibles</Label>
        {!selectedDay ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-muted dark:border-[#2c3a58]">Sélectionnez une date pour voir les créneaux.</p>
        ) : loadingSlots ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 px-4 py-6 text-sm text-muted dark:border-[#24304a]"><Spinner className="h-4 w-4" /> Chargement des créneaux…</div>
        ) : !dayOpen ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-muted dark:border-[#2c3a58]">Le service est fermé ce jour-là. Choisissez une autre date.</p>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((s) => (
              <button
                key={s.iso}
                type="button"
                disabled={!s.available}
                onClick={() => setSelectedSlot(s.iso)}
                className={cn(
                  'focus-ring flex h-10 items-center justify-center rounded-xl border text-sm font-medium transition-colors',
                  selectedSlot === s.iso
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : s.available
                      ? 'border-slate-300 text-slate-700 hover:border-brand-400 hover:bg-brand-50 dark:border-[#2c3a58] dark:text-slate-200 dark:hover:bg-brand-950'
                      : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 line-through dark:border-[#24304a] dark:bg-[#0d1526] dark:text-slate-600',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-muted dark:border-[#2c3a58]">Aucun créneau ce jour-là.</p>
        )}
      </div>

      {/* Motif + durée */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="appt-motif">Motif du rendez-vous</Label>
          <Input id="appt-motif" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. retrait d’un acte de naissance" invalid={!!issues.motif} maxLength={200} />
          <FieldError>{issues.motif}</FieldError>
        </div>
        <div>
          <Label htmlFor="appt-duration">Durée</Label>
          <Select id="appt-duration" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 heure</option>
          </Select>
        </div>
      </div>

      {/* Récapitulatif */}
      {selectedSlot && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900 dark:bg-brand-950/30">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-800 dark:text-brand-200"><Check className="h-4 w-4" /> Récapitulatif</p>
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><CalendarDays className="h-4 w-4 text-brand-500" /> {formatDate(selectedSlot)} à {formatTime(selectedSlot)}</div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><Clock className="h-4 w-4 text-brand-500" /> {SERVICE_LABELS[service as keyof typeof SERVICE_LABELS]} · {durationMin} min</div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><MapPin className="h-4 w-4 text-brand-500" /> {APPOINTMENT_LOCATIONS[service as keyof typeof APPOINTMENT_LOCATIONS]}</div>
          </dl>
        </div>
      )}

      <FieldHint>La prise de rendez-vous est immédiate et gratuite. Vous pourrez l’annuler ou le modifier depuis votre espace.</FieldHint>
      <Button type="submit" disabled={!canSubmit} loading={submitting} className="w-full sm:w-auto">
        <CalendarDays className="h-4 w-4" /> {editing ? 'Enregistrer les modifications' : 'Confirmer le rendez-vous'}
      </Button>
    </form>
  );
}