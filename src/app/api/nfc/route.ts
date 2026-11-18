import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { nfcSchema } from '@/lib/validation';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const validations = await prisma.nfcValidation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { ticket: { select: { reference: true, product: { select: { name: true } } } } },
    });
    return ok({ validations });
  });
}

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();

    const input = validate(nfcSchema, await parseBody(req));
    const now = new Date();

    const activeSub = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE', endDate: { gte: now }, plan: { modes: { has: input.mode } } },
      include: { plan: true },
    });

    const presentedTicket = input.ticketId
      ? await prisma.ticket.findFirst({ where: { id: input.ticketId, userId: user.id }, include: { product: true } })
      : null;

    let status: 'SUCCESS' | 'FAILED';
    let message: string;
    let usedTicketId: string | null = presentedTicket?.id ?? null;
    let updatedTicket = null as null | { id: string; ridesRemaining: number; status: string };

    if (activeSub) {
      status = 'SUCCESS';
      message = `Abonnement ${activeSub.plan.name} — voyage validé.`;
      usedTicketId = null;
    } else if (presentedTicket) {
      const expired = presentedTicket.expiresAt !== null && presentedTicket.expiresAt.getTime() < now.getTime();
      if (presentedTicket.status !== 'VALID' || presentedTicket.ridesRemaining <= 0) {
        status = 'FAILED';
        message = 'Ce ticket n’est plus valide (épuisé ou déjà utilisé).';
      } else if (expired) {
        status = 'FAILED';
        message = 'Ce ticket a expiré. Veuillez en acheter un nouveau.';
      } else {
        status = 'SUCCESS';
        const remaining = presentedTicket.ridesRemaining - 1;
        const expiresAt = presentedTicket.expiresAt ?? new Date(now.getTime() + presentedTicket.product.validityMinutes * 60000);
        const ticket = await prisma.ticket.update({
          where: { id: presentedTicket.id },
          data: {
            ridesRemaining: remaining,
            status: remaining <= 0 ? 'USED' : 'VALID',
            activatedAt: presentedTicket.activatedAt ?? now,
            expiresAt,
          },
        });
        updatedTicket = { id: ticket.id, ridesRemaining: ticket.ridesRemaining, status: ticket.status };
        message = remaining > 0 ? `Ticket validé — ${remaining} voyage${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}.` : 'Ticket validé — dernier voyage utilisé.';
      }
    } else {
      status = 'FAILED';
      message = 'Aucun titre de transport valide. Présentez un ticket ou un abonnement.';
    }

    const validation = await prisma.nfcValidation.create({
      data: { userId: user.id, ticketId: usedTicketId, mode: input.mode, status, message, line: input.line, stop: input.stop },
    });
    await audit({ userId: user.id, action: 'NFC_VALIDATION', entity: 'NfcValidation', entityId: validation.id, ip: getClientIp(req), metadata: { mode: input.mode, status, simulated: true } });

    return ok({ validation, ticket: updatedTicket });
  });
}