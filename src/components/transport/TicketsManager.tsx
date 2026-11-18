'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, QrCode, Ticket as TicketIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { PageLoader } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/client';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  rides: number;
  validityMinutes: number;
  modes: string[];
}
interface Ticket {
  id: string;
  productId: string;
  reference: string;
  code: string;
  status: string;
  ridesRemaining: number;
  purchasedAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  isDemo: boolean;
  qrDataUrl: string;
  product: Product;
}

function validityLabel(min: number): string {
  if (min >= 1440) {
    const days = Math.floor(min / 1440);
    const rem = min % 1440;
    return rem === 0 ? `${days} j` : `${days} j ${validityLabel(rem)}`;
  }
  if (min >= 60) {
    const hours = Math.floor(min / 60);
    const rem = min % 60;
    return rem === 0 ? `${hours} h` : `${hours} h ${rem}`;
  }
  return `${min} min`;
}
function groupCode(code: string) {
  return code.replace(/(.{4})/g, '$1 ').trim();
}

export function TicketsManager({ products }: { products: Product[] }) {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [buyTarget, setBuyTarget] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ tickets: Ticket[] }>('/api/tickets');
      setTickets(data.tickets);
    } catch (e) {
      toast.error('Erreur de chargement', errorMessage(e));
      setTickets([]);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openBuy(p: Product) {
    setBuyTarget(p);
    setQuantity(1);
    setError(null);
  }

  async function confirmBuy() {
    if (!buyTarget) return;
    setSaving(true);
    setError(null);
    try {
      await api('/api/tickets', { method: 'POST', body: JSON.stringify({ productId: buyTarget.id, quantity }) });
      toast.success('Achat confirmé', `${quantity} × ${buyTarget.name} — paiement simulé.`);
      setBuyTarget(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (tickets === null) return <PageLoader />;

  const active = tickets.filter((t) => t.status === 'VALID');
  const history = tickets.filter((t) => t.status !== 'VALID');

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Acheter un ticket</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex h-full flex-col p-5">
                <p className="font-semibold text-navy dark:text-white">{p.name}</p>
                <p className="mt-1 text-xs text-muted">{p.description}</p>
                <p className="mt-3 text-2xl font-bold text-navy dark:text-white">{formatCurrency(p.priceCents)}</p>
                <p className="text-xs text-muted">{p.rides >= 99 ? 'Illimité' : `${p.rides} voyage${p.rides > 1 ? 's' : ''}`} · valable {validityLabel(p.validityMinutes)}</p>
                <div className="mt-4 flex-1" />
                <Button className="w-full" onClick={() => openBuy(p)}><CreditCard className="h-4 w-4" /> Acheter</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Mes tickets ({active.length})</h2>
        {active.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-muted dark:border-[#2c3a58]">
            Aucun ticket valide. Achetez un ticket pour commencer à voyager.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                        <TicketIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{t.product.name}</p>
                        <p className="text-xs text-muted">Réf. {t.reference}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge kind="ticket" status={t.status} />
                      {t.isDemo && <Badge tone="warning">Démo</Badge>}
                    </div>
                  </div>
                  <dl className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Voyages restants</dt><dd className="font-medium text-slate-700 dark:text-slate-200">{t.ridesRemaining >= 99 ? 'Illimité' : t.ridesRemaining}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Validité</dt><dd className="text-slate-700 dark:text-slate-200">{t.expiresAt ? formatDateTime(t.expiresAt) : `${validityLabel(t.product.validityMinutes)} après activation`}</dd></div>
                  </dl>
                  <Button variant="outline" className="mt-4 w-full" onClick={() => setViewTicket(t)}><QrCode className="h-4 w-4" /> Voir le ticket</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Historique d’achats</h2>
          <div className="card divide-y divide-slate-200/70 dark:divide-[#24304a]">
            {history.map((t) => (
              <button key={t.id} onClick={() => setViewTicket(t)} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-[#172138]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{t.product.name}</p>
                  <p className="truncate text-xs text-muted">Acheté le {formatDate(t.purchasedAt)} · réf. {t.reference}</p>
                </div>
                <StatusBadge kind="ticket" status={t.status} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Achat */}
      <Modal open={!!buyTarget} onClose={() => setBuyTarget(null)} title="Acheter un ticket" footer={
        <>
          <Button variant="ghost" onClick={() => setBuyTarget(null)}>Annuler</Button>
          <Button loading={saving} onClick={confirmBuy}><CreditCard className="h-4 w-4" /> Payer {buyTarget ? formatCurrency(buyTarget.priceCents * quantity) : ''}</Button>
        </>
      }>
        {buyTarget && (
          <div className="space-y-4">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">{error}</div>}
            <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-[#24304a] dark:bg-[#0d1526]">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{buyTarget.name}</p>
              <p className="mt-1 text-xs text-muted">{buyTarget.description}</p>
            </div>
            <div>
              <Label htmlFor="qty">Quantité</Label>
              <Select id="qty" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-950/40">
              <span className="text-sm text-slate-700 dark:text-slate-200">Total</span>
              <span className="text-lg font-bold text-navy dark:text-white">{formatCurrency(buyTarget.priceCents * quantity)}</span>
            </div>
            <p className="text-xs text-muted">Démonstration : aucun paiement réel n’est effectué.</p>
          </div>
        )}
      </Modal>

      {/* Ticket numérique */}
      <Modal open={!!viewTicket} onClose={() => setViewTicket(null)} title="Ticket numérique" size="sm">
        {viewTicket && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <StatusBadge kind="ticket" status={viewTicket.status} />
              {viewTicket.isDemo && <Badge tone="warning">Fictif</Badge>}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-[#24304a]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewTicket.qrDataUrl} alt={`QR code du ticket ${viewTicket.reference}`} width={220} height={220} className="h-[220px] w-[220px]" />
            </div>
            <p className="font-mono text-sm tracking-widest text-slate-700 dark:text-slate-200">{groupCode(viewTicket.code)}</p>
            <div className="w-full space-y-1 text-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{viewTicket.product.name}</p>
              <p className="text-xs text-muted">
                {viewTicket.ridesRemaining >= 99 ? 'Voyages illimités' : `${viewTicket.ridesRemaining} voyage(s) restant(s)`}
                {viewTicket.expiresAt ? ` · expire le ${formatDateTime(viewTicket.expiresAt)}` : ''}
              </p>
            </div>
            <p className="text-xs text-muted">Présentez ce QR code au validateur. NFC Express est une simulation : aucune transaction réelle n’est effectuée.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}