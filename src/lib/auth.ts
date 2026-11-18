import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma } from './db';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'cc_session';
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? '7');
const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? '12');

/** Cookie sécurisé uniquement si l'app est servie en HTTPS (sinon login cassé en HTTP). */
function cookieSecure() {
  const url = process.env.APP_URL ?? '';
  if (url) return url.startsWith('https://');
  return process.env.NODE_ENV === 'production';
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function sessionExpiry() {
  return new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
}

async function setSessionCookie(token: string, expires: Date) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure(),
    path: '/',
    expires,
  });
}

async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure(),
    path: '/',
    maxAge: 0,
  });
}

export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
) {
  const token = randomBytes(32).toString('hex');
  const expires = sessionExpiry();
  await prisma.session.create({
    data: {
      id: token,
      userId,
      expiresAt: expires,
      userAgent: meta.userAgent ?? undefined,
      ip: meta.ip ?? undefined,
    },
  });
  await setSessionCookie(token, expires);
  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: token } });
  }
  await clearSessionCookie();
}

export async function destroyAllSessions(userId: string, exceptToken?: string) {
  await prisma.session.deleteMany({
    where: { userId, ...(exceptToken ? { id: { not: exceptToken } } : {}) },
  });
}

export async function getSessionToken() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

/** Utilisateur courant (ou null). Mis en cache pour la durée de la requête. */
export const getSessionUser = cache(async () => {
  const token = await getSessionToken();
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { user: { include: { address: true } } },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.deleteMany({ where: { id: token } });
    return null;
  }
  return session.user;
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

/** Pour les pages serveur : redirige vers /login si non connecté. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

/** Pour les routes API : renvoie l'utilisateur ou null (gérer 401 côté route). */
export async function apiUser() {
  return getSessionUser();
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}