import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type ResourcePermissions = {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
  manage_roles?: boolean;
  manage_members?: boolean;
  manage_responses?: boolean;
  moderate?: boolean;
  view?: boolean;
  export?: boolean;
  manage?: boolean;
};

export interface Permission {
  dashboard: {
    view?: boolean;
  };
  users: ResourcePermissions;
  roles: ResourcePermissions;
  groups: ResourcePermissions;
  locations: ResourcePermissions;
  surveys: ResourcePermissions;
  posts: ResourcePermissions;
  comments: ResourcePermissions;
  analytics: {
    view?: boolean;
    export?: boolean;
  };
  settings: {
    manage?: boolean;
  };
}

export function useRoleAccess() {
  const [permissions, setPermissions] = useState<Permission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUserPermissions() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setPermissions(null);
          setIsLoading(false);
          return;
        }

        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('roles:role_id(name, permissions)')
          .eq('user_id', session.user.id)
          .single();

        if (roleError) {
          console.error('Error fetching user role:', roleError);
          setPermissions(null);
          setIsLoading(false);
          return;
        }

        // Handle both single role and array of roles
        const roles = Array.isArray(roleData?.roles) 
          ? roleData.roles 
          : roleData?.roles 
            ? [roleData.roles]
            : [];

        if (roles.length > 0) {
          // Merge permissions from all roles
          const mergedPermissions = roles.reduce((acc, role) => {
            const rolePermissions = role.permissions || {};
            // Deep merge the permissions
            return {
              ...acc,
              ...rolePermissions,
              // Merge nested objects
              ...Object.keys(rolePermissions).reduce((nested, key) => ({
                ...nested,
                [key]: {
                  ...(acc[key] || {}),
                  ...(rolePermissions[key] || {})
                }
              }), {})
            };
          }, {} as Permission);
          
          setPermissions(mergedPermissions);
        } else {
          setPermissions(null);
        }
      } catch (error) {
        console.error('Error in fetchUserPermissions:', error);
        setPermissions(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserPermissions();
  }, [supabase]);

  const checkPermissions = (requiredPermissions: Partial<Permission>) => {
    if (!permissions) return false;
    
    return Object.entries(requiredPermissions).every(([resource, actions]) => {
      const resourceKey = resource as keyof Permission;
      const resourcePermissions = permissions[resourceKey];
      
      // If no permissions are specified for this resource, allow access
      if (!actions || Object.keys(actions).length === 0) return true;
      
      // If permissions are required but none exist, deny access
      if (!resourcePermissions) return false;
      
      return Object.entries(actions).every(([action, required]) => {
        const actionKey = action as keyof typeof actions;
        // Only check if the permission is required to be true
        return required === true ? resourcePermissions[actionKey] === true : true;
      });
    });
  };

  return {
    permissions,
    isLoading,
    checkPermissions,
  };
}
