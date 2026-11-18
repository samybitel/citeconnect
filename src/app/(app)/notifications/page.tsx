import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { NotificationsCenter, type NotificationItem } from '@/components/notifications/NotificationsCenter';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const serialized: NotificationItem[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    isDemo: n.isDemo,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Vos alertes de rendez-vous, démarches, documents et transport."
        back={{ href: '/dashboard', label: 'Tableau de bord' }}
      />
      <NotificationsCenter initial={serialized} />
    </div>
  );
}