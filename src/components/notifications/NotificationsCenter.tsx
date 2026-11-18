'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CheckCheck,
  FileCheck2,
  FileX2,
  FolderOpen,
  Info,
  Ticket,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import type { NotificationType } from '@prisma/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/client';
import { cn, formatDateShort } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  isDemo: boolean;
  createdAt: string;
}

const TYPE_META: Record<NotificationType, { icon: typeof Bell; circle: string }> = {
  APPOINTMENT_CONFIRMED: { icon: CalendarCheck, circle: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' },
  APPOINTMENT_REMINDER: { icon: CalendarClock, circle: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300' },
  DOCUMENT_VERIFIED: { icon: FileCheck2, circle: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' },
  DOCUMENT_REJECTED: { icon: FileX2, circle: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300' },
  DOSSIER_UPDATED: { icon: FolderOpen, circle: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300' },
  SUBSCRIPTION_EXPIRING: { icon: TriangleAlert, circle: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300' },
  TICKET_PURCHASED: { icon: Ticket, circle: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300' },
  SYSTEM: { icon: Info, circle: 'bg-slate-100 text-slate-500 dark:bg-[#172138] dark:text-slate-300' },
};

function relativeTime(value: string) {
  const d = new Date(value);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} j`;
  return formatDateShort(d);
}

export function NotificationsCenter({ initial }: { initial: NotificationItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<NotificationItem[]>(initial);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const visible = filter === 'unread' ? items.filter((n) => !n.read) : items;

  async function markRead(id: string, read = true) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
    try {
      await api(`/api/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read }) });
      router.refresh();
    } catch (e) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: !read } : n)));
      toast.error('Erreur', errorMessage(e));
    }
  }

  function open(n: NotificationItem) {
    if (!n.read) void markRead(n.id);
    if (n.link) router.push(n.link);
  }

  async function markAllRead() {
    setBusy(true);
    try {
      await api('/api/notifications/read-all', { method: 'POST' });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      router.refresh();
      toast.success('Notifications', 'Toutes les notifications sont marquées comme lues.');
    } catch (e) {
      toast.error('Erreur', errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await api(`/api/notifications/${id}`, { method: 'DELETE' });
      router.refresh();
    } catch (e) {
      setItems(snapshot);
      toast.error('Erreur', errorMessage(e));
    }
  }

  async function clearAll() {
    setBusy(true);
    try {
      await api('/api/notifications', { method: 'DELETE' });
      setItems([]);
      setConfirmClear(false);
      router.refresh();
      toast.success('Notifications', 'Centre de notifications vidé.');
    } catch (e) {
      toast.error('Erreur', errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-[#24304a] dark:bg-[#0d1526]">
          <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>
            Toutes <span className="ml-1 text-xs text-muted">{items.length}</span>
          </FilterTab>
          <FilterTab active={filter === 'unread'} onClick={() => setFilter('unread')}>
            Non lues <span className="ml-1 text-xs text-muted">{unread}</span>
          </FilterTab>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unread === 0 || busy}>
            <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)} disabled={items.length === 0 || busy} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
            <Trash2 className="h-4 w-4" /> Tout effacer
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title={filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          description={filter === 'unread' ? 'Vous êtes à jour. Revenez plus tard pour vos prochaines alertes.' : 'Vos alertes de rendez-vous, démarches et transport apparaîtront ici.'}
        />
      ) : (
        <ul className="card divide-y divide-slate-200/70 overflow-hidden dark:divide-[#24304a]">
          {visible.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
            const Icon = meta.icon;
            return (
              <li key={n.id} className={cn('relative flex gap-3 p-4 transition-colors sm:gap-4 sm:p-5', !n.read && 'bg-brand-50/50 dark:bg-brand-950/20')}>
                {!n.read && <span className="absolute inset-y-0 left-0 w-1 bg-brand-500" aria-hidden />}
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.circle)}>
                  <Icon className="h-5 w-5" />
                </div>
                <button type="button" onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn('text-sm', n.read ? 'font-medium text-slate-700 dark:text-slate-200' : 'font-semibold text-navy dark:text-white')}>{n.title}</p>
                    {n.isDemo && <Badge tone="warning">Fictif</Badge>}
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" aria-label="Non lue" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {relativeTime(n.createdAt)}
                    {n.link && <span className="ml-1 text-brand-600 dark:text-brand-400">· Ouvrir</span>}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  className="focus-ring h-8 w-8 shrink-0 rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  aria-label={`Supprimer la notification « ${n.title} »`}
                >
                  <Trash2 className="mx-auto h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Effacer toutes les notifications ?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>Annuler</Button>
            <Button variant="danger" loading={busy} onClick={clearAll}><Trash2 className="h-4 w-4" /> Tout effacer</Button>
          </>
        }
      >
        <p className="text-sm text-muted">Cette action supprimera définitivement les {items.length} notifications de votre centre. Elle est irréversible.</p>
      </Modal>
    </div>
  );
}

function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'focus-ring rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#172138]',
      )}
    >
      {children}
    </button>
  );
}