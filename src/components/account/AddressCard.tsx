'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { api, ClientApiError, errorMessage } from '@/lib/client';

export interface AddressData {
  street: string;
  complement: string | null;
  postalCode: string;
  city: string;
  country: string;
}

export function AddressCard({ address }: { address: AddressData | null }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    street: address?.street ?? '',
    complement: address?.complement ?? '',
    postalCode: address?.postalCode ?? '',
    city: address?.city ?? '',
    country: address?.country ?? 'France',
  });
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setIssues({});
    setSaving(true);
    try {
      await api('/api/account/address', { method: 'PUT', body: JSON.stringify(form) });
      toast.success('Adresse mise à jour');
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && err.issues) setIssues(err.issues);
      else toast.error('Erreur', errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-500" /> Adresse postale</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Pencil className="h-3.5 w-3.5" /> {address ? 'Modifier' : 'Ajouter'}</Button>
      </CardHeader>
      <CardContent>
        {address ? (
          <address className="not-italic text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            <p className="font-medium">{address.street}</p>
            {address.complement && <p>{address.complement}</p>}
            <p>{address.postalCode} {address.city}</p>
            <p className="text-muted">{address.country}</p>
          </address>
        ) : (
          <EmptyState icon={<MapPin className="h-5 w-5" />} title="Aucune adresse enregistrée" description="Ajoutez votre adresse postale pour faciliter vos démarches." className="py-8" />
        )}
      </CardContent>

      <Modal open={open} onClose={() => setOpen(false)} title="Adresse postale" footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button form="address-form" type="submit" loading={saving}>Enregistrer</Button>
        </>
      }>
        <form id="address-form" onSubmit={onSave} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="a-street">Adresse</Label>
            <Input id="a-street" placeholder="12 rue des Lilas" value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} invalid={!!issues.street} />
            <FieldError>{issues.street}</FieldError>
          </div>
          <div>
            <Label htmlFor="a-complement">Complément (optionnel)</Label>
            <Input id="a-complement" placeholder="Bâtiment, étage…" value={form.complement} onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="a-cp">Code postal</Label>
              <Input id="a-cp" inputMode="numeric" maxLength={5} placeholder="31000" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value.replace(/\D/g, '') }))} invalid={!!issues.postalCode} />
              <FieldError>{issues.postalCode}</FieldError>
            </div>
            <div>
              <Label htmlFor="a-city">Ville</Label>
              <Input id="a-city" placeholder="Toulouse" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} invalid={!!issues.city} />
              <FieldError>{issues.city}</FieldError>
            </div>
          </div>
          <div>
            <Label htmlFor="a-country">Pays</Label>
            <Input id="a-country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </Card>
  );
}