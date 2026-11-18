export class ClientApiError extends Error {
  status: number;
  issues?: Record<string, string>;
  constructor(message: string, status: number, issues?: Record<string, string>) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const res = await fetch(path, {
    ...init,
    headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ClientApiError(data?.error ?? 'Une erreur est survenue.', res.status, data?.issues);
  }
  return data as T;
}

export function errorMessage(e: unknown) {
  if (e instanceof ClientApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Une erreur est survenue.';
}