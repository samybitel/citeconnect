export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

interface StatusMeta {
  label: string;
  tone: Tone;
}

export const DOCUMENT_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: 'En attente de vérification', tone: 'warning' },
  VERIFIED: { label: 'Vérifié', tone: 'success' },
  REJECTED: { label: 'Refusé', tone: 'danger' },
};

export const DOSSIER_STATUS: Record<string, StatusMeta> = {
  DRAFT: { label: 'Brouillon', tone: 'neutral' },
  SUBMITTED: { label: 'Soumis', tone: 'info' },
  IN_REVIEW: { label: 'En cours d’instruction', tone: 'warning' },
  APPROVED: { label: 'Approuvé', tone: 'success' },
  REJECTED: { label: 'Refusé', tone: 'danger' },
  COMPLETED: { label: 'Terminé', tone: 'success' },
};

export const APPOINTMENT_STATUS: Record<string, StatusMeta> = {
  CONFIRMED: { label: 'Confirmé', tone: 'success' },
  CANCELLED: { label: 'Annulé', tone: 'danger' },
  COMPLETED: { label: 'Terminé', tone: 'neutral' },
};

export const SUBSCRIPTION_STATUS: Record<string, StatusMeta> = {
  ACTIVE: { label: 'Actif', tone: 'success' },
  EXPIRED: { label: 'Expiré', tone: 'danger' },
  CANCELLED: { label: 'Résilié', tone: 'neutral' },
};

export const TICKET_STATUS: Record<string, StatusMeta> = {
  VALID: { label: 'Valide', tone: 'success' },
  USED: { label: 'Utilisé', tone: 'neutral' },
  EXPIRED: { label: 'Expiré', tone: 'danger' },
};

export const CHANGE_REQUEST_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: 'En attente de validation', tone: 'warning' },
  APPROVED: { label: 'Validée', tone: 'success' },
  REJECTED: { label: 'Refusée', tone: 'danger' },
};

export function statusMeta(map: Record<string, StatusMeta>, key: string): StatusMeta {
  return map[key] ?? { label: key, tone: 'neutral' };
}