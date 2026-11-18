import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .regex(/[A-Za-z]/, 'Le mot de passe doit contenir au moins une lettre.')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre.');

export const loginSchema = z.object({
  email: z.string().email('Adresse électronique invalide.'),
  password: z.string().min(1, 'Mot de passe requis.'),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis.').max(60),
  lastName: z.string().min(1, 'Nom requis.').max(60),
  email: z.string().email('Adresse électronique invalide.'),
  username: z
    .string()
    .min(3, 'Identifiant trop court.')
    .max(40)
    .regex(/^[a-z0-9._-]+$/, 'Identifiant : lettres minuscules, chiffres, . _ - uniquement.'),
  password,
  birthDate: z.string().min(1, 'Date de naissance requise.'),
  phone: z.string().max(20).optional().or(z.literal('')),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis.'),
  newPassword: password,
});

export const addressSchema = z.object({
  street: z.string().min(3, 'Adresse requise.').max(120),
  complement: z.string().max(120).optional().or(z.literal('')),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide (5 chiffres).'),
  city: z.string().min(1, 'Ville requise.').max(80),
  country: z.string().min(1).max(60).default('France'),
});

export const profileSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  phone: z.string().max(20).optional().or(z.literal('')),
});

export const changeRequestSchema = z.object({
  field: z.enum(['email', 'phone', 'address']),
  newValue: z.string().min(1, 'Nouvelle valeur requise.'),
});

export const appointmentSchema = z.object({
  service: z.enum(['ETAT_CIVIL', 'URBANISME', 'LOGEMENT', 'SCOLAIRE', 'ACCOUNT']),
  motif: z.string().min(3, 'Motif requis.').max(200),
  date: z.string().min(1, 'Date requise.'),
  durationMin: z.number().int().min(15).max(120).default(30),
});

export const documentMetaSchema = z.object({
  type: z.enum(['CNI', 'PASSPORT', 'OTHER']),
  label: z.string().min(1, 'Libellé requis.').max(80),
  documentNumber: z.string().max(40).optional().or(z.literal('')),
  expiresAt: z.string().optional().or(z.literal('')),
});

export const ticketPurchaseSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
});

export const subscriptionSchema = z.object({
  planId: z.string().min(1),
  autoRenew: z.boolean().default(false),
});

export const nfcSchema = z.object({
  mode: z.enum(['BUS', 'TRAIN', 'TRAM']),
  ticketId: z.string().optional().or(z.literal('')),
  line: z.string().min(1).max(40),
  stop: z.string().min(1).max(80),
});

export const dossierSchema = z.object({
  procedureId: z.string().min(1),
  data: z.record(z.string(), z.unknown()).default({}),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;