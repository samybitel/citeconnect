import { Clock } from 'lucide-react';
import { TRANSPORT_MODES } from '@/lib/constants';
import { Icon } from '@/components/icons';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const metadata = { title: 'Moyens de transport' };

export default function TransportModesPage() {
  return (
    <div>
      <PageHeader
        title="Moyens de transport"
        description="Le réseau municipal accessible avec vos tickets et abonnements CiteConnect."
        back={{ href: '/transport', label: 'Transport' }}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {TRANSPORT_MODES.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: m.color }}>
                  <Icon name={m.icon} className="h-5 w-5" />
                </span>
                {m.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">{m.description}</p>
              <div className="space-y-2">
                {m.lines.map((line) => (
                  <div key={line.name} className="rounded-xl border border-slate-200/70 p-3 dark:border-[#24304a]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{line.name}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-muted"><Clock className="h-3 w-3" /> {line.frequency}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{line.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">
        Informations de démonstration. Les horaires et lignes réels seront connectés ultérieurement via les services de transport de la ville.
      </p>
    </div>
  );
}