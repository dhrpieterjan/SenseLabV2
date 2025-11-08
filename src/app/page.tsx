import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { getActiveUsers } from '@/services/users.service';
import { getCurrentUserId } from '@/actions/auth.actions';

export default async function Home() {
  // If user is already logged in, redirect to portal
  const userId = await getCurrentUserId();
  if (userId) {
    redirect('/portal/tester');
  }

  // Fetch active users for login
  const usersResponse = await getActiveUsers();

  if (!usersResponse.success || !usersResponse.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">{usersResponse.error || 'Failed to load users'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoginForm users={usersResponse.data} />
    </div>
  );
}
