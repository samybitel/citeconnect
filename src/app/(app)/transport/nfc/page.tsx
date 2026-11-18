import { PageHeader } from '@/components/layout/PageHeader';
import { NfcSimulator } from '@/components/transport/NfcSimulator';

export const metadata = { title: 'NFC Express' };

export default function NfcPage() {
  return (
    <div>
      <PageHeader
        title="NFC Express"
        description="Utilisez votre téléphone comme titre de transport : validation sans contact simulée."
        back={{ href: '/transport', label: 'Transport' }}
      />
      <NfcSimulator />
    </div>
  );
}