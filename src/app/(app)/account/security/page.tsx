'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Eye, EyeOff, Globe, KeyRound, Laptop, LogOut, Monitor, ShieldCheck, Smartphone } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldError, FieldHint, Input, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { api, ClientApiError, errorMessage } from '@/lib/client';
import { formatDateTime } from '@/lib/utils';

interface SessionInfo {
  id: string;
  current: boolean;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  ip: string | null;
}

function deviceLabel(ua: string | null) {
  if (!ua) return { label: 'Appareil inconnu', icon: <Monitor className="h-4 w-4" /> };
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let browser = 'Navigateur';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';
  let os = '';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  return {
    label: os ? `${browser} · ${os}` : browser,
    icon: mobile ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />,
  };
}

export default function SecurityPage() {
  return (
    <div>
      <PageHeader
        title="Sécurité du compte"
        description="Gérez votre mot de passe, vos sessions actives et la déconnexion."
        back={{ href: '/account', label: 'Mon compte' }}
      />
      <div className="space-y-6">
        <PasswordCard />
        <SessionsCard />
        <LogoutCard />
      </div>
    </div>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function localValidate() {
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = 'Mot de passe actuel requis.';
    if (newPassword.length < 8) next.newPassword = 'Au moins 8 caractères.';
    else if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) next.newPassword = 'Au moins une lettre et un chiffre.';
    if (confirm !== newPassword) next.confirm = 'Les mots de passe ne correspondent pas.';
    setIssues(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!localValidate()) return;
    setSaving(true);
    try {
      await api('/api/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      toast.success('Mot de passe modifié', 'Les autres sessions ont été déconnectées.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setIssues({});
    } catch (err) {
      if (err instanceof ClientApiError && err.issues) setIssues(err.issues);
      else setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const type = show ? 'text' : 'password';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-brand-500" /> Mot de passe</CardTitle>
        <CardDescription>Choisissez un mot de passe robuste : au moins 8 caractères, une lettre et un chiffre.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="max-w-md space-y-4" noValidate>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">{error}</div>}

          <div>
            <Label htmlFor="cur-pw">Mot de passe actuel</Label>
            <div className="relative">
              <Input id="cur-pw" type={type} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} invalid={!!issues.currentPassword} className="pr-11" />
              <ToggleShow show={show} onToggle={() => setShow((s) => !s)} />
            </div>
            <FieldError>{issues.currentPassword}</FieldError>
          </div>

          <div>
            <Label htmlFor="new-pw">Nouveau mot de passe</Label>
            <Input id="new-pw" type={type} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} invalid={!!issues.newPassword} />
            <FieldError>{issues.newPassword}</FieldError>
          </div>

          <div>
            <Label htmlFor="conf-pw">Confirmer le nouveau mot de passe</Label>
            <Input id="conf-pw" type={type} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={!!issues.confirm} />
            <FieldError>{issues.confirm}</FieldError>
          </div>

          <FieldHint>Par sécurité, toutes vos autres sessions seront déconnectées après le changement.</FieldHint>
          <Button type="submit" loading={saving}><ShieldCheck className="h-4 w-4" /> Mettre à jour le mot de passe</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ToggleShow({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
      className="focus-ring absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function SessionsCard() {
  const toast = useToast();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<{ sessions: SessionInfo[] }>('/api/auth/sessions');
      setSessions(data.sessions);
    } catch (e) {
      toast.error('Erreur de chargement', errorMessage(e));
      setSessions([]);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function revokeOthers() {
    setRevoking(true);
    try {
      await api('/api/auth/sessions', { method: 'DELETE' });
      toast.success('Sessions révoquées', 'Les autres appareils ont été déconnectés.');
      setConfirmOpen(false);
      await load();
    } catch (e) {
      toast.error('Erreur', errorMessage(e));
    } finally {
      setRevoking(false);
    }
  }

  const others = sessions?.filter((s) => !s.current).length ?? 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2"><Monitor className="h-4 w-4 text-brand-500" /> Sessions actives</CardTitle>
          <CardDescription>Les appareils actuellement connectés à votre compte.</CardDescription>
        </div>
        {others > 0 && (
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}><LogOut className="h-3.5 w-3.5" /> Déconnecter les autres</Button>
        )}
      </CardHeader>
      <CardContent>
        {sessions === null ? (
          <PageLoader />
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const device = deviceLabel(s.userAgent);
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-200/70 px-4 py-3 dark:border-[#24304a]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-[#172138] dark:text-slate-300">
                    {device.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{device.label}</p>
                      {s.current && <Badge tone="success">Cet appareil</Badge>}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {s.ip ?? 'IP inconnue'}</span>
                      <span>· Connecté le {formatDateTime(s.createdAt)}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Déconnecter les autres sessions" size="sm" footer={
        <>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Annuler</Button>
          <Button variant="danger" loading={revoking} onClick={revokeOthers}><LogOut className="h-4 w-4" /> Déconnecter</Button>
        </>
      }>
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {others} autre{others > 1 ? 's' : ''} session{others > 1 ? 's' : ''} sera{others > 1 ? 'ont' : ''} déconnectée{others > 1 ? 's' : ''}. Votre session actuelle reste active.
          </p>
        </div>
      </Modal>
    </Card>
  );
}

function LogoutCard() {
  const router = useRouter();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await api('/api/auth/logout', { method: 'POST' });
      toast.success('Déconnexion', 'À bientôt sur CiteConnect.');
    } catch {
      // On force la déconnexion côté client même si l'appel échoue.
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><LogOut className="h-4 w-4 text-brand-500" /> Déconnexion</CardTitle>
        <CardDescription>Fermer votre session sur cet appareil.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="danger" loading={loggingOut} onClick={logout}><LogOut className="h-4 w-4" /> Se déconnecter</Button>
      </CardContent>
    </Card>
  );
}