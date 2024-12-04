import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardOverview } from '@/components/dashboard/overview';
import { DashboardSkeleton } from '@/components/dashboard/skeleton';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log('Dashboard Page - Server-side Authentication Check:', {
    user: user ? 'User exists' : 'No user',
    error: userError ? userError.message : 'No error'
  });

  // Explicit redirect if no user is found
  if (!user || userError) {
    console.log('Dashboard Page - No authenticated user, redirecting to login');
    redirect('/login');
  }

  // Optional: Fetch user roles for additional logging
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select(`
      role_id,
      roles:role_id (
        name,
        permissions
      )
    `)
    .eq('user_id', user.id);

  console.log('Dashboard Page - User Roles:', {
    roles: userRoles ? userRoles.length : 'No roles found',
    error: rolesError ? rolesError.message : 'No error'
  });

  return (
    <div className="space-y-6">
      <DashboardHeader user={user} />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardOverview />
      </Suspense>
    </div>
  );
}