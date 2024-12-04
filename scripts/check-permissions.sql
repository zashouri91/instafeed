-- Get user roles and permissions
SELECT 
    au.email,
    r.name as role_name,
    r.permissions->'users'->>'create' as can_create_users,
    r.permissions->'users'->>'read' as can_read_users,
    r.permissions->'users'->>'update' as can_update_users,
    r.permissions->'users'->>'delete' as can_delete_users,
    r.permissions->'users'->>'manage_roles' as can_manage_roles
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE au.id = auth.uid();

-- Show all available roles and their permissions
SELECT 
    name as role_name,
    permissions->'users'->>'create' as can_create_users,
    permissions->'users'->>'read' as can_read_users,
    permissions->'users'->>'update' as can_update_users,
    permissions->'users'->>'delete' as can_delete_users,
    permissions->'users'->>'manage_roles' as can_manage_roles
FROM roles
ORDER BY name;
