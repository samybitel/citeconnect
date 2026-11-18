import { Badge } from './Badge';
import {
  APPOINTMENT_STATUS,
  CHANGE_REQUEST_STATUS,
  DOCUMENT_STATUS,
  DOSSIER_STATUS,
  SUBSCRIPTION_STATUS,
  TICKET_STATUS,
  statusMeta,
} from '@/lib/status';

const MAPS = {
  document: DOCUMENT_STATUS,
  dossier: DOSSIER_STATUS,
  appointment: APPOINTMENT_STATUS,
  subscription: SUBSCRIPTION_STATUS,
  ticket: TICKET_STATUS,
  changeRequest: CHANGE_REQUEST_STATUS,
} as const;

export function StatusBadge({
  kind,
  status,
}: {
  kind: keyof typeof MAPS;
  status: string;
}) {
  const meta = statusMeta(MAPS[kind], status);
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}