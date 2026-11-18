import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { ALLOWED_DOC_MIME, MAX_DOC_BYTES, extForMime, saveDocument } from '@/lib/storage';
import { documentMetaSchema } from '@/lib/validation';
import { ApiError, ok, route, unauthorized, validate } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const documents = await prisma.document.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    return ok({ documents });
  });
}

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new ApiError(400, 'Fichier manquant.');
    if (!ALLOWED_DOC_MIME.includes(file.type)) throw new ApiError(400, 'Format accepté : PNG, JPEG, WebP ou PDF.');
    if (file.size > MAX_DOC_BYTES) throw new ApiError(400, 'Fichier trop lourd (8 Mo maximum).');

    const meta = validate(documentMetaSchema, {
      type: form.get('type'),
      label: form.get('label'),
      documentNumber: form.get('documentNumber') ?? '',
      expiresAt: form.get('expiresAt') ?? '',
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const storedName = await saveDocument(user.id, buffer, extForMime(file.type));

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        type: meta.type,
        label: meta.label,
        fileName: file.name,
        storedName,
        mimeType: file.type,
        size: file.size,
        status: 'PENDING',
        documentNumber: meta.documentNumber || null,
        expiresAt: meta.expiresAt ? new Date(meta.expiresAt) : null,
      },
    });

    await audit({ userId: user.id, action: 'DOCUMENT_UPLOADED', entity: 'Document', entityId: doc.id, ip: getClientIp(req), metadata: { type: meta.type } });
    await notify(user.id, 'SYSTEM', 'Document déposé', `Votre document « ${meta.label} » a été déposé et est en attente de vérification.`, '/account/documents');
    return ok({ document: doc }, 201);
  });
}