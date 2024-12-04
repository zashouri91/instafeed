import React from 'react';
import { useRBAC, type Permissions } from '@/hooks/use-rbac';

interface PermissionWrapperProps {
  resource: keyof Permissions;
  action: string;
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  deniedFallback?: React.ReactNode;
}

export function PermissionWrapper({
  resource,
  action,
  children,
  loadingFallback = <div>Loading...</div>,
  errorFallback = <div>An error occurred</div>,
  deniedFallback = <div>Access Denied</div>,
}: PermissionWrapperProps) {
  const { permissions, loading, error } = useRBAC();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (error) {
    return <>{errorFallback}</>;
  }

  const hasPermission = permissions[resource]?.[action as keyof typeof permissions[typeof resource]];

  if (!hasPermission) {
    return <>{deniedFallback}</>;
  }

  return <>{children}</>;
}
