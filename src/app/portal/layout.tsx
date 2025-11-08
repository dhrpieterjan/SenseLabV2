import { redirect } from 'next/navigation';
import { PortalHeader } from '@/components/portal-header';
import { getCurrentUser } from '@/actions/auth.actions';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader user={user} />
      <main className="container py-6">{children}</main>
    </div>
  );
}
