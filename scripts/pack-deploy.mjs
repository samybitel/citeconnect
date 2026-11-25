/**
 * Assemble un dossier de déploiement autonome pour CiteConnect.
 *
 * Le résultat ne contient que ce qui sert à exécuter le site : le serveur Next
 * (mode standalone), les fichiers statiques, les polices/icônes, le schéma Prisma.
 * Ni node_modules de développement, ni tools/, ni cache de build.
 *
 * Usage : node scripts/pack-deploy.mjs [dossier_sortie]   (défaut : deploy)
 * Prérequis : avoir lancé `npm run build` avant.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(projectDir, process.argv[2] ?? 'deploy');
const standaloneDir = path.join(projectDir, '.next', 'standalone');
const wasmFile = path.join(standaloneDir, 'node_modules', '.prisma', 'client', 'query_compiler_bg.wasm');

function fail(message) {
  console.error(`\n[pack] ÉCHEC : ${message}\n`);
  process.exit(1);
}

function copy(relativeFrom, relativeTo) {
  const from = path.join(projectDir, relativeFrom);
  const to = path.join(outDir, relativeTo);
  if (!existsSync(from)) fail(`élément manquant : ${relativeFrom} (as-tu lancé \`npm run build\` ?)`);
  cpSync(from, to, { recursive: true });
  console.log(`[pack] ${relativeFrom}  ->  ${path.relative(outDir, to) || '.'}`);
}

function totalBytes(target) {
  const stat = statSync(target);
  if (stat.isFile()) return stat.size;
  let sum = 0;
  for (const entry of readdirSync(target)) sum += totalBytes(path.join(target, entry));
  return sum;
}

if (!existsSync(standaloneDir)) fail('pas de .next/standalone — lance `npm run build` d’abord.');
if (!existsSync(wasmFile)) {
  fail(
    'le moteur Prisma (query_compiler_bg.wasm) est absent du build standalone.\n' +
      '       Vérifie outputFileTracingIncludes dans next.config.mjs, puis relance le build.',
  );
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

copy(path.join('.next', 'standalone'), '.');
copy(path.join('.next', 'static'), path.join('.next', 'static'));
copy('public', 'public');
copy('src', 'src');
copy(path.join('prisma', 'schema.prisma'), path.join('prisma', 'schema.prisma'));
copy(path.join('prisma', 'seed.ts'), path.join('prisma', 'seed.ts'));

writeFileSync(
  path.join(outDir, 'DEMARRAGE.txt'),
  [
    'CiteConnect - paquet de deploiement (site dynamique)',
    '',
    'Demarrage        : node server.js      (port lu dans la variable PORT)',
    'Variables        : DATABASE_URL   ou   DB_HOST + DB_PORT + DB_NAME + DB_USERNAME + DB_PASSWORD',
    '                  APP_URL (https://... en production), STORAGE_DIR (dossier existant et inscriptible)',
    '',
    'AVANT LA PREMIERE UTILISATION (une seule fois) : creer les tables de la base.',
    'Le paquet ne contient pas le CLI Prisma (il ajouterait ~40 Mo). Deux facons de faire :',
    '  a) si le serveur a Internet :  npx prisma@6 db push --skip-generate',
    '  b) sinon, depuis TON ordinateur : dans le projet citeconnect-site, mets la DATABASE_URL',
    '     de la base en ligne dans le fichier .env, puis :  npm run db:push   (et npm run db:seed',
    '     pour les donnees de demonstration).',
    'Sous Docker, ces deux etapes sont faites toutes seules au demarrage.',
    '',
    'Le dossier node_modules est deja fourni (build Next en mode standalone) :',
    "pas besoin de 'npm install' ni de 'npm run build' sur lhebergeur.",
    "Ne pas utiliser 'npm start' / 'next start' : avec output standalone, le serveur",
    'officiel est node server.js.',
    '',
  ].join('\r\n'),
  'utf8',
);

const bytes = totalBytes(outDir);
console.log(`\n[pack] dossier prêt : ${outDir}`);
console.log(`[pack] taille totale : ${(bytes / 1024 / 1024).toFixed(1)} Mo\n`);
