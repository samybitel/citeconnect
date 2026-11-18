'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn, Wand2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';
import { api, ClientApiError, errorMessage } from '@/lib/client';
import { DEMO_ACCOUNT } from '@/lib/constants';

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    api('/api/auth/me')
      .then(() => {
        if (alive) router.replace(next);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [router, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIssues({});
    setLoading(true);
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ClientApiError && err.issues) setIssues(err.issues);
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setError(null);
  }

  return (
    <AuthShell
      title="Connexion"
      subtitle="Accédez à vos services municipaux en toute sécurité."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Créer un compte
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
        <div>
          <Label htmlFor="email">Adresse électronique</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!issues.email} required />
          <FieldError>{issues.email}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" required />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={show ? 'Masquer' : 'Afficher'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          <LogIn className="h-4 w-4" /> Se connecter
        </Button>
      </form>

      <div className="mt-5 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-950/30">
        <p className="text-xs font-medium text-brand-700 dark:text-brand-300">Compte de démonstration</p>
        <p className="mt-1 text-xs text-muted">{DEMO_ACCOUNT.email} · {DEMO_ACCOUNT.password}</p>
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={fillDemo}>
          <Wand2 className="h-3.5 w-3.5" /> Remplir automatiquement
        </Button>
      </div>
    </AuthShell>
  );
}