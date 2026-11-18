import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { deleteDocument } from '@/lib/storage';
import { ApiError, ok, route, unauthorized } from '@/lib/api';

export const runtime = 'nodejs';

async function ownedDoc(userId: string, id: string) {
  const doc = await prisma.document.findFirst({ where: { id, userId } });
  if (!doc) throw new ApiError(404, 'Document introuvable.');
  return doc;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const doc = await ownedDoc(user.id, id);
    return ok({ document: doc });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const doc = await ownedDoc(user.id, id);
    await deleteDocument(user.id, doc.storedName);
    await prisma.document.delete({ where: { id: doc.id } });
    await audit({ userId: user.id, action: 'DOCUMENT_DELETED', entity: 'Document', entityId: doc.id, ip: getClientIp(req) });
    await notify(user.id, 'SYSTEM', 'Document supprimé', `Le document « ${doc.label} » a été supprimé de votre espace.`, '/account/documents');
    return ok({ success: true });
  });
}