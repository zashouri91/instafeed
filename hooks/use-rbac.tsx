import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export type Permission = boolean | 'self' | 'team' | 'assigned' | 'direct_reports';

export interface Permissions {
  users?: {
    create?: Permission;
    read?: Permission;
    update?: Permission;
    delete?: Permission;
    reset_password?: Permission;
    manage_assignments?: Permission;
  };
  roles?: {
    create?: Permission;
    read?: Permission;
    update?: Permission;
    delete?: Permission;
    assign?: Permission;
  };
  locations?: {
    create?: Permission;
    read?: Permission;
    update?: Permission;
    delete?: Permission;
    assign_users?: Permission;
    manage_hierarchy?: Permission;
  };
  analytics?: {
    full_access?: Permission;
    create_dashboards?: Permission;
    export_data?: Permission;
    view_metrics?: Permission;
  };
  surveys?: {
    create?: Permission;
    read?: Permission;
    update?: Permission;
    delete?: Permission;
    view_responses?: Permission;
    manage_distribution?: Permission;
  };
}

export interface RBACContextType {
  permissions: Permissions;
  loading: boolean;
  error: Error | null;
  checkPermission: (
    resource: keyof Permissions,
    action: string,
    targetId?: string
  ) => Promise<boolean>;
}

export function useRBAC() {
  const [permissions, setPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('roles:role_id(permissions)')
        .eq('user_id', session.user.id)
        .single();

      if (rolesError) throw rolesError;

      const roles = userRoles?.roles;
      if (roles) {
        const permissions = roles.reduce((acc, role) => ({ ...acc, ...role.permissions }), {});
        setPermissions(permissions);
      } else {
        setPermissions({});
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = async (
    resource: keyof Permissions,
    action: string,
    targetId?: string
  ): Promise<boolean> => {
    if (!permissions[resource]) return false;

    const permission = permissions[resource]?.[action as keyof typeof permissions[typeof resource]];

    if (typeof permission === 'boolean') {
      return permission;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    switch (permission) {
      case 'self':
        return targetId === session.user.id;

      case 'team':
        if (!targetId) return false;
        const { data: reports } = await supabase
          .from('reporting_relationships')
          .select('report_id')
          .eq('manager_id', session.user.id)
          .eq('report_id', targetId);
        return !!reports?.length;

      case 'assigned':
        if (!targetId) return false;
        const { data: assignments } = await supabase
          .from('location_assignments')
          .select('location_id')
          .eq('user_id', session.user.id)
          .eq('location_id', targetId);
        return !!assignments?.length;

      case 'direct_reports':
        if (!targetId) return false;
        const { data: directReports } = await supabase
          .from('reporting_relationships')
          .select('report_id')
          .eq('manager_id', session.user.id)
          .eq('report_id', targetId);
        return !!directReports?.length;

      default:
        return false;
    }
  };

  return {
    permissions,
    loading,
    error,
    checkPermission,
  };
}

// HOC to protect routes based on permissions
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  resource: keyof Permissions,
  action: string
): React.FC<P> {
  return function PermissionWrapper(props: P) {
    const { permissions, loading, error } = useRBAC();

    if (loading || error) {
      return null;
    }

    const hasPermission = permissions[resource]?.[action as keyof typeof permissions[typeof resource]];

    if (!hasPermission) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
