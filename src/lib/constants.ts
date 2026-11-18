import type { ServiceCategory, TransportMode } from '@prisma/client';

export const APP_NAME = 'CiteConnect';
export const APP_SLOGAN = 'Les services de la ville à portée de main.';

export const DEMO_ACCOUNT = {
  email: 'demo@citeconnect.fr',
  username: 'camille.martin',
  password: 'Demo1234!',
  firstName: 'Camille',
  lastName: 'Martin',
};

export const TEST_ACCOUNT = {
  email: 'test@citeconnect.fr',
  username: 'jean.dupont',
  password: 'Test1234!',
  firstName: 'Jean',
  lastName: 'Dupont',
};

export interface CategoryMeta {
  id: ServiceCategory;
  slug: string;
  label: string;
  short: string;
  description: string;
  icon: string;
  accent: string;
}

export const SERVICE_CATEGORIES: CategoryMeta[] = [
  {
    id: 'ETAT_CIVIL',
    slug: 'etat-civil',
    label: 'État civil',
    short: 'Naissance, mariage, actes…',
    description:
      'Actes de naissance, de mariage, de décès et demandes de documents administratifs.',
    icon: 'scroll',
    accent: 'brand',
  },
  {
    id: 'URBANISME',
    slug: 'urbanisme',
    label: 'Urbanisme',
    short: 'Permis de construire, déclarations…',
    description:
      'Permis de construire, déclarations préalables de travaux et suivi des dossiers.',
    icon: 'building',
    accent: 'brand',
  },
  {
    id: 'LOGEMENT',
    slug: 'logement',
    label: 'Logement',
    short: 'Logement social, accompagnement…',
    description:
      'Demande de logement social, suivi des demandes et dispositifs d’accompagnement.',
    icon: 'home',
    accent: 'brand',
  },
  {
    id: 'SCOLAIRE',
    slug: 'scolaire',
    label: 'Affaires scolaires',
    short: 'Inscription, cantine, services…',
    description:
      'Inscriptions scolaires, cantine, services périscolaires et informations établissements.',
    icon: 'graduation',
    accent: 'brand',
  },
];

export function categoryBySlug(slug: string) {
  return SERVICE_CATEGORIES.find((c) => c.slug === slug);
}

export function categoryById(id: ServiceCategory) {
  return SERVICE_CATEGORIES.find((c) => c.id === id);
}

export interface TransportModeMeta {
  id: TransportMode;
  label: string;
  icon: string;
  color: string;
  description: string;
  lines: { name: string; label: string; frequency: string }[];
}

export const TRANSPORT_MODES: TransportModeMeta[] = [
  {
    id: 'BUS',
    label: 'Bus',
    icon: 'bus',
    color: '#2553e8',
    description: 'Le réseau de bus dessert l’ensemble des quartiers de la ville.',
    lines: [
      { name: 'Ligne 12', label: 'Gare centrale ↔ Campus universitaire', frequency: 'toutes les 8 min' },
      { name: 'Ligne 4', label: 'Hôtel de ville ↔ Zone commerciale', frequency: 'toutes les 12 min' },
      { name: 'Ligne 21', label: 'Quartier des Lilas ↔ Centre hospitalier', frequency: 'toutes les 15 min' },
    ],
  },
  {
    id: 'TRAIN',
    label: 'Train',
    icon: 'train',
    color: '#1e37ac',
    description: 'Trains régionaux et liaisons rapides vers les communes voisines.',
    lines: [
      { name: 'Ligne R1', label: 'Gare centrale ↔ Ville voisine Nord', frequency: 'toutes les 30 min' },
      { name: 'Ligne R2', label: 'Gare centrale ↔ Aéroport', frequency: 'toutes les 20 min' },
    ],
  },
  {
    id: 'TRAM',
    label: 'Tramway',
    icon: 'tram',
    color: '#0b2545',
    description: 'Deux lignes de tramway traversent la ville du nord au sud.',
    lines: [
      { name: 'T1', label: 'Quartier Nord ↔ Gare centrale ↔ Sud', frequency: 'toutes les 6 min' },
      { name: 'T2', label: 'Parc des Expositions ↔ Université', frequency: 'toutes les 10 min' },
    ],
  },
];

export function modeMeta(mode: TransportMode) {
  return TRANSPORT_MODES.find((m) => m.id === mode)!;
}

export const APPOINTMENT_LOCATIONS: Record<ServiceCategory, string> = {
  ETAT_CIVIL: 'Mairie centrale — Guichet État civil',
  URBANISME: 'Mairie centrale — Service Urbanisme',
  LOGEMENT: 'Maison des services — Pôle Logement',
  SCOLAIRE: 'Mairie annexe — Affaires scolaires',
  ACCOUNT: 'Mairie centrale — Accueil',
};

export const SERVICE_LABELS: Record<ServiceCategory, string> = {
  ETAT_CIVIL: 'État civil',
  URBANISME: 'Urbanisme',
  LOGEMENT: 'Logement',
  SCOLAIRE: 'Affaires scolaires',
  ACCOUNT: 'Accueil général',
};

export const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  CNI: 'Carte nationale d’identité',
  PASSPORT: 'Passeport',
  OTHER: 'Autre document',
};