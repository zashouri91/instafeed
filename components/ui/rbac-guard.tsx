import { useRBAC, type Permission } from '@/hooks/use-rbac';
import React from 'react';

interface RBACGuardProps {
  resource: string;
  action: string;
  targetId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RBACGuard({
  resource,
  action,
  targetId,
  fallback = null,
  children,
}: RBACGuardProps) {
  const { checkPermission } = useRBAC();
  const [hasPermission, setHasPermission] = React.useState(false);

  React.useEffect(() => {
    const checkAccess = async () => {
      const permitted = await checkPermission(
        resource as any,
        action,
        targetId
      );
      setHasPermission(permitted);
    };

    checkAccess();
  }, [resource, action, targetId, checkPermission]);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Usage example:
/*
<RBACGuard
  resource="users"
  action="create"
  fallback={<div>You don't have permission to create users</div>}
>
  <Button onClick={handleCreateUser}>Create User</Button>
</RBACGuard>
*/
