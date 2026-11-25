#!/bin/sh
# CiteConnect — point d'entrée du conteneur applicatif.
# 1) applique le schéma Prisma, 2) seed optionnel, 3) démarre Next.js.
set -e

echo "[entrypoint] Application du schéma de base de données (prisma db push)…"
npx prisma db push --skip-generate

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "[entrypoint] Seed des données de démonstration (comptes démo + test)…"
  tsx prisma/seed.ts
fi

echo "[entrypoint] Démarrage du serveur Next.js (standalone) sur 0.0.0.0:${PORT:-3000}…"
exec node server.js