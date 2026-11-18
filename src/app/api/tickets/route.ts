import type { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { ticketPurchaseSchema } from '@/lib/validation';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';
import { genReference, genTicketCode } from '@/lib/utils';

export async function GET() {
  return route(async () => {
    const user = await apiUser();
    if (!user) return unauthorized();
    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { purchasedAt: 'desc' },
    });
    const withQr = await Promise.all(
      tickets.map(async (t) => ({
        ...t,
        qrDataUrl: await QRCode.toDataURL(t.code, { margin: 1, width: 240, errorCorrectionLevel: 'M' }),
      })),
    );
    return ok({ tickets: withQr });
  });
}

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();

    const input = validate(ticketPurchaseSchema, await parseBody(req));
    const product = await prisma.ticketProduct.findFirst({ where: { id: input.productId, active: true } });
    if (!product) throw new ApiError(404, 'Ticket introuvable.');

    const now = new Date();
    const tickets = await Promise.all(
      Array.from({ length: input.quantity }, () =>
        prisma.ticket.create({
          data: {
            userId: user.id,
            productId: product.id,
            reference: genReference('TCK'),
            code: genTicketCode(),
            status: 'VALID',
            ridesRemaining: product.rides,
            purchasedAt: now,
          },
          include: { product: true },
        }),
      ),
    );

    await notify(user.id, 'TICKET_PURCHASED', 'Ticket acheté', `${input.quantity} × ${product.name} — achat confirmé (paiement simulé).`, '/transport/tickets');
    await audit({ userId: user.id, action: 'TICKET_PURCHASED', entity: 'Ticket', ip: getClientIp(req), metadata: { productId: product.id, quantity: input.quantity } });

    return ok({ tickets }, 201);
  });
}