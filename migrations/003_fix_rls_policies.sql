-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON locations;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON groups;

-- Locations table policies
CREATE POLICY "Enable read access for authenticated users" ON locations
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users with create permission" ON locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'locations'->>'create')::boolean = true
        )
    );

CREATE POLICY "Enable update for authenticated users with update permission" ON locations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'locations'->>'update')::boolean = true
        )
    );

CREATE POLICY "Enable delete for authenticated users with delete permission" ON locations
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'locations'->>'delete')::boolean = true
        )
    );

-- Groups table policies
CREATE POLICY "Enable read access for authenticated users" ON groups
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users with create permission" ON groups
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'groups'->>'create')::boolean = true
        )
    );

CREATE POLICY "Enable update for authenticated users with update permission" ON groups
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'groups'->>'update')::boolean = true
        )
    );

CREATE POLICY "Enable delete for authenticated users with delete permission" ON groups
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'groups'->>'delete')::boolean = true
        )
    );

-- Group members table policies
CREATE POLICY "Enable read access for authenticated users" ON group_members
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for users with manage_members permission" ON group_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'groups'->>'manage_members')::boolean = true
        )
    );

CREATE POLICY "Enable delete for users with manage_members permission" ON group_members
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'groups'->>'manage_members')::boolean = true
        )
    );

-- Fix user_roles policies
DROP POLICY IF EXISTS "Enable read access for users" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for admin" ON user_roles;

CREATE POLICY "Enable read access for authenticated users" ON user_roles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for users with manage_roles permission" ON user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'users'->>'manage_roles')::boolean = true
        )
    );

-- Ensure the admin user has proper permissions
DO $$
DECLARE
    admin_role_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get the admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    -- Get the first admin user (you may want to modify this based on your needs)
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
    
    -- Ensure the admin user has the admin role
    INSERT INTO user_roles (user_id, role_id)
    VALUES (admin_user_id, admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
END;
$$;
