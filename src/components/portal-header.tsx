'use client';

import { useTransition } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/actions/auth.actions';
import type { User } from '@/lib/db-types';

interface PortalHeaderProps {
  user: User;
}

export function PortalHeader({ user }: PortalHeaderProps) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="border-b bg-card">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">SenseLab</h1>

          <nav className="flex gap-1">
            <Link href="/portal/tester">
              <Button variant={isActive('/portal/tester') ? 'default' : 'ghost'} size="sm">
                Tester
              </Button>
            </Link>
            <Link href="/portal/coordinator">
              <Button variant={isActive('/portal/coordinator') ? 'default' : 'ghost'} size="sm">
                Coordinator
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.ContactFullName}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
            <LogOut className="h-4 w-4" />
            {isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
    </header>
  );
}
