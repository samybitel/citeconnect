'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, Moon, ShieldCheck, Sun, User as UserIcon } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/components/ui/ThemeProvider';
import { api } from '@/lib/client';

export interface ShellUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  avatarPath: string | null;
  isDemo: boolean;
}

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', short: 'Accueil', icon: 'dashboard' },
  { href: '/account', label: 'Mon compte', short: 'Compte', icon: 'user' },
  { href: '/services', label: 'Service public', short: 'Services', icon: 'scroll' },
  { href: '/transport', label: 'Transport', short: 'Transport', icon: 'bus' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export function AppShell({ user, unread, children }: { user: ShellUser; unread: number; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const avatarSrc = user.avatarPath ? '/api/account/avatar' : undefined;

  async function logout() {
    setLoggingOut(true);
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090e1a]">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-slate-200/80 bg-white dark:border-[#1c2740] dark:bg-[#0d1526] lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-navy text-white shadow-sm">
            <Icon name="home" className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-navy dark:text-white">{APP_NAME}</span>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#172138]',
                )}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}

          <div className="my-3 border-t border-slate-200/80 dark:border-[#1c2740]" />

          <Link
            href="/notifications"
            className={cn(
              'focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(pathname, '/notifications')
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#172138]',
            )}
          >
            <Bell className="h-[18px] w-[18px]" />
            Notifications
            {unread > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                {unread}
              </span>
            )}
          </Link>
        </nav>

        <div className="border-t border-slate-200/80 p-3 dark:border-[#1c2740]">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar src={avatarSrc} firstName={user.firstName} lastName={user.lastName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{user.firstName} {user.lastName}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button onClick={toggle} className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-[#24304a] dark:text-slate-300 dark:hover:bg-[#172138]">
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {theme === 'dark' ? 'Clair' : 'Sombre'}
            </button>
            <button onClick={logout} disabled={loggingOut} className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-[#24304a] dark:text-red-400 dark:hover:bg-red-950/40">
              <LogOut className="h-3.5 w-3.5" /> Quitter
            </button>
          </div>
        </div>
      </aside>

      {/* Zone principale */}
      <div className="lg:pl-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-[#1c2740] dark:bg-[#0d1526]/85">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 lg:px-8">
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-navy text-white">
                <Icon name="home" className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-navy dark:text-white">{APP_NAME}</span>
            </Link>

            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={toggle} className="focus-ring rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#172138] lg:hidden" aria-label="Changer de thème">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <Link href="/notifications" className="focus-ring relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#172138]" aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}>
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button onClick={() => setMenuOpen((o) => !o)} className="focus-ring flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100 dark:hover:bg-[#172138]" aria-label="Menu utilisateur" aria-expanded={menuOpen}>
                  <Avatar src={avatarSrc} firstName={user.firstName} lastName={user.lastName} size="sm" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-40 mt-2 w-60 animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop dark:border-[#24304a] dark:bg-[#11192a]">
                      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-[#24304a]">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.firstName} {user.lastName}</p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                        {user.isDemo && <span className="mt-1.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">Compte de démonstration</span>}
                      </div>
                      <div className="p-1.5">
                        <MenuLink href="/account" icon={<UserIcon className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>Mon profil</MenuLink>
                        <MenuLink href="/account/security" icon={<ShieldCheck className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>Sécurité du compte</MenuLink>
                        <button onClick={logout} disabled={loggingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
                          <LogOut className="h-4 w-4" /> Se déconnecter
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {user.isDemo && (
          <div className="border-b border-amber-200/60 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            Mode démonstration — les données affichées sont fictives.
          </div>
        )}

        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:px-8 lg:pb-12">{children}</main>
      </div>

      {/* Barre de navigation inférieure (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur dark:border-[#1c2740] dark:bg-[#0d1526]/95 lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={cn('flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors', active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500')}>
                <Icon name={item.icon} className={cn('h-[22px] w-[22px]', active && 'scale-110')} />
                {item.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function MenuLink({ href, icon, children, onClick }: { href: string; icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#172138]">
      {icon}
      {children}
    </Link>
  );
}