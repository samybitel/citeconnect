import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { readDocument } from '@/lib/storage';
import { ApiError, route, unauthorized } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const doc = await prisma.document.findFirst({ where: { id, userId: user.id } });
    if (!doc) throw new ApiError(404, 'Document introuvable.');
    const buf = await readDocument(user.id, doc.storedName);
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `inline; filename="${doc.fileName.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });
}