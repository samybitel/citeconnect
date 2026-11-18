import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { ALLOWED_DOC_MIME, MAX_DOC_BYTES, deleteDocument, extForMime, saveDocument } from '@/lib/storage';
import { ApiError, ok, route, unauthorized } from '@/lib/api';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const doc = await prisma.document.findFirst({ where: { id, userId: user.id } });
    if (!doc) throw new ApiError(404, 'Document introuvable.');

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new ApiError(400, 'Fichier manquant.');
    if (!ALLOWED_DOC_MIME.includes(file.type)) throw new ApiError(400, 'Format accepté : PNG, JPEG, WebP ou PDF.');
    if (file.size > MAX_DOC_BYTES) throw new ApiError(400, 'Fichier trop lourd (8 Mo maximum).');

    const buffer = Buffer.from(await file.arrayBuffer());
    const storedName = await saveDocument(user.id, buffer, extForMime(file.type));
    await deleteDocument(user.id, doc.storedName);

    const updated = await prisma.document.update({
      where: { id: doc.id },
      data: { fileName: file.name, storedName, mimeType: file.type, size: file.size, status: 'PENDING' },
    });
    await audit({ userId: user.id, action: 'DOCUMENT_REPLACED', entity: 'Document', entityId: doc.id, ip: getClientIp(req) });
    await notify(user.id, 'SYSTEM', 'Document remplacé', `Le document « ${doc.label} » a été remplacé et repasse en vérification.`, '/account/documents');
    return ok({ document: updated });
  });
}