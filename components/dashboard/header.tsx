import { User } from '@supabase/supabase-js';
import { UserNav } from '@/components/dashboard/user-nav';

interface DashboardHeaderProps {
  user: User | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.email}
        </p>
      </div>
      <UserNav user={user} />
    </header>
  );
}