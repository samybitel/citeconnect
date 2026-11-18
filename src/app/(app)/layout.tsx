import { requireUser } from '@/lib/auth';
import { unreadCount } from '@/lib/notifications';
import { AppShell } from '@/components/layout/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await unreadCount(user.id);

  return (
    <AppShell
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        avatarPath: user.avatarPath,
        isDemo: user.isDemo,
      }}
      unread={unread}
    >
      {children}
    </AppShell>
  );
}