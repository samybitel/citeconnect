/* eslint-disable no-console */
import { PrismaClient, type ServiceCategory, type TransportMode } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEMO_ACCOUNT, TEST_ACCOUNT } from '../src/lib/constants';
import { resolvePgPoolConfig } from '../src/lib/database-url';

const prisma = new PrismaClient({ adapter: new PrismaPg(new pg.Pool(resolvePgPoolConfig())) });
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR ?? './storage');

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function atTime(base: Date, h: number, m: number) {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function nextWeekday(base: Date, daysAhead: number) {
  let d = addDays(base, daysAhead);
  while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
  return d;
}

async function writeDemoDoc(userId: string, name: string, text: string) {
  const dir = path.join(STORAGE_DIR, 'documents', userId);
  await mkdir(dir, { recursive: true });
  const buf = await QRCode.toBuffer(text, { type: 'png', width: 480, margin: 2 });
  const storedName = `${name}.png`;
  await writeFile(path.join(dir, storedName), buf);
  return storedName;
}

async function writeDemoAvatar(userId: string, initials: string) {
  const dir = path.join(STORAGE_DIR, 'avatars');
  await mkdir(dir, { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2553e8"/><stop offset="1" stop-color="#0b2545"/></linearGradient></defs><rect width="256" height="256" fill="url(#g)"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-size="104" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
  const rel = path.join('avatars', `${userId}.svg`);
  await writeFile(path.join(STORAGE_DIR, rel), svg);
  return rel;
}

const ALL_MODES: TransportMode[] = ['BUS', 'TRAIN', 'TRAM'];

async function seedCatalog() {
  const procedures: {
    id: string;
    category: ServiceCategory;
    title: string;
    summary: string;
    description: string;
    requiredDocuments: string[];
    steps: string[];
    durationLabel: string;
  }[] = [
    {
      id: 'acte-naissance',
      category: 'ETAT_CIVIL',
      title: 'Acte de naissance',
      summary: 'Demander une copie intégrale ou un extrait d’acte de naissance.',
      description:
        'L’acte de naissance est un document officiel qui atteste de la naissance d’une personne. Il peut être demandé par l’intéressé, ses parents ou ses représentants légaux. La demande se fait en ligne puis le document est retiré au guichet ou envoyé par courrier.',
      requiredDocuments: ['Pièce d’identité en cours de validité', 'Livret de famille (si disponible)'],
      steps: ['Remplir le formulaire de demande', 'Joindre les pièces justificatives', 'Validation par le service état civil', 'Retrait ou envoi du document'],
      durationLabel: '5 à 10 jours ouvrés',
    },
    {
      id: 'acte-mariage',
      category: 'ETAT_CIVIL',
      title: 'Acte de mariage',
      summary: 'Obtenir une copie d’acte de mariage.',
      description:
        'L’acte de mariage atteste de l’union de deux personnes. Il est délivré aux époux, à leurs parents ou représentants légaux. Mention de la date et du lieu de mariage.',
      requiredDocuments: ['Pièce d’identité', 'Date et lieu du mariage'],
      steps: ['Formulaire de demande', 'Vérification des informations', 'Délivrance de l’acte'],
      durationLabel: '5 à 8 jours ouvrés',
    },
    {
      id: 'acte-deces',
      category: 'ETAT_CIVIL',
      title: 'Acte de décès',
      summary: 'Demander une copie d’acte de décès.',
      description:
        'L’acte de décès est délivré à toute personne qui en fait la demande. Il est nécessaire pour de nombreuses démarches administratives et successorales.',
      requiredDocuments: ['Nom et date du décès', 'Pièce d’identité du demandeur'],
      steps: ['Formulaire de demande', 'Recherche dans les registres', 'Délivrance de l’acte'],
      durationLabel: '3 à 7 jours ouvrés',
    },
    {
      id: 'demande-document',
      category: 'ETAT_CIVIL',
      title: 'Demande de document administratif',
      summary: 'Certificat de résidence, attestation, légalisation…',
      description:
        'Regroupe les demandes de documents administratifs divers : certificat de résidence, attestation d’accueil, légalisation de signature et autres démarches d’état civil.',
      requiredDocuments: ['Pièce d’identité', 'Justificatif de domicile de moins de 3 mois'],
      steps: ['Sélection du document', 'Dépôt des justificatifs', 'Instruction', 'Mise à disposition'],
      durationLabel: 'Variable selon le document',
    },
    {
      id: 'permis-construire',
      category: 'URBANISME',
      title: 'Permis de construire',
      summary: 'Déposer une demande de permis de construire.',
      description:
        'Le permis de construire est obligatoire pour les constructions neuves et certains travaux d’ampleur. Le dossier est instruit par le service urbanisme qui vérifie la conformité au plan local d’urbanisme.',
      requiredDocuments: ['Plan de situation', 'Plan de masse', 'Notice descriptive', 'Photographies du terrain'],
      steps: ['Constitution du dossier', 'Dépôt en mairie', 'Instruction (2 à 3 mois)', 'Décision et affichage'],
      durationLabel: '2 à 3 mois',
    },
    {
      id: 'declaration-travaux',
      category: 'URBANISME',
      title: 'Déclaration préalable de travaux',
      summary: 'Déclarer des travaux de faible importance.',
      description:
        'La déclaration préalable concerne les travaux de faible importance : clôture, ravalement, petite extension, changement de destination. L’instruction est plus rapide qu’un permis.',
      requiredDocuments: ['Plan de situation', 'Plan des façades', 'Insertion paysagère'],
      steps: ['Formulaire Cerfa', 'Dépôt du dossier', 'Instruction (1 mois)', 'Décision'],
      durationLabel: '1 mois',
    },
    {
      id: 'logement-social',
      category: 'LOGEMENT',
      title: 'Demande de logement social',
      summary: 'Déposer ou renouveler une demande de logement social.',
      description:
        'La demande de logement social est unique et valable pour l’ensemble des bailleurs de la ville. Elle donne lieu à un numéro unique d’enregistrement et à un suivi personnalisé.',
      requiredDocuments: ['Pièce d’identité', 'Avis d’imposition', 'Justificatifs de revenus', 'Justificatif de domicile'],
      steps: ['Formulaire unique', 'Dépôt des pièces', 'Enregistrement et numéro unique', 'Commission d’attribution'],
      durationLabel: 'Variable selon disponibilité',
    },
    {
      id: 'accompagnement-logement',
      category: 'LOGEMENT',
      title: 'Accompagnement logement',
      summary: 'Aides, dispositifs d’accompagnement et conseils.',
      description:
        'Information et orientation vers les dispositifs d’aide au logement : aides financières, accompagnement des seniors, lutte contre l’habitat indigne et conseil en rénovation.',
      requiredDocuments: ['Pièce d’identité', 'Justificatif de domicile'],
      steps: ['Prise de rendez-vous', 'Diagnostic de la situation', 'Orientation vers le dispositif adapté'],
      durationLabel: 'Sur rendez-vous',
    },
    {
      id: 'inscription-scolaire',
      category: 'SCOLAIRE',
      title: 'Inscription scolaire',
      summary: 'Inscrire un enfant dans une école de la ville.',
      description:
        'L’inscription scolaire concerne les écoles maternelles et élémentaires publiques. Elle se fait auprès du service affaires scolaires qui affecte l’enfant dans un établissement selon le secteur.',
      requiredDocuments: ['Livret de famille', 'Justificatif de domicile', 'Carnet de vaccination', 'Certificat de radiation (si changement d’école)'],
      steps: ['Formulaire d’inscription', 'Vérification du secteur', 'Affectation', 'Admission à l’école'],
      durationLabel: 'Avant la rentrée',
    },
    {
      id: 'inscription-cantine',
      category: 'SCOLAIRE',
      title: 'Inscription à la cantine',
      summary: 'Inscrire un enfant à la restauration scolaire.',
      description:
        'La restauration scolaire propose des repas équilibrés. L’inscription se fait en ligne et la tarification est calculée selon le quotient familial.',
      requiredDocuments: ['Livret de famille', 'Avis d’imposition', 'Attestation de quotient familial'],
      steps: ['Formulaire d’inscription', 'Calcul du tarif', 'Validation', 'Accès à la cantine'],
      durationLabel: 'Sous 1 semaine',
    },
    {
      id: 'periscolaire',
      category: 'SCOLAIRE',
      title: 'Services périscolaires',
      summary: 'Garderie, étude surveillée, activités du mercredi.',
      description:
        'Les services périscolaires accueillent les enfants avant et après la classe, le mercredi et pendant les vacances. Inscription et réservation depuis l’espace affaires scolaires.',
      requiredDocuments: ['Livret de famille', 'Fiche sanitaire', 'Justificatif de domicile'],
      steps: ['Choix des activités', 'Inscription', 'Réservation des créneaux', 'Confirmation'],
      durationLabel: 'Sous 1 semaine',
    },
  ];

  for (const p of procedures) {
    await prisma.procedure.upsert({ where: { id: p.id }, update: p, create: p });
  }

  const plans = [
    { id: 'mensuel', name: 'Mensuel', description: 'Voyages illimités pendant 30 jours sur tout le réseau.', priceCents: 4500, durationDays: 30, modes: ALL_MODES, popular: true },
    { id: 'annuel', name: 'Annuel', description: 'Voyages illimités pendant 12 mois, le plus économique.', priceCents: 45000, durationDays: 365, modes: ALL_MODES, popular: false },
    { id: 'etudiant', name: 'Étudiant', description: 'Tarif réduit pour les étudiants de moins de 26 ans.', priceCents: 2500, durationDays: 30, modes: ALL_MODES, popular: false },
    { id: 'semaine', name: 'Semaine', description: 'Voyages illimités pendant 7 jours.', priceCents: 1200, durationDays: 7, modes: ALL_MODES, popular: false },
    { id: 'senior', name: 'Senior', description: 'Tarif réduit pour les plus de 65 ans.', priceCents: 2000, durationDays: 30, modes: ALL_MODES, popular: false },
  ];
  for (const p of plans) {
    await prisma.transportPlan.upsert({ where: { id: p.id }, update: p, create: p });
  }

  const products = [
    { id: 'unitaire', name: 'Ticket unitaire', description: 'Un voyage sur tout le réseau, valable 1 h après validation.', priceCents: 180, rides: 1, validityMinutes: 60, modes: ALL_MODES },
    { id: 'carnet10', name: 'Carnet de 10', description: '10 voyages à tarif réduit, valables 1 h 30 après validation.', priceCents: 1500, rides: 10, validityMinutes: 90, modes: ALL_MODES },
    { id: 'journee', name: 'Pass journée', description: 'Voyages illimités pendant 24 h.', priceCents: 600, rides: 99, validityMinutes: 1440, modes: ALL_MODES },
  ];
  for (const p of products) {
    await prisma.ticketProduct.upsert({ where: { id: p.id }, update: p, create: p });
  }
}

async function seedDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_ACCOUNT.email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash(DEMO_ACCOUNT.password, 12);
  const birthDate = new Date('1998-04-12T00:00:00');
  const user = await prisma.user.create({
    data: {
      email: DEMO_ACCOUNT.email,
      username: DEMO_ACCOUNT.username,
      passwordHash,
      firstName: DEMO_ACCOUNT.firstName,
      lastName: DEMO_ACCOUNT.lastName,
      birthDate,
      phone: '06 12 34 56 78',
      role: 'CITIZEN',
      isDemo: true,
      address: {
        create: { street: '12 rue des Lilas', postalCode: '31000', city: 'Toulouse', country: 'France' },
      },
    },
  });

  user.avatarPath = await writeDemoAvatar(user.id, 'CM');
  await prisma.user.update({ where: { id: user.id }, data: { avatarPath: user.avatarPath } });

  // Documents officiels fictifs
  const cniFile = await writeDemoDoc(user.id, 'demo-cni', 'CiteConnect — Document de démonstration — CNI');
  const passportFile = await writeDemoDoc(user.id, 'demo-passport', 'CiteConnect — Document de démonstration — Passeport');
  await prisma.document.createMany({
    data: [
      { userId: user.id, type: 'CNI', label: 'Carte nationale d’identité', fileName: 'cni-camille-martin.png', storedName: cniFile, mimeType: 'image/png', size: 4096, status: 'VERIFIED', documentNumber: '123456789012', expiresAt: new Date('2030-01-01'), isDemo: true },
      { userId: user.id, type: 'PASSPORT', label: 'Passeport', fileName: 'passeport-camille-martin.png', storedName: passportFile, mimeType: 'image/png', size: 4096, status: 'PENDING', documentNumber: '987654321', expiresAt: new Date('2029-06-01'), isDemo: true },
    ],
  });

  // Abonnement actif
  const now = new Date();
  const subStart = addDays(now, -10);
  const subEnd = addDays(subStart, 30);
  await prisma.subscription.create({
    data: { userId: user.id, planId: 'mensuel', status: 'ACTIVE', startDate: subStart, endDate: subEnd, autoRenew: true, reference: 'ABO-DEMO-0001', isDemo: true },
  });

  // Tickets
  const ticket1 = await prisma.ticket.create({
    data: { userId: user.id, productId: 'carnet10', reference: 'TCK-DEMO-0001', code: '1234567890123456', status: 'VALID', ridesRemaining: 7, purchasedAt: addDays(now, -5), isDemo: true },
  });
  await prisma.ticket.create({
    data: { userId: user.id, productId: 'unitaire', reference: 'TCK-DEMO-0002', code: '2345678901234567', status: 'USED', ridesRemaining: 0, purchasedAt: addDays(now, -12), activatedAt: addDays(now, -12), isDemo: true },
  });
  await prisma.ticket.create({
    data: { userId: user.id, productId: 'journee', reference: 'TCK-DEMO-0003', code: '3456789012345678', status: 'VALID', ridesRemaining: 99, purchasedAt: addDays(now, -1), isDemo: true },
  });

  // Historique NFC
  await prisma.nfcValidation.createMany({
    data: [
      { userId: user.id, ticketId: ticket1.id, mode: 'BUS', status: 'SUCCESS', message: 'Validation réussie', line: 'Ligne 12', stop: 'Gare centrale', isDemo: true, createdAt: addDays(now, -1) },
      { userId: user.id, ticketId: ticket1.id, mode: 'TRAM', status: 'SUCCESS', message: 'Validation réussie', line: 'T1', stop: 'Université', isDemo: true, createdAt: addDays(now, -2) },
      { userId: user.id, ticketId: ticket1.id, mode: 'BUS', status: 'FAILED', message: 'Ticket non valide', line: 'Ligne 4', stop: 'Hôtel de ville', isDemo: true, createdAt: addDays(now, -3) },
      { userId: user.id, ticketId: ticket1.id, mode: 'TRAIN', status: 'SUCCESS', message: 'Validation réussie', line: 'Ligne R1', stop: 'Gare centrale', isDemo: true, createdAt: addDays(now, -4) },
    ],
  });

  // Rendez-vous
  const rdv1 = atTime(nextWeekday(now, 3), 10, 0);
  const rdv2 = atTime(nextWeekday(now, 7), 14, 0);
  await prisma.appointment.createMany({
    data: [
      { userId: user.id, service: 'ETAT_CIVIL', serviceLabel: 'État civil', motif: 'Retrait d’un acte de naissance', date: rdv1, durationMin: 30, status: 'CONFIRMED', location: 'Mairie centrale — Guichet État civil', reference: 'RDV-DEMO-0001', isDemo: true },
      { userId: user.id, service: 'SCOLAIRE', serviceLabel: 'Affaires scolaires', motif: 'Inscription à la cantine', date: rdv2, durationMin: 30, status: 'CONFIRMED', location: 'Mairie annexe — Affaires scolaires', reference: 'RDV-DEMO-0002', isDemo: true },
      { userId: user.id, service: 'URBANISME', serviceLabel: 'Urbanisme', motif: 'Dépôt de déclaration préalable', date: atTime(addDays(now, -10), 9, 30), durationMin: 30, status: 'COMPLETED', location: 'Mairie centrale — Service Urbanisme', reference: 'RDV-DEMO-0003', isDemo: true },
      { userId: user.id, service: 'LOGEMENT', serviceLabel: 'Logement', motif: 'Point sur la demande de logement', date: atTime(addDays(now, -20), 15, 0), durationMin: 30, status: 'CANCELLED', location: 'Maison des services — Pôle Logement', reference: 'RDV-DEMO-0004', isDemo: true },
    ],
  });

  // Dossiers / démarches
  const dossier1 = await prisma.dossier.create({
    data: {
      userId: user.id, procedureId: 'acte-naissance', reference: 'DOS-DEMO-0001', status: 'IN_REVIEW', isDemo: true,
      data: { type: 'Copie intégrale', nom: 'Martin', prenom: 'Camille', dateNaissance: '1998-04-12' },
      events: {
        create: [
          { label: 'Demande soumise', status: 'SUBMITTED', createdAt: addDays(now, -6) },
          { label: 'Dossier pris en charge par le service', status: 'IN_REVIEW', createdAt: addDays(now, -4) },
        ],
      },
    },
  });
  await prisma.dossier.create({
    data: {
      userId: user.id, procedureId: 'logement-social', reference: 'DOS-DEMO-0002', status: 'COMPLETED', isDemo: true,
      data: { type: 'Première demande', composition: '1 personne' },
      events: {
        create: [
          { label: 'Demande soumise', status: 'SUBMITTED', createdAt: addDays(now, -40) },
          { label: 'Numéro unique attribué', status: 'IN_REVIEW', createdAt: addDays(now, -35) },
          { label: 'Demande enregistrée', status: 'COMPLETED', createdAt: addDays(now, -30) },
        ],
      },
    },
  });
  void dossier1;

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: user.id, type: 'APPOINTMENT_CONFIRMED', title: 'Rendez-vous confirmé', body: `Votre rendez-vous État civil du ${rdv1.toLocaleDateString('fr-FR')} à 10:00 est confirmé.`, link: '/services/appointments', read: false, isDemo: true, createdAt: addDays(now, -1) },
      { userId: user.id, type: 'DOCUMENT_VERIFIED', title: 'Document vérifié', body: 'Votre carte nationale d’identité a été vérifiée par nos services.', link: '/account/documents', read: false, isDemo: true, createdAt: addDays(now, -2) },
      { userId: user.id, type: 'SUBSCRIPTION_EXPIRING', title: 'Abonnement bientôt expiré', body: `Votre abonnement Mensuel expire le ${subEnd.toLocaleDateString('fr-FR')}. Pensez à le renouveler.`, link: '/transport/subscriptions', read: false, isDemo: true, createdAt: addDays(now, -1) },
      { userId: user.id, type: 'DOSSIER_UPDATED', title: 'Dossier mis à jour', body: 'Votre demande d’acte de naissance est en cours d’instruction.', link: '/services/dossiers', read: true, isDemo: true, createdAt: addDays(now, -4) },
      { userId: user.id, type: 'TICKET_PURCHASED', title: 'Ticket acheté', body: 'Votre carnet de 10 tickets a été acheté avec succès.', link: '/transport/tickets', read: true, isDemo: true, createdAt: addDays(now, -5) },
      { userId: user.id, type: 'APPOINTMENT_REMINDER', title: 'Rendez-vous imminent', body: 'N’oubliez pas votre rendez-vous de demain.', link: '/services/appointments', read: true, isDemo: true, createdAt: addDays(now, -2) },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: user.id, action: 'ACCOUNT_CREATED', entity: 'User', entityId: user.id, metadata: { demo: true } },
      { userId: user.id, action: 'DOCUMENT_UPLOADED', entity: 'Document', metadata: { demo: true, type: 'CNI' } },
    ],
  });

  console.log(`Compte de démonstration prêt : ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`);
}

async function seedTestUser() {
  const existing = await prisma.user.findUnique({ where: { email: TEST_ACCOUNT.email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash(TEST_ACCOUNT.password, 12);
  const user = await prisma.user.create({
    data: {
      email: TEST_ACCOUNT.email,
      username: TEST_ACCOUNT.username,
      passwordHash,
      firstName: TEST_ACCOUNT.firstName,
      lastName: TEST_ACCOUNT.lastName,
      birthDate: new Date('1995-03-20T00:00:00'),
      role: 'CITIZEN',
      isDemo: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'SYSTEM',
      title: 'Bienvenue sur CiteConnect',
      body: 'Votre compte a été créé. Complétez votre profil pour profiter de tous les services.',
      link: '/account',
      read: false,
      isDemo: false,
    },
  });

  console.log(`Compte de test prêt : ${TEST_ACCOUNT.email} / ${TEST_ACCOUNT.password}`);
}

async function main() {
  console.log('Seed du catalogue…');
  await seedCatalog();
  console.log('Seed des données de démonstration…');
  await seedDemoUser();
  console.log('Seed du compte de test…');
  await seedTestUser();
  console.log('Terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });