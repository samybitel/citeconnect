import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { resolvePgPoolConfig } from './database-url';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; pgPool?: pg.Pool };

const pool =
  globalForPrisma.pgPool ??
  new pg.Pool({ ...resolvePgPoolConfig(), max: Number(process.env.PG_POOL_MAX ?? 10) });

if (process.env.NODE_ENV !== 'production') globalForPrisma.pgPool = pool;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;