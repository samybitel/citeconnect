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

Aucune expérience de la ligne de commande n'est nécessaire pour suivre cette partie.
Un **terminal**, c'est une fenêtre où tu tapes des commandes : sur Windows tape
« PowerShell » dans le menu Démarrer et ouvre-le, sur macOS cherche « Terminal ».
Tout ce qui est écrit dans les blocs gris se copie-colle dans ce terminal, une ligne à la
fois. Les texte après `#` sont des explications, tu peux les laisser, ils ne gênent pas.

**Cloner** un dépôt, c'est en télécharger une copie sur ton ordinateur.

```bash
git clone https://github.com/samybitel/citeconnect.git
cd citeconnect
```

La première commande crée un dossier `citeconnect`, la seconde entre dedans.
Si tu ne veux pas installer Git, clique sur le bouton vert **Code → Download ZIP** sur la
page du dépôt, dézippe le fichier, puis entre dans le dossier avec
`cd chemin/vers/citeconnect-main`.

### Étape 0 — installer les deux logiciels manquants

| Logiciel | Version | Site officiel |
|---|---|---|
| **Node.js** | 22 LTS (18.18 est le minimum absolu) | [nodejs.org](https://nodejs.org) — prends la version LTS |
| **PostgreSQL** | 17, installé et **démarré** sur `localhost:5432` | [postgresql.org/download](https://www.postgresql.org/download/) |
| Git | au hasard la plus récente | [git-scm.com](https://git-scm.com) |

Pendant l'installation de PostgreSQL on te demande un mot de passe pour le compte
`postgres` : **retiens-le**, il sert à l'étape 1.

Pour vérifier que tout est en place, tape :

```bash
node -v            # doit afficher v22.x.x
npm -v             # doit afficher un nombre, par exemple 10.x.x
git --version      # doit afficher git version 2.x
```

⚠️ Le dépôt ne contient **pas** la toolchain portable (`tools/node`, `tools/pgsql`,
`tools/pgdata`) : les `scripts/*.cmd` présents dans le dossier `scripts/` ne marchent
qu'avec ces binaires. Sur une copie clonée, ignore-les et suis les 4 étapes ci-dessous
avec ton propre PostgreSQL. Les versions et le matériel détaillés sont dans
[SYSTEM-REQUIREMENTS.md](SYSTEM-REQUIREMENTS.md).

### Étape 1 — créer la base et son utilisateur

On parle à PostgreSQL avec `psql`. Sur Windows tu peux aussi faire la même chose en
collant ces deux lignes dans **pgAdmin → Query Tool**.

```bash
psql -U postgres
```

Il te demande le mot de passe choisi à l'installation de PostgreSQL. Une fois le prompt
`postgres=#` affiché, colle :

```sql
CREATE ROLE citeconnect LOGIN PASSWORD 'citeconnect_dev_2026';
CREATE DATABASE citeconnect OWNER citeconnect;
\q
```

`\q` sert à quitter. Ces deux ordres ne font rien s'ils sont déjà là : c'est sans risque de
les relancer.

### Étape 2 — le fichier de configuration `.env`

`.env` est le fichier où l'app lit son mot de passe de base et son adresse. Il est
volontairement **absent de GitHub** (jamais de secret en ligne), donc tu le crées toi-même :

```bash
cp .env.example .env
```

Puis ouvre `.env` avec ton éditeur de texte et remplace les deux premières lignes :

```
DATABASE_URL="postgresql://citeconnect:citeconnect_dev_2026@localhost:5432/citeconnect?schema=public"
APP_URL="http://localhost:3000"
```

Le reste (`SESSION_COOKIE_NAME`, `SESSION_TTL_DAYS`, `BCRYPT_ROUNDS`, `STORAGE_DIR`,
`DEMO_MODE`) est déjà réglé correctement pour du développement. Le dossier `storage/`,
qui garde tes documents privés, s'affiche tout seul au premier upload.

### Étape 3 — installer le programme et préparer la base

Quatre commandes, dans cet ordre, la première est la plus longue (1 à 5 minutes selon ta
connexion) :

```bash
npm install          # récupère les bibliothèques utilisées par le site
npm run db:generate  # génère le client d'accès à la base (télécharge le moteur Prisma)
npm run db:push      # crée les tables dans PostgreSQL
npm run db:seed      # charge les comptes de démo et le catalogue
```

Sur les npm récents (v11 et plus), `npm install` se termine par un avertissement du genre
`packages have install scripts not yet covered by allowScripts` (concernant `prisma`,
`@prisma/client`, `@prisma/engines`, `esbuild`). **Ce n'est pas une erreur** et il n'y a
rien à approuver : la commande suivante, `npm run db:generate`, fait précisément le travail
que ces scripts n'ont pas fait. La seule chose à ne pas sauter reste `db:generate` — sans
lui, le site ne démarre pas.

`npm run db:seed` lit directement le fichier `.env` : sans lui, cette commande échoue.
Tu peux relancer `db:seed` quand tu veux, il remet les comptes de démonstration à zéro.

### Étape 4 — lancer et ouvrir le site

```bash
npm run dev
```

Le terminal affiche une ligne du type `Ready in ... ms` avec l'adresse, en général en moins
de 5 secondes. **Laisse cette fenêtre ouverte** : tant que tu ne la fermes pas, le site est
allumé. Ouvre ensuite **[http://localhost:3000](http://localhost:3000)** dans ton
navigateur : la page de connexion apparaît. Pour entrer tout de suite :

```
email : demo@citeconnect.fr
mot de passe : Demo1234!
```

Le tableau de bord doit montrer des rendez-vous, un abonnement et des notifications.
Pour **arrêter** le site : `Ctrl` + `C` dans le terminal. Il faut relancer `npm run dev`
à chaque nouvelle session de travail ; la base PostgreSQL, elle, continue de tourner en
tâche de fond.

Production : `npm run build` puis `npm start` (ou Docker, voir la section suivante).

### Ça ne marche pas ?

| Ce que tu vois | Ce que ça veut dire | Ce qu'il faut faire |
|---|---|---|
| `'git' n’est pas reconnu…` | Git n'est pas installé | installe-le, ou télécharge le ZIP |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL n'est pas démarré | Windows : « Services » → PostgreSQL → Démarrer |
| `password authentication failed for user "citeconnect"` | le mot de passe du `.env` ne correspond pas à la base | refais l'étape 1, ou change le rôle : `ALTER ROLE citeconnect PASSWORD 'citeconnect_dev_2026';` |
| `P1000` / `permission denied` au `db:push` | le rôle n'a pas les droits sur la base | refais `CREATE DATABASE citeconnect OWNER citeconnect;` |
| `address already in use: 3000` | un autre site occupe déjà le port 3000 | ferme l'autre `npm run dev`, ou lance `npm run dev -- -p 3001` puis va sur `http://localhost:3001` |
| `EACCES` / `EPERM` sur `npm install` | droit refusé sur un dossier | ferme l'éditeur et les navigateurs, relance dans un dossier sans accents ni espaces |
| `'npm' n’est pas reconnu…` / `command not found: npm` | Node.js n'est pas installé, ou le terminal a été ouvert avant l'installation | ferme le terminal, rouvre-le, tape `node -v` ; si ça échoue encore, réinstalle Node.js |
| `Cannot find module '@prisma/client'` ou erreur au démarrage après `npm install` | l'étape `db:generate` a été sautée | relance `npm run db:generate`, puis `npm run dev` |
| Le navigateur affiche « site inaccessible » | le serveur n'est pas lancé, ou `APP_URL` est faux | relance `npm run dev` et vérifie `APP_URL` dans `.env` |

## Déploiement (mettre le site en ligne)

Le projet est prêt à être auto-hébergé via **Docker** (`Dockerfile`, `docker-compose.yml`,
`docker-entrypoint.sh`, `.env.production.example`). En bref, sur un serveur avec Docker :

```bash
cp .env.production.example .env   # renseigner POSTGRES_PASSWORD et APP_URL
docker compose up -d --build
docker compose exec app tsx prisma/seed.ts   # comptes démo + test (une fois)
```

Pas de Docker chez l'hébergeur ? `npm run build && npm run pack` fabrique un dossier
`deploy/` de **65 Mo** qui se pose sur n'importe quel serveur Node.js (section 7 de
`DEPLOIEMENT.md`).

👉 **Guide complet pas à pas : [DEPLOIEMENT.md](DEPLOIEMENT.md)** — choix de l'hébergeur
(VPS + Docker recommandé, ~4–5 €/mois ; alternative Render/Railway), nom de domaine + HTTPS,
sauvegardes, mises à jour et référence des variables d'environnement.

> **Ce qu'il faut chez l'hébergeur :** un environnement qui **exécute Node.js** et garde un
> **disque persistant** (base PostgreSQL + documents privés). Un export statique (`out/`,
> `output: 'export'`) ne peut pas marcher : il n'y a ni routes API, ni sessions, ni base.
> Depuis que Prisma tourne sur son **moteur WASM + driver `pg`** (aucun binaire natif),
> les plateformes fermées aux binaires deviennent possibles — Wasmer Edge compris, même si
> ce n'est pas le chemin recommandé.

### Paquet de déploiement léger (65 Mo)

`npm run build` produit un serveur autonome dans `.next/standalone` ; `npm run pack` en tire
un dossier `deploy/` prêt à envoyer :

```bash
npm run build   # puis :
npm run pack    # assemble deploy/ (~65 Mo, dépendances incluses)
```

`deploy/` contient le serveur (`node server.js`), ses dépendances déjà résolues, le moteur
Prisma WASM, les fichiers statiques et le schéma. Ni `node_modules` de développement, ni
`tools/`, ni cache. Zippé, le paquet pèse **19 Mo** — contre 1,9 Go pour le dossier de
développement complet. Le démarrage sur place :

```bash
cd deploy
node server.js                        # PORT, DATABASE_URL (ou DB_*), APP_URL, STORAGE_DIR
```

Comme le paquet embarque tout, il se pose indifféremment sur un VPS, un conteneur, un
hébergeur Node ou une interface d'upload d'hébergeur.

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