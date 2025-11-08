'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { loginAction } from '@/actions/auth.actions';
import type { User } from '@/lib/db-types';

interface LoginFormProps {
  users: User[];
}

export function LoginForm({ users }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.success) {
        router.push('/portal/tester');
      } else {
        alert(result.error || 'Login failed');
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">SenseLab</h1>
        <p className="text-muted-foreground">Select your account to continue</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userId">User</Label>
          <Select name="userId" required disabled={isPending}>
            <SelectTrigger id="userId">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.ContactGUID} value={user.ContactGUID}>
                  {user.ContactFullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
}
