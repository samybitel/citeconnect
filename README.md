# CiteConnect

Plateforme numérique centralisée des services municipaux : **Mon compte**, **Service public** et **Transport**, avec tableau de bord personnalisé, centre de notifications, mode clair/sombre et interface mobile-first.

> Projet de démonstration (hackathon). Les données du compte de démonstration sont **fictives**. NFC Express, le paiement et les démarches sont **simulés** : aucune transaction réelle, aucune connexion à un système municipal, bancaire ou de transport réel.

---

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 3** (mode sombre par classe, palette bleu institutionnel)
- **Prisma 6** + **PostgreSQL 17** (binaires portables inclus dans `tools/`)
- Authentification par session en base (cookie `httpOnly` `SameSite=Lax`), **bcryptjs**
- Validation **zod** partagée client/serveur, journal d’audit, stockage privé des documents

## Clonage et environnement

```bash
git clone https://github.com/samybitel/citeconnect.git
cd citeconnect
```

### Prérequis à installer toi-même

| Outil | Version |
|---|---|
| Node.js | ≥ 18.18 (22 LTS recommandé) |
| npm | livré avec Node |
| PostgreSQL | 17, démarré sur `localhost:5432` |
| Git | ≥ 2.30 |

⚠️ Le dépôt ne contient **pas** la toolchain portable (`tools/node`, `tools/pgsql`,
`tools/pgdata`) : les `scripts/*.cmd` du dépôt ne fonctionnent qu'avec ces binaires, donc
sur une copie fraîchement clonée suis les étapes ci-dessous avec ton propre PostgreSQL.
Le détail des versions et du matériel est dans [SYSTEM-REQUIREMENTS.md](SYSTEM-REQUIREMENTS.md).

### 1. Créer la base et l'utilisateur

```bash
psql -U postgres -c "CREATE ROLE citeconnect LOGIN PASSWORD 'citeconnect_dev_2026';"
psql -U postgres -c "CREATE DATABASE citeconnect OWNER citeconnect;"
```

### 2. Variables d'environnement

```bash
cp .env.example .env      # .env est ignoré par git : il ne monte jamais sur GitHub
```

Renseigne au moins la première ligne :

```
DATABASE_URL="postgresql://citeconnect:citeconnect_dev_2026@localhost:5432/citeconnect?schema=public"
APP_URL="http://localhost:3000"
```

`SESSION_COOKIE_NAME`, `SESSION_TTL_DAYS`, `BCRYPT_ROUNDS`, `STORAGE_DIR` et `DEMO_MODE`
ont des valeurs convenables par défaut (le dossier `storage/` est créé tout seul au
premier upload).

### 3. Dépendances, schéma, données de démonstration

```bash
npm install
npm run db:generate   # télécharge le moteur Prisma + génère le client
npm run db:push       # crée les tables
npm run db:seed       # comptes démo + catalogue (procédures, abonnements, tickets)
```

`npm run db:seed` lit `.env` directement : sans ce fichier la commande échoue.

### 4. Lancer

```bash
npm run dev           # http://localhost:3000
```

Vérification rapide : va sur `/login`, connecte-toi avec `demo@citeconnect.fr` /
`Demo1234!` et le tableau de bord doit afficher rendez-vous, abonnement et notifications.

Production : `npm run build` puis `npm start` (ou Docker, voir la section suivante).

## Déploiement (mettre le site en ligne)

Le projet est prêt à être auto-hébergé via **Docker** (`Dockerfile`, `docker-compose.yml`,
`docker-entrypoint.sh`, `.env.production.example`). En bref, sur un serveur avec Docker :

```bash
cp .env.production.example .env   # renseigner POSTGRES_PASSWORD et APP_URL
docker compose up -d --build
docker compose exec app node --import tsx prisma/seed.ts   # comptes démo + test (une fois)
```

👉 **Guide complet pas à pas : [DEPLOIEMENT.md](DEPLOIEMENT.md)** — choix de l'hébergeur
(VPS + Docker recommandé, ~4–5 €/mois ; alternative Render/Railway), nom de domaine + HTTPS,
sauvegardes, mises à jour et référence des variables d'environnement.

> **Pourquoi pas Wasmer (ni aucun hébergement statique) :** CiteConnect a un vrai backend
> (PostgreSQL + sessions + documents privés). Il faut donc un hébergeur qui **exécute Node.js**
> et garde un disque persistant. Un export statique (type `output: 'export'` / dossier `out/`)
> ou le runtime « edge » de Wasmer ne peuvent pas faire tourner la base ni le moteur Prisma :
> le login, les comptes et les documents ne marcheraient pas. C'est pour ça qu'un déploiement
> statique échoue. Le chemin supporté est Docker (VPS, Render ou Railway).

