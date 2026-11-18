import type { NextRequest } from 'next/server';
import { apiUser, destroySession, getSessionToken } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { ApiError, ok, route } from '@/lib/api';

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    const token = await getSessionToken();
    await destroySession();
    if (user) {
      await audit({ userId: user.id, action: 'LOGOUT', entity: 'Auth', ip: getClientIp(req), metadata: { token: token ? 'present' : 'none' } });
    }
    return ok({ success: true });
  });
}