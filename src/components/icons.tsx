import {
  ScrollText,
  Building2,
  Home,
  GraduationCap,
  Bus,
  TrainFront,
  TramFront,
  User,
  LayoutDashboard,
  Bell,
  Ticket,
  CreditCard,
  Nfc,
  CalendarDays,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  scroll: ScrollText,
  building: Building2,
  home: Home,
  graduation: GraduationCap,
  bus: Bus,
  train: TrainFront,
  tram: TramFront,
  user: User,
  dashboard: LayoutDashboard,
  bell: Bell,
  ticket: Ticket,
  card: CreditCard,
  nfc: Nfc,
  calendar: CalendarDays,
  file: FileText,
  shield: ShieldCheck,
  settings: Settings,
  logout: LogOut,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = map[name] ?? FileText;
  return <Cmp className={className} aria-hidden />;
}