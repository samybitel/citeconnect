'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { FieldError, FieldHint, Input, Label } from '@/components/ui/Input';
import { api, ClientApiError, errorMessage } from '@/lib/client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    birthDate: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIssues({});
    setLoading(true);
    try {
      await api('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ClientApiError && err.issues) setIssues(err.issues);
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Quelques informations suffisent pour rejoindre CiteConnect."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300" role="alert">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} invalid={!!issues.firstName} required />
            <FieldError>{issues.firstName}</FieldError>
          </div>
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} invalid={!!issues.lastName} required />
            <FieldError>{issues.lastName}</FieldError>
          </div>
        </div>
        <div>
          <Label htmlFor="email">Adresse électronique</Label>
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} invalid={!!issues.email} required />
          <FieldError>{issues.email}</FieldError>
        </div>
        <div>
          <Label htmlFor="username">Identifiant utilisateur</Label>
          <Input id="username" placeholder="prenom.nom" value={form.username} onChange={(e) => set('username', e.target.value.toLowerCase())} invalid={!!issues.username} required />
          <FieldError>{issues.username}</FieldError>
          <FieldHint>Lettres minuscules, chiffres, points, tirets.</FieldHint>
        </div>
        <div>
          <Label htmlFor="birthDate">Date de naissance</Label>
          <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} invalid={!!issues.birthDate} required />
          <FieldError>{issues.birthDate}</FieldError>
        </div>
        <div>
          <Label htmlFor="phone">Téléphone (optionnel)</Label>
          <Input id="phone" type="tel" placeholder="06 12 34 56 78" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} invalid={!!issues.password} required />
          <FieldError>{issues.password}</FieldError>
          <FieldHint>Au moins 8 caractères, une lettre et un chiffre.</FieldHint>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          <UserPlus className="h-4 w-4" /> Créer mon compte
        </Button>
        <p className="text-center text-xs text-muted">
          Vos données sont protégées et ne sont jamais partagées publiquement.
        </p>
      </form>
    </AuthShell>
  );
}