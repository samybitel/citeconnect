import 'server-only';
import type { NextRequest } from 'next/server';
import { prisma } from './db';

export function getClientIp(req: NextRequest | Request) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'local';
}

/**
 * Défense CSRF : vérifie que l'origine de la requête correspond à l'hôte.
 * Combinée aux cookies SameSite=Lax, elle bloque les soumissions cross-site.
 */
export function isSameOrigin(req: NextRequest | Request) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin) {
    const referer = req.headers.get('referer');
    if (!referer) return true;
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function audit(opts: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId ?? null,
        ip: opts.ip ?? null,
        userAgent: opts.userAgent ?? null,
        metadata: (opts.metadata ?? undefined) as never,
      },
    });
  } catch {
    // L'audit ne doit jamais bloquer l'opération métier.
  }
}

// Limitation de débit simple en mémoire (par IP + action).
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}