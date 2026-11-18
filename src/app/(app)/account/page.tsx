import Link from 'next/link';
import { FileText, ShieldCheck } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProfileCard } from '@/components/account/ProfileCard';
import { AddressCard } from '@/components/account/AddressCard';
import { EmailCard } from '@/components/account/EmailCard';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Mon compte' };

export default async function AccountPage() {
  const user = await requireUser();
  const changeRequests = await prisma.changeRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  const requests = changeRequests.map((r) => ({
    id: r.id,
    field: r.field,
    oldValue: r.oldValue,
    newValue: r.newValue,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Mon compte"
        description="Vos informations personnelles, votre adresse et vos coordonnées."
        action={
          <>
            <Link href="/account/documents"><Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5" /> Documents</Button></Link>
            <Link href="/account/security"><Button variant="outline" size="sm"><ShieldCheck className="h-3.5 w-3.5" /> Sécurité</Button></Link>
          </>
        }
      />
      <div className="space-y-6">
        <ProfileCard
          user={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            birthDate: user.birthDate.toISOString(),
            phone: user.phone,
            avatarPath: user.avatarPath,
            isDemo: user.isDemo,
          }}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <AddressCard address={user.address} />
          <EmailCard email={user.email} requests={requests} />
        </div>
      </div>
    </div>
  );
}