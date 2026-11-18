'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BookUser, Eye, FileText, IdCard, RefreshCw, Trash2, Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FieldError, FieldHint, Input, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { PageLoader } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { api, ClientApiError, errorMessage } from '@/lib/client';
import { DOCUMENT_TYPE_LABEL } from '@/lib/constants';
import { formatDateShort, maskDocumentNumber } from '@/lib/utils';

interface Doc {
  id: string;
  type: string;
  label: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: string;
  documentNumber: string | null;
  expiresAt: string | null;
  isDemo: boolean;
  createdAt: string;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DocumentsPage() {
  const router = useRouter();
  const toast = useToast();
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<Doc | null>(null);
  const [toDelete, setToDelete] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState(false);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<Doc | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ documents: Doc[] }>('/api/documents');
      setDocs(data.documents);
    } catch (e) {
      toast.error('Erreur de chargement', errorMessage(e));
      setDocs([]);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/documents/${toDelete.id}`, { method: 'DELETE' });
      toast.success('Document supprimé');
      setToDelete(null);
      await load();
      router.refresh();
    } catch (e) {
      toast.error('Erreur', errorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  function startReplace(doc: Doc) {
    replaceTarget.current = doc;
    replaceRef.current?.click();
  }

  async function onReplaceFile(file: File | undefined) {
    const doc = replaceTarget.current;
    if (!file || !doc) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api(`/api/documents/${doc.id}/replace`, { method: 'POST', body: fd });
      toast.success('Document remplacé', 'Il repasse en attente de vérification.');
      await load();
      router.refresh();
    } catch (e) {
      toast.error('Erreur', errorMessage(e));
    } finally {
      replaceTarget.current = null;
      if (replaceRef.current) replaceRef.current.value = '';
    }
  }

  return (
    <div>
      <PageHeader
        title="Documents officiels"
        description="Espace sécurisé : vos documents restent privés et ne sont jamais publics."
        back={{ href: '/account', label: 'Mon compte' }}
        action={<Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" /> Déposer un document</Button>}
      />

      <input ref={replaceRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(e) => onReplaceFile(e.target.files?.[0])} />

      {docs === null ? (
        <PageLoader />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Aucun document enregistré"
          description="Déposez votre carte nationale d’identité ou votre passeport pour les faire vérifier."
          action={<Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" /> Déposer un document</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                    {doc.type === 'PASSPORT' ? <BookUser className="h-5 w-5" /> : <IdCard className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{doc.label}</p>
                      {doc.isDemo && <Badge tone="warning">Démo</Badge>}
                    </div>
                    <p className="text-xs text-muted">{DOCUMENT_TYPE_LABEL[doc.type] ?? doc.type}</p>
                  </div>
                  <StatusBadge kind="document" status={doc.status} />
                </div>

                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Numéro</dt>
                    <dd className="font-medium text-slate-700 dark:text-slate-200">{maskDocumentNumber(doc.documentNumber)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Expiration</dt>
                    <dd className="text-slate-700 dark:text-slate-200">{doc.expiresAt ? formatDateShort(doc.expiresAt) : '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Fichier</dt>
                    <dd className="truncate text-slate-700 dark:text-slate-200">{doc.fileName} · {fmtSize(doc.size)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreview(doc)}><Eye className="h-3.5 w-3.5" /> Voir</Button>
                  <Button variant="outline" size="sm" onClick={() => startReplace(doc)}><RefreshCw className="h-3.5 w-3.5" /> Remplacer</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400" onClick={() => setToDelete(doc)}><Trash2 className="h-3.5 w-3.5" /> Supprimer</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onDone={async () => { await load(); router.refresh(); }} />

      {/* Aperçu */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.label ?? ''} size="lg">
        {preview && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge kind="document" status={preview.status} />
              <Badge tone="neutral">{DOCUMENT_TYPE_LABEL[preview.type] ?? preview.type}</Badge>
              {preview.isDemo && <Badge tone="warning">Document fictif</Badge>}
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-[#24304a] dark:bg-[#0d1526]">
              {preview.mimeType === 'application/pdf' ? (
                <iframe src={`/api/documents/${preview.id}/file`} title={preview.label} className="h-[60vh] w-full" />
              ) : (
                <img src={`/api/documents/${preview.id}/file`} alt={preview.label} className="mx-auto max-h-[60vh] object-contain" />
              )}
            </div>
            <p className="text-xs text-muted">
              Aperçu privé — ce fichier n’est accessible qu’à vous, via une route authentifiée.
            </p>
          </div>
        )}
      </Modal>

      {/* Suppression */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Supprimer le document" size="sm" footer={
        <>
          <Button variant="ghost" onClick={() => setToDelete(null)}>Annuler</Button>
          <Button variant="danger" loading={deleting} onClick={confirmDelete}><Trash2 className="h-4 w-4" /> Supprimer</Button>
        </>
      }>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Supprimer définitivement « {toDelete?.label} » ? Le fichier sera effacé du stockage sécurisé. Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}

function UploadModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => Promise<void> }) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('CNI');
  const [label, setLabel] = useState('Carte nationale d’identité');
  const [number, setNumber] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickType(t: string) {
    setType(t);
    setLabel(t === 'CNI' ? 'Carte nationale d’identité' : t === 'PASSPORT' ? 'Passeport' : 'Autre document');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIssues({});
    setError(null);
    if (!file) {
      setError('Veuillez choisir un fichier.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      fd.append('label', label);
      fd.append('documentNumber', number);
      fd.append('expiresAt', expiresAt);
      await api('/api/documents', { method: 'POST', body: fd });
      toast.success('Document déposé', 'Il est en attente de vérification.');
      setFile(null);
      setNumber('');
      setExpiresAt('');
      onClose();
      await onDone();
    } catch (err) {
      if (err instanceof ClientApiError && err.issues) setIssues(err.issues);
      else setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Déposer un document" footer={
      <>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button form="upload-form" type="submit" loading={saving}><Upload className="h-4 w-4" /> Déposer</Button>
      </>
    }>
      <form id="upload-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">{error}</div>}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="focus-ring flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-8 text-center hover:border-brand-400 hover:bg-brand-50/40 dark:border-[#2c3a58] dark:hover:bg-brand-950/20"
        >
          {file ? (
            <>
              <FileText className="h-8 w-8 text-brand-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</span>
              <span className="text-xs text-muted">{fmtSize(file.size)} · cliquez pour changer</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Cliquez pour choisir un fichier</span>
              <span className="text-xs text-muted">PNG, JPEG, WebP ou PDF · 8 Mo max</span>
            </>
          )}
        </button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

        <div>
          <Label htmlFor="d-type">Type de document</Label>
          <Select id="d-type" value={type} onChange={(e) => pickType(e.target.value)}>
            <option value="CNI">Carte nationale d’identité</option>
            <option value="PASSPORT">Passeport</option>
            <option value="OTHER">Autre document</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="d-label">Libellé</Label>
          <Input id="d-label" value={label} onChange={(e) => setLabel(e.target.value)} invalid={!!issues.label} />
          <FieldError>{issues.label}</FieldError>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="d-number">Numéro (optionnel)</Label>
            <Input id="d-number" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="d-exp">Expiration (optionnel)</Label>
            <Input id="d-exp" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>
        <FieldHint>Le document sera stocké de façon privée et soumis à vérification par nos services.</FieldHint>
      </form>
    </Modal>
  );
}