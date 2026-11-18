import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { subscriptionSchema } from '@/lib/validation';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';
import { formatDate, genReference } from '@/lib/utils';

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ subscriptions });
  });
}

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();

    const input = validate(subscriptionSchema, await parseBody(req));
    const plan = await prisma.transportPlan.findFirst({ where: { id: input.planId, active: true } });
    if (!plan) throw new ApiError(404, 'Formule introuvable.');

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Une seule souscription active à la fois : les précédentes passent expirées.
    await prisma.subscription.updateMany({ where: { userId: user.id, status: 'ACTIVE' }, data: { status: 'EXPIRED' } });

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: now,
        endDate,
        autoRenew: input.autoRenew,
        reference: genReference('ABO'),
      },
      include: { plan: true },
    });

    await notify(user.id, 'SYSTEM', 'Abonnement souscrit', `Votre abonnement ${plan.name} est actif jusqu’au ${formatDate(endDate)}.`, '/transport/subscriptions');
    await audit({ userId: user.id, action: 'SUBSCRIPTION_CREATED', entity: 'Subscription', entityId: subscription.id, ip: getClientIp(req), metadata: { planId: plan.id } });

    return ok({ subscription }, 201);
  });
}