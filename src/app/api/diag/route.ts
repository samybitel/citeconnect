import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Attempt = { ok: boolean; error?: string; name?: string };

function describe(e: unknown): Attempt {
  const err = e as { name?: string; message?: string };
  let message = String(err?.message ?? e);
  for (const key of ['DB_PASSWORD', 'DB_USERNAME', 'DATABASE_URL']) {
    const secret = process.env[key];
    if (secret) message = message.split(secret).join('***');
  }
  return { ok: false, name: err?.name, error: message.slice(0, 700) };
}

async function attempt(load: () => Promise<unknown>): Promise<Attempt> {
  try {
    await load();
    return { ok: true };
  } catch (e) {
    return describe(e);
  }
}

export async function GET() {
  const modules: Record<string, Attempt> = {};
  modules['@/lib/db'] = await attempt(() => import('@/lib/db'));
  modules['pg'] = await attempt(() => import('pg'));
  modules['@prisma/client'] = await attempt(() => import('@prisma/client'));
  modules['@prisma/adapter-pg'] = await attempt(() => import('@prisma/adapter-pg'));
  modules['bcryptjs'] = await attempt(() => import('bcryptjs'));

  const env: Record<string, string | boolean | null> = {
    NODE_ENV: process.env.NODE_ENV ?? null,
    APP_URL: process.env.APP_URL ?? null,
    STORAGE_DIR: process.env.STORAGE_DIR ?? null,
    DB_HOST: process.env.DB_HOST ?? null,
    DB_PORT: process.env.DB_PORT ?? null,
    DB_NAME: process.env.DB_NAME ?? null,
    DB_USERNAME: Boolean(process.env.DB_USERNAME),
    DB_PASSWORD: Boolean(process.env.DB_PASSWORD),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
  };

  let query: Attempt = { ok: false, error: 'non tentée' };
  try {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const pg = (await import('pg')).default;
    const { resolvePgPoolConfig } = await import('@/lib/database-url');
    const pool = new pg.Pool({ ...resolvePgPoolConfig(), max: 1, connectionTimeoutMillis: 8000 });
    const client = new PrismaClient({ adapter: new PrismaPg(pool) });
    const rows = await client.$queryRaw<Array<{ ok: number }>>`SELECT 1 as ok`;
    query = { ok: true, error: JSON.stringify(rows) };
    await client.$disconnect();
    await pool.end();
  } catch (e) {
    query = describe(e);
  }

  return NextResponse.json({
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      versions: process.versions,
    },
    env,
    modules,
    query,
  });
}