## Comptes

| Rôle | Email | Mot de passe | Contenu |
|---|---|---|---|
| Démonstration | `demo@citeconnect.fr` | `Demo1234!` | Données fictives riches (RDV, dossiers, abonnement, tickets, documents, notifications) |
| Test | `test@citeconnect.fr` | `Test1234!` | Compte vierge pour parcourir les parcours de bout en bout |

`npm run db:seed` réinitialise ces deux comptes et le catalogue (procédures, abonnements, produits de billetterie).

## Fonctionnalités

- **Tableau de bord** : prochains rendez-vous, abonnement actif, dernières démarches, documents récents, notifications non lues.
- **01 · Mon compte** : profil, adresse, email (avec demandes de changement), documents officiels (upload/remplacement/suppression, stockage privé), sécurité (mot de passe, sessions actives, déconnexion).
- **02 · Service public** : catalogue de procédures par catégorie (état civil, urbanisme, logement, scolaire), dépôt de démarches avec suivi par événements, prise/modification/annulation de rendez-vous sur créneaux réels.
- **03 · Transport** : modes et lignes, abonnements (souscription/renouvellement/expiration), billetterie (achat, ticket numérique QR), **NFC Express simulé** (validation par abonnement ou consommation de ticket, historique).
- **Notifications** : centre avec filtres toutes/non lues, marquage lu (unitaire ou global), suppression, badge temps réel dans la navigation.
- **Transverse** : mode clair/sombre, navigation latérale (desktop) / barre inférieure (mobile), toasts, états vides, validation client + serveur.

## Sécurité

- Sessions en base, cookie `httpOnly` `SameSite=Lax` ; mots de passe hachés bcrypt.
- Défense CSRF par vérification `Origin`/`Referer` sur toutes les mutations.
- Validation zod côté serveur sur chaque entrée ; séparation stricte des données par utilisateur.
- Documents stockés **hors de `/public`** (`storage/`), servis uniquement par des routes authentifiées avec contrôle de propriété et anti-path-traversal.
- Journal d’audit (`AuditLog`) sur les actions sensibles ; limitation de débit en mémoire sur l’authentification.
- En-têtes de sécurité (CSP, `X-Frame-Options`, `nosniff`, etc.) dans `next.config.mjs`.
- Minimisation RGPD : seules les données nécessaires sont collectées ; aucun fichier personnel dans le frontend ; police auto-hébergée (aucun appel à Google Fonts).

## Points d’intégration (simulations à remplacer)

- **Paiement** : `src/app/api/subscriptions/route.ts` et `src/app/api/tickets/route.ts` créent directement les titres (paiement simulé). Brancher ici un PSP réel.
- **NFC / validation** : `src/app/api/nfc/route.ts` reproduit la logique de validation (abonnement actif ou ticket consommé). Brancher ici le réseau de validateurs réel.
- **Démarches municipales** : catalogue et statuts dans `prisma/seed.ts` / `src/lib/constants.ts`. Brancher ici les SI municipaux réels.

## Scripts

| Script | Rôle |
|---|---|
| `scripts/db-init.cmd` | Initialise le cluster PostgreSQL portable + rôle/base |
| `scripts/db-start.cmd` / `db-stop.cmd` | Démarre / arrête PostgreSQL |
| `scripts/setup.cmd` | install + generate + push + seed |
| `scripts/dev.cmd` | PostgreSQL + `next dev` |
| `npm run db:seed` | Réinitialise démo + test + catalogue |
| `npm run build` / `start` | Build / serveur de production |

## Structure

```
src/app/(app)/      pages authentifiées (dashboard, account, services, transport, notifications)
src/app/api/        routes API (auth, account, documents, dossiers, appointments, subscriptions, tickets, nfc, notifications)
src/components/     UI (design system), layout, modules métier
src/lib/            auth, db, security, storage, notifications, validation, constants
src/fonts/          police Inter auto-hébergée (build possible hors ligne, sans Google Fonts)
prisma/             schema.prisma + seed.ts
storage/            documents & avatars privés (hors public)
tools/              Node.js + PostgreSQL portables (dev Windows uniquement)
scripts/            scripts de lancement Windows
Dockerfile, docker-compose.yml, docker-entrypoint.sh, .env.production.example   déploiement
```