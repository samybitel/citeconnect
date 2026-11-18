'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldHint, Label, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api, errorMessage } from '@/lib/client';

export function StartDossier({ procedureId, procedureTitle }: { procedureId: string; procedureTitle: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = await api<{ dossier: { id: string } }>('/api/dossiers', {
        method: 'POST',
        body: JSON.stringify({ procedureId, data: note.trim() ? { note: note.trim() } : {} }),
      });
      toast.success('Démarche soumise', 'Votre dossier a été créé et sera instruit par nos services.');
      setOpen(false);
      router.push(`/services/dossiers/${data.dossier.id}`);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><FileText className="h-4 w-4" /> Commencer la démarche</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Commencer la démarche" footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button form="start-dossier" type="submit" loading={saving}>Soumettre la demande <ArrowRight className="h-4 w-4" /></Button>
        </>
      }>
        <form id="start-dossier" onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">{error}</div>}
          <div className="rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-[#24304a] dark:bg-[#0d1526]">
            <p className="text-xs text-muted">Démarche</p>
            <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">{procedureTitle}</p>
          </div>
          <div>
            <Label htmlFor="dossier-note">Précisions (optionnel)</Label>
            <Textarea id="dossier-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Informations complémentaires utiles à l’instruction de votre demande…" maxLength={1000} />
            <FieldHint>Un dossier sera créé à votre nom et soumis au service concerné. Vous pourrez suivre son avancement depuis « Mes démarches ».</FieldHint>
          </div>
        </form>
      </Modal>
    </>
  );
}