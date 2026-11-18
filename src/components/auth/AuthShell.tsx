'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { APP_NAME, APP_SLOGAN } from '@/lib/constants';
import { Icon } from '@/components/icons';
import { useTheme } from '@/components/ui/ThemeProvider';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { theme, toggle } = useTheme();
  return (
    <main className="flex min-h-screen">
      {/* Panneau de marque (desktop) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-navy p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Icon name="home" className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
        </Link>
        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-tight">{APP_SLOGAN}</h2>
          <p className="mt-4 max-w-md text-white/70">
            Une seule application pour gérer votre compte, accéder aux démarches administratives et
            utiliser les transports de la ville.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: 'user', label: 'Mon compte' },
              { icon: 'scroll', label: 'Service public' },
              { icon: 'bus', label: 'Transport' },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-3 text-white/90">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Icon name={m.icon} className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/50">Prototype de démonstration — données fictives.</p>
      </div>

      {/* Formulaire */}
      <div className="flex w-full flex-col items-center justify-center px-5 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-navy text-white">
                <Icon name="home" className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-navy dark:text-white">{APP_NAME}</span>
            </Link>
            <button
              onClick={toggle}
              className="focus-ring ml-auto rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-100 dark:border-[#24304a] dark:text-slate-300 dark:hover:bg-[#172138]"
              aria-label="Changer de thème"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        </div>
      </div>
    </main>
  );
}