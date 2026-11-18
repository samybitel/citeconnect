import type { NextRequest } from 'next/server';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { ApiError, ok, route, unauthorized } from '@/lib/api';

export const runtime = 'nodejs';

const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR ?? './storage');
const AVATAR_DIR = path.join(STORAGE_DIR, 'avatars');
const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX = 4 * 1024 * 1024;

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    if (!user.avatarPath) throw new ApiError(404, 'Aucune photo de profil.');
    const target = path.resolve(STORAGE_DIR, user.avatarPath);
    if (!target.startsWith(AVATAR_DIR)) throw new ApiError(400, 'Chemin invalide.');
    const buf = await readFile(target);
    const ext = path.extname(target).toLowerCase();
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'private, max-age=60',
        'X-Content-Type-Options': 'nosniff',
      },
    });
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
    if (!ALLOWED.includes(file.type)) throw new ApiError(400, 'Format accepté : PNG, JPEG ou WebP.');
    if (file.size > MAX) throw new ApiError(400, 'Image trop lourde (4 Mo maximum).');

    const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
    await mkdir(AVATAR_DIR, { recursive: true });
    const rel = path.join('avatars', `${user.id}${ext}`);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(STORAGE_DIR, rel), buf);

    if (user.avatarPath && user.avatarPath !== rel) {
      try {
        await unlink(path.resolve(STORAGE_DIR, user.avatarPath));
      } catch {
        // ancien fichier absent
      }
    }

    await prisma.user.update({ where: { id: user.id }, data: { avatarPath: rel } });
    await audit({ userId: user.id, action: 'AVATAR_UPDATED', entity: 'User', entityId: user.id, ip: getClientIp(req) });
    return ok({ avatarPath: rel });
  });
}