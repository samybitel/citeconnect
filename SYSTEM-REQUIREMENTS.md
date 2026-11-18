# CiteConnect — Exigences système (System Requirements)

Prérequis matériels et logiciels pour **faire tourner** CiteConnect, que ce soit sur un
poste de développement ou sur un serveur en ligne.

Application : **Next.js 15 (App Router) + React 19 + TypeScript**, backend **Prisma 6 /
PostgreSQL**, authentification par **sessions en base**.
Ce n'est **pas** un site statique : il faut un environnement qui exécute **Node.js** et
qui conserve un **disque persistant** pour la base et les documents.

---

## 1. Environnement de développement (Windows / Linux / macOS)

### Matériel

| Élément | Minimum | Recommandé |
|---|---|---|
| CPU | 2 cœurs | 4 cœurs |
| RAM | 4 Go | 8 Go (le build Next.js est gourmand) |
| Disque | 2 Go libres | 4 Go (dépendances npm + base locale + documents de test) |
| Écran | 1280×720 | 1920×1080 ou plus (le menu latéral a besoin de largeur) |

### Logiciels

| Logiciel | Version | Rôle | Obligatoire |
|---|---|---|---|
| **Node.js** | **≥ 18.18** (version 18 exigée en minimum par Next.js 15) — **22 LTS recommandé**, testé avec Node 24 | exécute le serveur et les scripts | ✅ |
| **npm** | livrée avec Node (≥ 9) | installe les dépendances | ✅ |
| **PostgreSQL** | **17** (seule version réellement testée sur ce projet) | base de données | ✅ |
| **Git** | ≥ 2.30 | récupérer le code | ✅ |
| Éditeur | VS Code + extension Prisma/ESLint | confort | optionnel |

> Le dépôt GitHub **ne contient pas** la toolchain portable (`tools/node`, `tools/pgsql`,
> `tools/pgdata`, `scripts/*.cmd`) : elle reste sur le poste de développement local.
> En clonant le dépôt, il faut donc **installer Node.js et PostgreSQL soi-même**, ou
> réutiliser ces scripts depuis la copie locale du projet.

### Accès réseau (développement)

- **Une fois** au démarrage : accès à `registry.npmjs.org` (`npm install`) et au registre
  de Prisma (`npx prisma generate`, qui télécharge le moteur de base).
- Ensuite, le site tourne **hors ligne** : la police Inter est auto-hébergée dans
  `src/fonts/`, aucun appel à Google Fonts ni à un CDN.

---

## 2. Environnement de production (serveur en ligne)

### Matériel (VPS ou dédiée)

| Élément | Minimum | Confortable |
|---|---|---|
| vCPU | 1 | **2** |
| RAM | 1,5 Go (avec swap de 1 Go) | **2 à 4 Go** |
| Disque SSD | 10 Go | **20 Go** (base + volume `storage/` des documents) |
| Bande passante | 100 Mbit/s | — |

