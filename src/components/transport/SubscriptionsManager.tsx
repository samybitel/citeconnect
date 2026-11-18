'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, CreditCard, RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/client';
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils';

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  durationDays: number;
  modes: string[];
  popular: boolean;
}
interface Subscription {
  id: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  reference: string;
  isDemo: boolean;
  plan: Plan;
}

export function SubscriptionsManager({ plans }: { plans: Plan[] }) {
  const toast = useToast();
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [target, setTarget] = useState<Plan | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ subscriptions: Subscription[] }>('/api/subscriptions');
      setSubs(data.subscriptions);
    } catch (e) {
      toast.error('Erreur de chargement', errorMessage(e));
      setSubs([]);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const now = Date.now();
  const current = subs?.find((s) => s.status === 'ACTIVE' && new Date(s.endDate).getTime() >= now) ?? null;
  const history = subs?.filter((s) => s !== current) ?? [];

  function openPlan(plan: Plan) {
    setTarget(plan);
    setAutoRenew(current?.planId === plan.id ? current.autoRenew : false);
    setError(null);
  }

  async function confirm() {
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      await api('/api/subscriptions', { method: 'POST', body: JSON.stringify({ planId: target.id, autoRenew }) });
      toast.success('Abonnement activé', `${target.name} — paiement simulé confirmé.`);
      setTarget(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (subs === null) return <PageLoader />;

  return (
    <div className="space-y-8">
      {current && (
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Abonnement actuel</p>
                <p className="mt-1 text-xl font-bold text-navy dark:text-white">{current.plan.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge kind="subscription" status={current.status} />
                {current.isDemo && <Badge tone="warning">Démo</Badge>}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200/70 px-3 py-2 dark:border-[#24304a]">
                <p className="text-xs text-muted">Début</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatDate(current.startDate)}</p>
              </div>
              <div className="rounded-xl border border-slate-200/70 px-3 py-2 dark:border-[#24304a]">
                <p className="text-xs text-muted">Expiration</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatDate(current.endDate)}</p>
              </div>
              <div className="rounded-xl border border-slate-200/70 px-3 py-2 dark:border-[#24304a]">
                <p className="text-xs text-muted">Jours restants</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{Math.max(0, daysUntil(current.endDate))} j</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => openPlan(current.plan)}><RefreshCw className="h-4 w-4" /> Renouveler</Button>
              {current.autoRenew && <Badge tone="brand"><Check className="h-3 w-3" /> Renouvellement auto</Badge>}
              <span className="text-xs text-muted">Réf. {current.reference}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{current ? 'Changer de formule' : 'Choisir une formule'}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className={p.popular ? 'ring-2 ring-brand-500' : ''}>
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-navy dark:text-white">{p.name}</p>
                  {p.popular && <Badge tone="brand"><Sparkles className="h-3 w-3" /> Populaire</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted">{p.description}</p>
                <p className="mt-3 text-2xl font-bold text-navy dark:text-white">{formatCurrency(p.priceCents)}</p>
                <p className="text-xs text-muted">{p.durationDays} jours · Bus · Train · Tram</p>
                <div className="mt-4 flex-1" />
                <Button variant={current?.planId === p.id ? 'outline' : 'primary'} className="w-full" onClick={() => openPlan(p)}>
                  <CreditCard className="h-4 w-4" /> {current?.planId === p.id ? 'Renouveler' : 'Souscrire'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Historique</h2>
          <div className="card divide-y divide-slate-200/70 dark:divide-[#24304a]">
            {history.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{s.plan.name}</p>
                  <p className="truncate text-xs text-muted">{formatDate(s.startDate)} → {formatDate(s.endDate)} · réf. {s.reference}</p>
                </div>
                <StatusBadge kind="subscription" status={s.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal open={!!target} onClose={() => setTarget(null)} title="Confirmer la souscription" footer={
        <>
          <Button variant="ghost" onClick={() => setTarget(null)}>Annuler</Button>
          <Button loading={saving} onClick={confirm}><CreditCard className="h-4 w-4" /> Payer {target ? formatCurrency(target.priceCents) : ''}</Button>
        </>
      }>
        {target && (
          <div className="space-y-4">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">{error}</div>}
            <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-[#24304a] dark:bg-[#0d1526]">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{target.name}</p>
                <p className="text-lg font-bold text-navy dark:text-white">{formatCurrency(target.priceCents)}</p>
              </div>
              <p className="mt-1 text-xs text-muted">{target.description} · {target.durationDays} jours</p>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200/70 px-4 py-3 dark:border-[#24304a]">
              <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} className="h-4 w-4 accent-brand-600" />
              <span className="text-sm text-slate-700 dark:text-slate-200">Activer le renouvellement automatique</span>
            </label>
            <p className="text-xs text-muted">
              Démonstration : aucun paiement réel n’est effectué. Un point d’intégration permettra de connecter le prestataire de paiement de la ville.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}