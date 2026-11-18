'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldError, FieldHint, Input, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { api, ClientApiError, errorMessage } from '@/lib/client';
import { formatDateShort } from '@/lib/utils';

export interface ChangeRequestData {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string;
  status: string;
  createdAt: string;
}

export function EmailCard({ email, requests }: { email: string; requests: ChangeRequestData[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const emailRequests = requests.filter((r) => r.field === 'email');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIssues({});
    setError(null);
    setSaving(true);
    try {
      await api('/api/account/change-requests', { method: 'POST', body: JSON.stringify({ field: 'email', newValue }) });
      toast.success('Demande envoyée', 'Votre changement d’adresse est en attente de validation.');
      setOpen(false);
      setNewValue('');
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && err.issues) setIssues(err.issues);
      else setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-500" /> Adresse électronique</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Send className="h-3.5 w-3.5" /> Demander un changement</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-slate-200/70 px-4 py-3 dark:border-[#24304a]">
          <p className="text-xs text-muted">Adresse actuelle</p>
          <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">{email}</p>
        </div>

        {emailRequests.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Demandes de modification</p>
            <div className="space-y-2">
              {emailRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 px-3 py-2.5 dark:border-[#24304a]">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-700 dark:text-slate-200">{r.newValue}</p>
                    <p className="text-xs text-muted">Demandé le {formatDateShort(r.createdAt)}</p>
                  </div>
                  <StatusBadge kind="changeRequest" status={r.status} />
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-muted">
          Par sécurité, le changement d’adresse électronique est soumis à validation par nos services avant d’être appliqué.
        </p>
      </CardContent>

      <Modal open={open} onClose={() => setOpen(false)} title="Changer d’adresse électronique" footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button form="email-form" type="submit" loading={saving}>Envoyer la demande</Button>
        </>
      }>
        <form id="email-form" onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">{error}</div>}
          <div>
            <Label htmlFor="new-email">Nouvelle adresse électronique</Label>
            <Input id="new-email" type="email" placeholder="nouvelle@exemple.fr" value={newValue} onChange={(e) => setNewValue(e.target.value)} invalid={!!issues.newValue} />
            <FieldError>{issues.newValue}</FieldError>
            <FieldHint>La demande sera examinée par nos services. Adresse actuelle : {email}</FieldHint>
          </div>
        </form>
      </Modal>
    </Card>
  );
}