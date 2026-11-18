import { NextResponse } from 'next/server';
import { ZodError, type ZodTypeAny, type infer as Infer } from 'zod';

export class ApiError extends Error {
  status: number;
  issues?: Record<string, string>;
  constructor(status: number, message: string, issues?: Record<string, string>) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, issues?: Record<string, string>) {
  return NextResponse.json({ error: message, issues }, { status });
}

export const unauthorized = () => fail('Authentification requise.', 401);
export const forbidden = () => fail('Accès refusé.', 403);
export const notFound = () => fail('Ressource introuvable.', 404);

export async function parseBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, 'Corps de requête invalide.');
  }
}

export function validate<S extends ZodTypeAny>(schema: S, data: unknown): Infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!issues[key]) issues[key] = issue.message;
    }
    throw new ApiError(400, result.error.issues[0]?.message ?? 'Données invalides.', issues);
  }
  return result.data;
}

type Handler = () => Promise<Response>;

/** Enveloppe les routes API : gestion uniforme des erreurs. */
export async function route(handler: Handler): Promise<Response> {
  try {
    return await handler();
  } catch (e) {
    if (e instanceof ApiError) return fail(e.message, e.status, e.issues);
    if (e instanceof ZodError) return fail(e.issues[0]?.message ?? 'Données invalides.', 400);
    console.error('[API]', e);
    return fail('Une erreur interne est survenue.', 500);
  }
}