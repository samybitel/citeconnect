# Déployer CiteConnect (site + appli)

Ce guide explique comment mettre CiteConnect en ligne toi-même. Le projet est déjà prêt :
il contient un `Dockerfile`, un `docker-compose.yml` et un fichier `.env.production.example`.

> « Site » et « appli » : CiteConnect est une **web app responsive**. Le même site s'utilise
> sur ordinateur et sur mobile (barre de navigation en bas sur téléphone). Sur mobile, tu peux
> l'« installer » via le menu du navigateur → « Ajouter à l'écran d'accueil ». Pas besoin de
> publier une appli native sur les stores pour ce projet.

---

## 1. Ce qu'il faut comprendre avant de choisir un hébergeur

CiteConnect a besoin de **deux choses** que tous les hébergeurs ne donnent pas :

1. **Une base PostgreSQL** (comptes, rendez-vous, dossiers, tickets, notifications…).
2. **Un disque persistant** pour les documents privés (`storage/` : CNI, passeports, avatars).
   Ces fichiers ne doivent **jamais** être publics et doivent survivre aux redémarrages.

Conséquence :

- ✅ **VPS + Docker** (recommandé) : tu as la main sur tout, PostgreSQL + disque persistant, pas cher.
- ✅ **Hébergeur « managed » qui lit un Dockerfile** (Render, Railway) : moins de technique, mais il faut ajouter une base Postgres et un disque persistant.
- ❌ **Hébergement PHP mutualisé classique** (OVH « Perso », o2switch, Hostinger web…) : fait pour PHP/WordPress, **ne fait pas tourner Node.js ni PostgreSQL**. Impossible sans tout réécrire.
- ❌ **Vercel / Netlify « serverless »** : pas de disque persistant pour les documents privés et pas de Postgres durable inclus. Il faudrait refactoriser le stockage vers un objet storage (S3…) et une base externe. Pas adapté en l'état.
- ❌ **Wasmer Edge / tout hébergement statique** : Wasmer sert soit du statique (dossier `out/`), soit du « edge » (WASM). Ni l'un ni l'autre ne fait tourner le moteur natif de Prisma ni un serveur Node avec disque persistant. Un déploiement statique de CiteConnect **échoue** (pas de base, pas de login, pas de documents). Il faut un hébergeur Node (Docker).

### Ma recommandation

**Un petit VPS sous Linux avec Docker Compose.** Compte ~4 à 5 €/mois :

- **Hetzner** (CX22, ~4,5 €/mois, Allemagne/Finlande) — excellent rapport prix/perf.
- **OVH** (VPS Starter, ~4 €/mois, France) — datacenter en France, pratique pour un projet municipal.
- **Scaleway** (DEV1-S, ~5 €/mois, France) — autre option française.

Prends **Ubuntu 24.04** (ou 22.04), 2 vCPU / 2–4 Go de RAM suffisent largement.

Si tu ne veux **pas** gérer un serveur : **Render** ou **Railway** (section 6).

---

## 2. Préparer le serveur (VPS)

Connecte-toi en SSH à ton VPS, puis installe Docker :

```bash
# Installer Docker + le plugin Compose (script officiel)
curl -fsSL https://get.docker.com | sh

# Vérifier
docker --version
docker compose version
```

> Pas besoin d'installer Node.js ni PostgreSQL sur le serveur : **Docker s'en occupe** dans les conteneurs.

---

## 3. Envoyer le projet sur le serveur

Tu dois envoyer le **code source**, pas les binaires de dev Windows. Le dossier `tools/`
(Node + PostgreSQL portables, ~plusieurs centaines de Mo) est **inutile** sur le serveur.

Deux méthodes :

**A. Avec Git (le plus simple si ton code est sur un dépôt) :**

```bash
git clone <URL_DE_TON_DEPOT> citeconnect
cd citeconnect
```

**B. Avec SCP depuis ton PC Windows (Git Bash) :**

```bash
# Envoie le projet sans tools/ ni node_modules/ ni storage/
scp -r src prisma scripts package.json package-lock.json \
  next.config.mjs postcss.config.mjs tailwind.config.ts tsconfig.json \
  next-env.d.ts Dockerfile docker-compose.yml docker-entrypoint.sh \
  .dockerignore .env.production.example \
  utilisateur@IP_DU_VPS:/home/utilisateur/citeconnect/
```

