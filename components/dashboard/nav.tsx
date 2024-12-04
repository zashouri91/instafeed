"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  FileText,
  Users,
  Settings,
  UserPlus,
  UsersRound,
  MapPin,
  ClipboardList,
  UserCircle,
} from 'lucide-react';
import { useRoleAccess } from '@/hooks/use-role-access';
import { Skeleton } from '@/components/ui/skeleton';

export function NavSkeleton() {
  return (
    <div className="w-full space-y-4 p-4">
      <div className="h-6 w-24 bg-gray-200 rounded mb-6" />
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: BarChart,
    requiredPermissions: { dashboard: { view: true } }
  },
  { 
    name: 'Users', 
    href: '/dashboard/users', 
    icon: Users,
    requiredPermissions: { users: { read: true } }
  },
  { 
    name: 'Roles', 
    href: '/dashboard/roles', 
    icon: UserCircle,
    requiredPermissions: { roles: { read: true } }
  },
  { 
    name: 'Groups', 
    href: '/dashboard/groups', 
    icon: UsersRound,
    requiredPermissions: { groups: { read: true } }
  },
  { 
    name: 'Locations', 
    href: '/dashboard/locations', 
    icon: MapPin,
    requiredPermissions: { locations: { read: true } }
  },
  { 
    name: 'Surveys', 
    href: '/dashboard/surveys', 
    icon: ClipboardList,
    requiredPermissions: { surveys: { read: true } }
  },
  { 
    name: 'Create Survey', 
    href: '/dashboard/surveys/create', 
    icon: FileText,
    requiredPermissions: { surveys: { create: true } }
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    requiredPermissions: { settings: { manage: true } }
  }
];

export function DashboardNav() {
  const pathname = usePathname();
  const { checkPermissions, isLoading } = useRoleAccess();

  if (isLoading) {
    return <NavSkeleton />;
  }

  const filteredNavigation = navigation.filter(item => 
    checkPermissions(item.requiredPermissions)
  );

  return (
    <nav className="space-y-2 p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Survey Manager</h2>
      </div>
      {filteredNavigation.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}