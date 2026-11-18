import 'server-only';
import type { NotificationType } from '@prisma/client';
import { prisma } from './db';

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  isDemo = false,
) {
  return prisma.notification.create({
    data: { userId, type, title, body, link, isDemo },
  });
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}