> Les fichiers `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`, `.dockerignore`
> et `.env.production.example` sont **indispensables** : c'est eux qui construisent le site.

---

## 4. Configurer puis lancer

Sur le serveur, dans le dossier du projet :

```bash
# 1. Créer le fichier de configuration
cp .env.production.example .env

# 2. Générer un mot de passe fort pour la base
openssl rand -hex 24
```

Ouvre `.env` (avec `nano .env`) et renseigne :

- `POSTGRES_PASSWORD=` le mot de passe généré ci-dessus (**obligatoire**, ne laisse pas la valeur par défaut).
- `APP_URL=` l'URL publique :
  - pour un premier test sans domaine : `http://IP_DU_VPS:3000`
  - avec un nom de domaine en HTTPS : `https://citeconnect.mondomaine.fr`
- `DEMO_MODE=true` pour garder les badges « Fictif » et le compte de démo (projet hackathon).
- `SEED_ON_START=false` (on seed une seule fois à la main, voir plus bas).

Puis construis et démarre :

```bash
docker compose up -d --build
```

La première fois, Docker télécharge les images et compile le site (2–5 min). Suivre les logs :

```bash
docker compose logs -f app
```

Tu dois voir `[entrypoint] … Démarrage de Next.js` puis `✓ Ready`.

### Créer les comptes de démo / test (une seule fois)

```bash
docker compose exec app node --import tsx prisma/seed.ts
```

Cela crée :

| Rôle | Email | Mot de passe |
|---|---|---|
| Démo (données fictives) | `demo@citeconnect.fr` | `Demo1234!` |
| Test (compte vierge) | `test@citeconnect.fr` | `Test1234!` |

> ⚠️ En vraie production publique, change ces mots de passe ou mets `DEMO_MODE=false`
> et ne seed pas le compte de démo. Ici c'est un projet de démonstration.

### Accéder au site

- Sans domaine : `http://IP_DU_VPS:3000`
- Le port 3000 doit être ouvert dans le firewall du VPS (voir section 7).

---

## 5. Mettre un nom de domaine + HTTPS (recommandé)

