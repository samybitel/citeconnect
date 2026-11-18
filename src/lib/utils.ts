import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInCalendarDays, differenceInYears } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export function formatCurrency(cents: number) {
  return eur.format(cents / 100);
}

export function formatDate(value: Date | string, withYear = true) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(d);
}

export function formatDateShort(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export function formatTime(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d);
}

export function formatDateTime(value: Date | string) {
  return `${formatDateShort(value)} à ${formatTime(value)}`;
}

export function calcAge(birthDate: Date | string) {
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  return differenceInYears(new Date(), d);
}

export function daysUntil(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return differenceInCalendarDays(d, new Date());
}

export function fullName(user: { firstName: string; lastName: string }) {
  return `${user.firstName} ${user.lastName}`;
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function genReference(prefix: string) {
  const year = new Date().getFullYear();
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `${prefix}-${year}-${suffix}`;
}

export function genTicketCode() {
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export function maskDocumentNumber(value?: string | null) {
  if (!value) return '—';
  if (value.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}