/** @type {import('next').NextConfig} */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  // Build autonome : .next/standalone ne contient que les fichiers réellement
  // importés par le serveur, au lieu de node_modules en entier.
  output: 'standalone',
  // Sans ça Next prend le dossier parent (qui a son propre package-lock) comme racine
  // et fabrique .next/standalone/citeconnect-site/... au lieu d'une racine plate.
  outputFileTracingRoot: projectDir,
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg', 'bcryptjs'],
  // Next trace le .js du moteur Prisma mais oublie le .wasm : sans cette inclusion le
  // build standalone plante sur chaque requête (ENOENT query_compiler_bg.wasm).
  outputFileTracingIncludes: {
    '/**': ['./node_modules/.prisma/client/**'],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;