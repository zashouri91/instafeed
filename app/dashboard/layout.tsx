import { Suspense } from 'react';
import { DashboardNav } from '@/components/dashboard/nav';
import { NavSkeleton } from '@/components/dashboard/nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <div className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Suspense fallback={<NavSkeleton />}>
          <DashboardNav />
        </Suspense>
      </div>
      <main className="flex-1 overflow-y-auto p-8">
        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        }>
          {children}
        </Suspense>
      </main>
    </div>
  );
}