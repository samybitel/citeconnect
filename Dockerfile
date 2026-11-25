# syntax=docker/dockerfile:1
# CiteConnect — image de production (Next.js + Prisma + PostgreSQL côté compose)
# Runtime : `next start` (pas de mode standalone) avec node_modules complet,
# ce qui garantit la résolution de @prisma/client et bcryptjs (serverExternalPackages).

########## Étape 1 : installation des dépendances ##########
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

########## Étape 2 : build de l'application ##########
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Le build ne se connecte pas à la base (toutes les pages applicatives sont dynamiques).
# Une DATABASE_URL factice suffit pour `prisma generate` et `next build`.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate && npm run build

########## Étape 3 : image d'exécution ##########
# Le build Next est en mode « standalone » : .next/standalone contient déjà le
# node_modules réduit au strict nécessaire. On n'embarque donc pas les ~700 Mo de
# dépendances de dev, et on lance `node server.js` (le mode officiel du standalone).
FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# CLI base de données only (schéma + seed au démarrage), hors image applicative.
RUN npm install -g prisma@6 tsx@4
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV STORAGE_DIR=/app/storage

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh \
  && mkdir -p /app/storage \
  && chown -R node:node /app/storage /app/.next

USER node
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]