Le plus simple : **Caddy** comme reverse proxy. Il obtient et renouvelle le certificat HTTPS
tout seul (Let's Encrypt).

1. Fais pointer ton domaine (enregistrement **A**) vers l'IP du VPS.
2. Installe Caddy sur le serveur :

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

3. Édite `/etc/caddy/Caddyfile` :

```
citeconnect.mondomaine.fr {
    reverse_proxy 127.0.0.1:3000
}
```

4. Recharge Caddy :

```bash
sudo systemctl reload caddy
```

5. Dans `.env`, mets `APP_URL=https://citeconnect.mondomaine.fr` puis :

```bash
docker compose up -d
```

> **Important :** le cookie de session devient automatiquement « secure » quand `APP_URL`
> commence par `https://`. C'est voulu : en HTTPS le cookie est protégé, en HTTP simple il
> reste utilisable pour tes tests. Ne mets donc `https://` que quand le HTTPS est vraiment en place.

Pour que le site ne soit accessible **que** via Caddy (pas en direct sur le port 3000),
tu peux remplacer dans `docker-compose.yml` la ligne des ports de `app` :

```yaml
    ports:
      - "127.0.0.1:3000:3000"
```

---

## 6. Alternative sans serveur à gérer : Render / Railway

Ces plateformes lisent directement le `Dockerfile`.

**Render :**

1. Crée un **Web Service** depuis ton dépôt Git → Render détecte le Dockerfile.
2. Ajoute une base **PostgreSQL** (Render Postgres) et copie son `Internal Database URL`.
3. Ajoute un **Disk** persistant monté sur `/app/storage` (sinon les documents sont perdus à chaque déploiement).
4. Variables d'environnement à mettre :
   - `DATABASE_URL` = l'URL Postgres interne
   - `APP_URL` = `https://ton-service.onrender.com`
   - `STORAGE_DIR` = `/app/storage`
   - `DEMO_MODE`, `SESSION_TTL_DAYS`, `BCRYPT_ROUNDS` (voir `.env.production.example`)
5. Déploie. Le schéma est appliqué automatiquement au démarrage (`prisma db push`).
6. Seed une fois via le **Shell** Render : `node --import tsx prisma/seed.ts`.

**Railway :** même principe (service depuis Dockerfile + plugin PostgreSQL + volume monté sur `/app/storage`).

> Limites : l'offre gratuite Render « s'endort » après inactivité (premier accès lent) et le
> disque persistant est payant. Pour un projet durable et pas cher, le VPS reste le meilleur choix.

---

## 7. Firewall, sauvegardes, mises à jour

**Ouvrir les ports (VPS, avec ufw) :**

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# Port 3000 seulement si tu accèdes en direct sans domaine :
sudo ufw allow 3000/tcp
sudo ufw enable
```

> N'expose **jamais** le port 5432 (PostgreSQL) sur internet : la base reste sur le réseau interne Docker.

**Sauvegarder la base :**

```bash
docker compose exec db pg_dump -U citeconnect citeconnect > sauvegarde-$(date +%F).sql
```

**Sauvegarder les documents privés :** ils sont dans le volume Docker `storage`.

```bash
docker run --rm -v citeconnect_storage:/data -v "$PWD":/backup alpine \
  tar czf /backup/storage-$(date +%F).tar.gz -C /data .
```

> Le nom exact du volume peut varier (`docker volume ls` pour vérifier, souvent `citeconnect_storage`).

**Mettre à jour le site après une modification du code :**

```bash
git pull                      # ou renvoyer les fichiers modifiés
docker compose up -d --build
```

**Commandes utiles :**

```bash
docker compose ps             # état des conteneurs
docker compose logs -f app    # logs du site
docker compose restart app    # redémarrer le site
docker compose down           # tout arrêter (les données restent dans les volumes)
```

> `docker compose down -v` **efface** la base et les documents (destructif). À ne pas faire sauf volonté de tout réinitialiser.

---

## 8. Référence des variables d'environnement

| Variable | Rôle | Exemple |
|---|---|---|
| `POSTGRES_USER` | Utilisateur de la base | `citeconnect` |
| `POSTGRES_PASSWORD` | Mot de passe de la base (**à changer**) | `openssl rand -hex 24` |
| `POSTGRES_DB` | Nom de la base | `citeconnect` |
| `DATABASE_URL` | Connexion Prisma (construite auto dans compose) | `postgresql://…@db:5432/citeconnect` |
| `APP_URL` | URL publique ; pilote le cookie « secure » | `https://citeconnect.mondomaine.fr` |
| `APP_PORT` | Port publié sur l'hôte | `3000` |
| `STORAGE_DIR` | Dossier privé des documents (fixé dans l'image) | `/app/storage` |
| `DEMO_MODE` | Badges « Fictif » + compte de démo | `true` |
| `SEED_ON_START` | Re-seed à chaque démarrage (déconseillé en prod) | `false` |
| `SESSION_COOKIE_NAME` | Nom du cookie de session | `cc_session` |
| `SESSION_TTL_DAYS` | Durée de session (jours) | `7` |
| `BCRYPT_ROUNDS` | Coût du hachage des mots de passe | `12` |

---

## 9. Notes techniques (bon à savoir)

- **Police auto-hébergée :** le site n'appelle **pas** Google Fonts. La police Inter est
  incluse dans `src/fonts/` → le build fonctionne **même sans internet** et ne fuite pas
  l'IP des visiteurs vers un CDN tiers (mieux pour le RGPD).
- **Runtime :** l'image utilise `next start` (pas le mode standalone) avec `node_modules`
  complet, pour que Prisma et bcryptjs se chargent correctement.
- **Schéma de base :** appliqué automatiquement au démarrage via `prisma db push --skip-generate`.
  Pour un suivi de migrations plus fin en production, tu peux passer à `prisma migrate deploy`.
- **Documents privés :** stockés dans le volume `storage`, servis uniquement par des routes
  authentifiées avec contrôle de propriété. Rien n'est accessible publiquement.
- **Simulations :** NFC Express, paiement et démarches restent simulés (aucune transaction
  réelle). Les points de branchement sont décrits dans le `README.md`.