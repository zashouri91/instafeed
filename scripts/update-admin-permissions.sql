-- Update admin role with full permissions
UPDATE roles
SET permissions = jsonb_build_object(
    'dashboard', jsonb_build_object(
        'view', true
    ),
    'users', jsonb_build_object(
        'create', true,
        'read', true,
        'update', true,
        'delete', true,
        'manage_roles', true
    ),
    'roles', jsonb_build_object(
        'create', true,
        'read', true,
        'update', true,
        'delete', true
    ),
    'groups', jsonb_build_object(
        'create', true,
        'read', true,
        'update', true,
        'delete', true,
        'manage_members', true
    ),
    'locations', jsonb_build_object(
        'create', true,
        'read', true,
        'update', true,
        'delete', true
    ),
    'surveys', jsonb_build_object(
        'create', true,
        'read', true,
        'update', true,
        'delete', true,
        'manage_responses', true
    ),
    'posts', jsonb_build_object(
        'create', true,
        'read', true,
        'update', true,
        'delete', true,
        'moderate', true
    ),
    'comments', jsonb_build_object(
        'create', true,
        'read', true,
        'update', true,
        'delete', true,
        'moderate', true
    ),
    'analytics', jsonb_build_object(
        'view', true,
        'export', true
    ),
    'settings', jsonb_build_object(
        'manage', true
    )
)
WHERE name = 'admin'
RETURNING name, permissions;

-- Make sure the current user has the admin role
INSERT INTO user_roles (user_id, role_id)
SELECT 
    auth.uid(),
    r.id
FROM roles r
WHERE r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;
