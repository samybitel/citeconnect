'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Nfc, X } from 'lucide-react';
import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldHint, Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/client';
import { TRANSPORT_MODES, modeMeta } from '@/lib/constants';
import { cn, formatDateTime } from '@/lib/utils';

interface NfcTicket {
  id: string;
  reference: string;
  status: string;
  ridesRemaining: number;
  product: { name: string };
}
interface NfcSub {
  id: string;
  status: string;
  endDate: string;
  plan: { name: string; modes: string[] };
}
interface Validation {
  id: string;
  mode: string;
  status: string;
  message: string;
  line: string;
  stop: string;
  createdAt: string;
  ticket: { reference: string; product: { name: string } } | null;
}

type Phase = 'idle' | 'reading' | 'success' | 'failed';

export function NfcSimulator() {
  const toast = useToast();
  const [mode, setMode] = useState<'BUS' | 'TRAIN' | 'TRAM'>('BUS');
  const [line, setLine] = useState(modeMeta('BUS').lines[0].name);
  const [stop, setStop] = useState('Gare centrale');
  const [ticketId, setTicketId] = useState('');
  const [tickets, setTickets] = useState<NfcTicket[]>([]);
  const [activeSub, setActiveSub] = useState<NfcSub | null>(null);
  const [history, setHistory] = useState<Validation[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [t, s, h] = await Promise.all([
        api<{ tickets: NfcTicket[] }>('/api/tickets'),
        api<{ subscriptions: NfcSub[] }>('/api/subscriptions'),
        api<{ validations: Validation[] }>('/api/nfc'),
      ]);
      setTickets(t.tickets.filter((x) => x.status === 'VALID'));
      const now = Date.now();
      setActiveSub(s.subscriptions.find((x) => x.status === 'ACTIVE' && new Date(x.endDate).getTime() >= now) ?? null);
      setHistory(h.validations);
    } catch (e) {
      toast.error('Erreur de chargement', errorMessage(e));
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function changeMode(m: 'BUS' | 'TRAIN' | 'TRAM') {
    setMode(m);
    setLine(modeMeta(m).lines[0].name);
    setPhase('idle');
    setResult(null);
  }

  async function validate() {
    if (phase === 'reading') return;
    if (!stop.trim()) {
      toast.error('Arrêt requis', 'Indiquez l’arrêt de validation.');
      return;
    }
    setPhase('reading');
    setResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const data = await api<{ validation: Validation }>('/api/nfc', {
        method: 'POST',
        body: JSON.stringify({ mode, ticketId: ticketId || undefined, line, stop: stop.trim() }),
      });
      setResult({ status: data.validation.status, message: data.validation.message });
      setPhase(data.validation.status === 'SUCCESS' ? 'success' : 'failed');
      await loadData();
    } catch (e) {
      setResult({ status: 'FAILED', message: errorMessage(e) });
      setPhase('failed');
    }
  }

  const meta = modeMeta(mode);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <strong>Simulation NFC Express.</strong> Aucune transaction réelle n’est effectuée : cette interface reproduit le comportement d’une validation sans contact à des fins de démonstration.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Zone de validation */}
        <Card>
          <CardContent className="flex flex-col items-center gap-5 p-6">
            <button
              type="button"
              onClick={validate}
              disabled={phase === 'reading'}
              className="focus-ring relative flex h-52 w-52 items-center justify-center rounded-full transition-transform active:scale-95 disabled:cursor-wait"
              aria-label="Simuler une validation sans contact"
            >
              <span className={cn(
                'absolute inset-0 rounded-full transition-colors',
                phase === 'success' ? 'bg-emerald-500' : phase === 'failed' ? 'bg-red-500' : 'bg-gradient-to-br from-brand-500 to-navy',
              )} />
              {phase === 'reading' && <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/40" />}
              <span className="relative flex flex-col items-center gap-2 text-white">
                {phase === 'reading' ? <Spinner className="h-12 w-12 text-white" /> : phase === 'success' ? <Check className="h-14 w-14" /> : phase === 'failed' ? <X className="h-14 w-14" /> : <Nfc className="h-14 w-14" />}
                <span className="text-sm font-medium">
                  {phase === 'reading' ? 'Lecture…' : phase === 'success' ? 'Validé' : phase === 'failed' ? 'Refusé' : 'Approcher'}
                </span>
              </span>
            </button>

            <div className="min-h-[3rem] text-center">
              {phase === 'idle' && <p className="text-sm text-muted">Appuyez sur le cercle pour simuler le passage de votre téléphone devant le validateur.</p>}
              {phase === 'reading' && <p className="text-sm text-muted">Communication avec le validateur (simulation)…</p>}
              {result && (phase === 'success' || phase === 'failed') && (
                <p className={cn('text-sm font-medium', phase === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>{result.message}</p>
              )}
            </div>

            {activeSub && (
              <Badge tone="success"><Check className="h-3 w-3" /> Abonnement {activeSub.plan.name} actif</Badge>
            )}
          </CardContent>
        </Card>

        {/* Paramètres */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres du voyage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Mode de transport</Label>
              <div className="grid grid-cols-3 gap-2">
                {TRANSPORT_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => changeMode(m.id)}
                    className={cn(
                      'focus-ring flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors',
                      mode === m.id ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200' : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-[#2c3a58] dark:text-slate-300 dark:hover:bg-[#172138]',
                    )}
                  >
                    <Icon name={m.icon} className="h-5 w-5" /> {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="nfc-line">Ligne</Label>
              <Select id="nfc-line" value={line} onChange={(e) => setLine(e.target.value)}>
                {meta.lines.map((l) => (
                  <option key={l.name} value={l.name}>{l.name} — {l.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="nfc-stop">Arrêt</Label>
              <Input id="nfc-stop" value={stop} onChange={(e) => setStop(e.target.value)} placeholder="Ex. Gare centrale" maxLength={80} />
            </div>

            <div>
              <Label htmlFor="nfc-ticket">Titre de transport</Label>
              <Select id="nfc-ticket" value={ticketId} onChange={(e) => setTicketId(e.target.value)}>
                <option value="">Automatique (abonnement si actif)</option>
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>{t.product.name} · {t.ridesRemaining >= 99 ? 'illimité' : `${t.ridesRemaining} voyage(s)`}</option>
                ))}
              </Select>
              <FieldHint>
                {activeSub ? 'Votre abonnement actif sera utilisé en priorité.' : tickets.length > 0 ? 'Choisissez un ticket à consommer.' : 'Aucun ticket valide : la validation échouera sans abonnement.'}
              </FieldHint>
            </div>

            <Button className="w-full" onClick={validate} loading={phase === 'reading'}><Nfc className="h-4 w-4" /> Valider le voyage</Button>
          </CardContent>
        </Card>
      </div>

      {/* Historique */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des validations</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Aucune validation pour le moment.</p>
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-[#24304a]">
              {history.map((v) => (
                <div key={v.id} className="flex items-center gap-3 py-3">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', v.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300')}>
                    <Icon name={modeMeta(v.mode as never).icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{v.line} · {v.stop}</p>
                    <p className="truncate text-xs text-muted">{v.message} · {formatDateTime(v.createdAt)}</p>
                  </div>
                  <Badge tone={v.status === 'SUCCESS' ? 'success' : 'danger'}>{v.status === 'SUCCESS' ? 'Validé' : 'Refusé'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}