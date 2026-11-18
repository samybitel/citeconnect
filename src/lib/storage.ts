import 'server-only';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR ?? './storage');
const DOCS_DIR = path.join(STORAGE_DIR, 'documents');

function userDir(userId: string) {
  return path.join(DOCS_DIR, userId);
}

/** Empêche toute évasion hors du dossier de stockage privé. */
function safeJoin(userId: string, storedName: string) {
  const base = userDir(userId);
  const target = path.resolve(base, storedName);
  if (!target.startsWith(base + path.sep) && target !== base) {
    throw new Error('Chemin de stockage invalide.');
  }
  return target;
}

export async function saveDocument(userId: string, buffer: Buffer, ext: string) {
  const dir = userDir(userId);
  await mkdir(dir, { recursive: true });
  const storedName = `${randomBytes(16).toString('hex')}${ext}`;
  await writeFile(safeJoin(userId, storedName), buffer);
  return storedName;
}

export async function readDocument(userId: string, storedName: string) {
  return readFile(safeJoin(userId, storedName));
}

export async function deleteDocument(userId: string, storedName: string) {
  try {
    await unlink(safeJoin(userId, storedName));
  } catch {
    // Fichier déjà absent : on ignore.
  }
}

export const ALLOWED_DOC_MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
export const MAX_DOC_BYTES = 8 * 1024 * 1024; // 8 Mo

export function extForMime(mime: string) {
  switch (mime) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    default:
      return '.bin';
  }
}