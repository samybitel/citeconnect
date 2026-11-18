import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { audit, getClientIp, isSameOrigin } from '@/lib/security';
import { notify } from '@/lib/notifications';
import { dossierSchema } from '@/lib/validation';
import { ApiError, ok, parseBody, route, unauthorized, validate } from '@/lib/api';
import { genReference } from '@/lib/utils';

export async function POST(req: NextRequest) {
  return route(async () => {
    if (!isSameOrigin(req)) throw new ApiError(403, 'Origine de requête invalide.');
    const user = await apiUser();
    if (!user) return unauthorized();

    const input = validate(dossierSchema, await parseBody(req));
    const procedure = await prisma.procedure.findFirst({ where: { id: input.procedureId, active: true } });
    if (!procedure) throw new ApiError(404, 'Démarche introuvable.');

    const reference = genReference('DOS');
    const dossier = await prisma.dossier.create({
      data: {
        userId: user.id,
        procedureId: procedure.id,
        reference,
        status: 'SUBMITTED',
        data: { ...input.data, demandeur: `${user.firstName} ${user.lastName}` } as never,
        events: { create: [{ label: 'Demande soumise', status: 'SUBMITTED' }] },
      },
    });

    await notify(user.id, 'DOSSIER_UPDATED', 'Démarche soumise', `Votre demande « ${procedure.title} » (réf. ${reference}) a été soumise.`, `/services/dossiers/${dossier.id}`);
    await audit({ userId: user.id, action: 'DOSSIER_CREATED', entity: 'Dossier', entityId: dossier.id, ip: getClientIp(req), metadata: { procedureId: procedure.id } });

    return ok({ dossier: { id: dossier.id, reference } }, 201);
  });
}