import { apiUser } from '@/lib/auth';
import { unreadCount } from '@/lib/notifications';
import { ok, route, unauthorized } from '@/lib/api';

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const unread = await unreadCount(user.id);
    return ok({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        birthDate: user.birthDate,
        phone: user.phone,
        avatarPath: user.avatarPath,
        role: user.role,
        isDemo: user.isDemo,
        address: user.address,
      },
      unread,
    });
  });
}