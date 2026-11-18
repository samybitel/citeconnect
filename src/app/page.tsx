import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { APP_NAME, APP_SLOGAN } from '@/lib/constants';
import { Icon } from '@/components/icons';

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white dark:from-[#0b1428] dark:via-[#090e1a] dark:to-[#090e1a]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Brand />
        <div className="flex items-center gap-2">
          <Link href="/login" className="focus-ring rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#172138]">
            Se connecter
          </Link>
          <Link href="/register" className="focus-ring rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
            Créer un compte
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-200">
            <Sparkles className="h-3.5 w-3.5" /> Plateforme municipale unifiée
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-navy dark:text-white sm:text-5xl">
            Les services de la ville,
            <span className="block text-brand-600 dark:text-brand-400">à portée de main.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
            {APP_NAME} réunit votre compte personnel, vos démarches administratives et vos transports
            dans une seule application simple, rapide et sécurisée.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="focus-ring inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 font-medium text-white shadow-sm hover:bg-brand-700">
              Commencer <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="focus-ring inline-flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 font-medium text-slate-700 hover:bg-slate-50 dark:border-[#2c3a58] dark:bg-transparent dark:text-slate-200 dark:hover:bg-[#172138]">
              J’ai déjà un compte
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">
            Démonstration : <span className="font-medium">demo@citeconnect.fr</span> · <span className="font-medium">Demo1234!</span>
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          <ModuleCard index="01" title="Mon compte" icon="user" desc="Profil, adresse et documents officiels regroupés dans un espace personnel sécurisé." />
          <ModuleCard index="02" title="Service public" icon="scroll" desc="État civil, urbanisme, logement, affaires scolaires et prise de rendez-vous." />
          <ModuleCard index="03" title="Transport" icon="bus" desc="Abonnements, tickets et validation sans contact sur tout le réseau." />
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Sécurisé" desc="Données chiffrées, documents privés et sessions protégées." />
          <Feature icon={<Smartphone className="h-5 w-5" />} title="Mobile d’abord" desc="Une interface pensée pour le smartphone, responsive partout." />
          <Feature icon={<Sparkles className="h-5 w-5" />} title="Simple" desc="Chaque action est identifiable, en un minimum de clics." />
        </div>
      </section>

      <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-muted dark:border-[#1c2740]">
        {APP_NAME} — {APP_SLOGAN} · Prototype de démonstration (données fictives).
      </footer>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-navy text-white shadow-sm">
        <Icon name="home" className="h-5 w-5" />
      </div>
      <span className="text-lg font-bold tracking-tight text-navy dark:text-white">{APP_NAME}</span>
    </div>
  );
}

function ModuleCard({ index, title, icon, desc }: { index: string; title: string; icon: string; desc: string }) {
  return (
    <div className="card group p-6 transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold text-slate-300 dark:text-slate-600">{index}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-navy dark:text-white">{title}</h3>
      <p className="mt-1.5 text-sm text-muted">{desc}</p>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/60 p-4 dark:bg-[#11192a]/60">
      <div className="mt-0.5 text-brand-600 dark:text-brand-400">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{desc}</p>
      </div>
    </div>
  );
}