Ces chiffres correspondent à un usage de démonstration ou à une petite commune
(quelques dizaines d'utilisateurs simultanés). Au-delà, prévoir davantage de RAM et une
base PostgreSQL sur une machine séparée.

### Logiciels

| Option | Ce qu'il faut |
|---|---|
| **Recommandée : Docker** | Ubuntu 22.04 ou 24.04 LTS, **Docker Engine ≥ 24**, **Docker Compose v2**, **Git**. Node.js et PostgreSQL ne sont **pas** installés sur l'hôte : ils tournent dans les conteneurs (`node:22-bookworm-slim` et `postgres:17-alpine`). |
| Alternative : PaaS (Render, Railway, Fly.io) | support des **applications Docker** + une **base PostgreSQL managée** + un **disque persistant** monté sur `/app/storage`. |
| Alternative : Node installé sur le serveur | Ubuntu 22.04/24.04, Node 22 LTS, PostgreSQL 17, un reverse proxy (Nginx ou Caddy) pour HTTPS. |

### Incompatibilités connues

| Hébergement | Verdict | Pourquoi |
|---|---|---|
| Page GitHub, Netlify/Vercel en export statique, tout serveur « edge » WASM | ❌ **impossible** | pas de Node.js avec disque persistant : ni base, ni login, ni documents |
| Mutualisé PHP (OVH Perso, o2switch, Hostinger Web…) | ❌ **impossible** | ne fait pas tourner Node.js ni PostgreSQL |
| VPS avec Docker, Render, Railway, Fly.io | ✅ **supporté** | voir `DEPLOIEMENT.md` |

---

## 3. Réseau et ports

| Port | Usage | Exposition |
|---|---|---|
| **3000** | serveur Next.js (`APP_PORT`) | **en interne uniquement** (127.0.0.1), derrière le reverse proxy |
| **80 / 443** | HTTP / HTTPS publics | ouverts, avec un pare-feu (`ufw`) |
| **5432** | PostgreSQL | **jamais** ouvert sur Internet |

Exigences réseau en production :

- un **nom de domaine** pointant vers l'IP du serveur ;
- un **certificat TLS** (Let's Encrypt via Caddy ou certbot) — **sans HTTPS la connexion
  ne fonctionne pas**, car le cookie de session passe en mode `secure` dès que `APP_URL`
  commence par `https://` ;
- accès sortant (HTTPS) du serveur vers `registry.npmjs.org` uniquement pendant le build.

---

## 4. Navigateurs côté utilisateur

| Navigateur | Support |
|---|---|
| Chrome / Edge récents | ✅ |
| Firefox récent | ✅ |
| Safari récent (macOS et iOS) | ✅ |
| Navigateurs de plus de 2 ans, Android 4/5, IE 11 | ❌ non testés |

Prérequis chez le visiteur :

- **JavaScript activé** (l'application est entièrement en React) ;
- **cookies autorisés** pour le domaine : la session est un cookie `httpOnly` nommé
  `cc_session`, sans cookie il est impossible de rester connecté ;
- pas d'extension de blocage agressif qui casserait les requêtes vers `/api/*` ;
- pour le contrôle sur téléphone : un écran capable d'afficher le QR code du ticket.

L'interface est **mobile-first** : elle s'adapte du téléphone (barre de navigation en bas)
à l'ordinateur (menu latéral), sans application à installer.

---

## 5. Base de données

- **PostgreSQL 17**, encodage `UTF8`.
- Schéma créé avec `npm run db:push` (ou `prisma migrate` en production).
- Un jeu de données de démonstration est chargé avec `npm run db:seed`
  (comptes `demo@citeconnect.fr` et `test@citeconnect.fr` + catalogue des procédures,
  abonnements et produits de billetterie).
- Droits : l'utilisateur de la base doit pouvoir créer les tables et écrire. Pas besoin
  de droits superutilisateur.

---

## 6. Variables d'environnement

### Développement — fichier `.env` (jamais envoyé sur GitHub)

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/citeconnect?schema=public"
APP_URL="http://localhost:3000"
APP_NAME="CiteConnect"
SESSION_COOKIE_NAME="cc_session"
SESSION_TTL_DAYS="7"
BCRYPT_ROUNDS="12"
STORAGE_DIR="./storage"
DEMO_MODE="true"
```

### Production (Docker) — fichier `.env` à côté de `docker-compose.yml`

| Variable | Valeur | Contrainte |
|---|---|---|
| `POSTGRES_USER` | `citeconnect` | |
| `POSTGRES_DB` | `citeconnect` | |
| `POSTGRES_PASSWORD` | — | **à changer absolument**, mot de passe fort (`openssl rand -hex 24`) |
| `APP_URL` | `https://ton-domaine.fr` | doit être l'URL publique exacte, sinon cookies et CSRF cassent |
| `APP_PORT` | `3000` | ne pas exposer au public |
| `SESSION_COOKIE_NAME` | `cc_session` | |
| `SESSION_TTL_DAYS` | `7` | |
| `BCRYPT_ROUNDS` | `12` | plus haut = plus lent à la connexion |
| `DEMO_MODE` | `true` en vitrine, `false` sinon | `true` affiche les badges « Fictif » |
| `SEED_ON_START` | `false` | `true` écraserait les comptes à chaque redémarrage |

Le modèle complet commenté est dans `.env.example` et `.env.production.example`.

---

## 7. Dossiers et droits d'écriture

| Chemin | Droit nécessaire | Contenu |
|---|---|---|
| `storage/` (dev) — `/app/storage` (Docker) | **écriture par l'utilisateur qui lance Node** | documents officiels et avatars, **hors partie publique** |
| `.next/` | écriture | build de Next.js, régénéré |
| `public/` | lecture seule | fichiers servis publiquement |

En Docker, `storage/` est tenu par un **volume nommé** : sans lui, les documents
disparaissent au moindre redémarrage du conteneur. Sauvegarde à prévoir (voir
`DEPLOIEMENT.md`, section sauvegardes).

---

## 8. Limites techniques à connaître (contraintes système)

Ces limites sont codées dans l'application, donc l'infrastructure doit les supporter.

| Sujet | Limite |
|---|---|
| Document uploadé | **8 Mo** maximum, formats **PNG, JPEG, WebP, PDF** uniquement |
| Tickets achetés en une fois | 1 à 10 |
| Durée d'un rendez-vous | 15 à 120 minutes (30 par défaut) |
| Mot de passe | 8 caractères minimum, 1 lettre et 1 chiffre |
| Taille de requête | l'app ne fixe pas de limite globale, mais **Nginx bloque à 1 Mo par défaut** : monter `client_max_body_size` à `10m` derrière un reverse proxy, sinon l'upload de 8 Mo échoue |
| Session | 7 jours (variable) |
| Code postal | 5 chiffres |
| Nom / prénom | 60 caractères, libellés de document 80 |
| Hachage des mots de passe | bcrypt, 12 tours (coût CPU à chaque connexion) |

### Mise à l'échelle

- La **limitation de débit** sur la connexion (anti force brute) est gardée **en mémoire** :
  il faut donc faire tourner **une seule instance** de l'application. Plusieurs réplicas
  derrière un répartiteur de charge désactiveraient cette protection.
- Les sessions sont en base, ce qui permettrait plusieurs instances **si** la limitation
  de débit était déplacée vers Redis. Ce n'est pas le cas dans cette version.
- Le volume `storage/` doit être partagé ou sauvegardé si on passe sur plusieurs machines.

---

## 9. Résumé express

| | Développement | Production |
|---|---|---|
| OS | Windows 10/11, Linux, macOS | Ubuntu 22.04 ou 24.04 LTS |
| Node.js | ≥ 18.18, 22 recommandé | image Docker `node:22` |
| PostgreSQL | 17 local | 17 (conteneur ou managé) |
| RAM | 8 Go | 2 à 4 Go |
| Disque | 4 Go | 20 Go avec volume persistant |
| Docker | non requis | **requis** (sauf Node installé à la main) |
| HTTPS | non requis | **requis** |
| Navigateur | Chrome / Edge / Firefox / Safari récents, JavaScript et cookies activés | idem |
