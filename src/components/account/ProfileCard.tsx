'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Mail, Pencil, Phone, User as UserIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api, ClientApiError, errorMessage } from '@/lib/client';
import { calcAge, formatDate, fullName } from '@/lib/utils';

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthDate: string;
  phone: string | null;
  avatarPath: string | null;
  isDemo: boolean;
}

export function ProfileCard({ user }: { user: ProfileData }) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' });
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});

  async function onAvatarChange(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api('/api/account/avatar', { method: 'POST', body: fd, headers: {} });
      setAvatarVersion((v) => v + 1);
      toast.success('Photo de profil mise à jour');
      router.refresh();
    } catch (e) {
      toast.error('Échec de l’envoi', errorMessage(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setIssues({});
    setSaving(true);
    try {
      await api('/api/account', { method: 'PATCH', body: JSON.stringify(form) });
      toast.success('Profil mis à jour');
      setEditOpen(false);
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
        <CardTitle className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-brand-500" /> Profil personnel</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" /> Modifier</Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <Avatar src={user.avatarPath ? `/api/account/avatar?v=${avatarVersion}` : undefined} firstName={user.firstName} lastName={user.lastName} size="xl" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="focus-ring absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
              aria-label="Changer la photo de profil"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onAvatarChange(e.target.files?.[0])} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-bold text-navy dark:text-white">{fullName(user)}</h2>
              {user.isDemo && <Badge tone="warning">Démo</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-muted">Identifiant : <span className="font-medium text-slate-700 dark:text-slate-200">{user.username}</span></p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge tone="brand">{calcAge(user.birthDate)} ans</Badge>
              <Badge tone="neutral">Né(e) le {formatDate(user.birthDate)}</Badge>
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <p className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 sm:justify-start"><Mail className="h-4 w-4 text-slate-400" /> {user.email}</p>
              <p className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 sm:justify-start"><Phone className="h-4 w-4 text-slate-400" /> {user.phone || 'Non renseigné'}</p>
            </div>
          </div>
        </div>
      </CardContent>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le profil" footer={
        <>
          <Button variant="ghost" onClick={() => setEditOpen(false)}>Annuler</Button>
          <Button form="profile-form" type="submit" loading={saving}>Enregistrer</Button>
        </>
      }>
        <form id="profile-form" onSubmit={onSave} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="p-first">Prénom</Label>
              <Input id="p-first" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} invalid={!!issues.firstName} />
              <FieldError>{issues.firstName}</FieldError>
            </div>
            <div>
              <Label htmlFor="p-last">Nom</Label>
              <Input id="p-last" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} invalid={!!issues.lastName} />
              <FieldError>{issues.lastName}</FieldError>
            </div>
          </div>
          <div>
            <Label htmlFor="p-phone">Téléphone</Label>
            <Input id="p-phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <p className="text-xs text-muted">L’adresse électronique se change depuis la section « Coordonnées » (soumise à validation).</p>
        </form>
      </Modal>
    </Card>
  );
}