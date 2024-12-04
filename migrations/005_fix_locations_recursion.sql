-- First, drop existing policies
DROP POLICY IF EXISTS "Enable read access for users in same organization" ON locations;
DROP POLICY IF EXISTS "Enable insert for users with create permission" ON locations;
DROP POLICY IF EXISTS "Enable update for users with update permission" ON locations;
DROP POLICY IF EXISTS "Enable delete for users with delete permission" ON locations;

-- Fix the locations table structure
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES auth.users(id);

-- Update any existing records
UPDATE locations 
SET organization_id = (
    SELECT ur.user_id 
    FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE r.name = 'admin' 
    LIMIT 1
)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after updating existing records
ALTER TABLE locations 
ALTER COLUMN organization_id SET NOT NULL;

-- Create new policies without recursion
CREATE POLICY "Enable read access for authenticated users" ON locations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for users with create permission" ON locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'locations'->>'create')::boolean = true
        )
        AND
        organization_id = auth.uid()
    );

CREATE POLICY "Enable update for users with update permission" ON locations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'locations'->>'update')::boolean = true
        )
        AND
        organization_id = auth.uid()
    );

CREATE POLICY "Enable delete for users with delete permission" ON locations
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND (r.permissions->'locations'->>'delete')::boolean = true
        )
        AND
        organization_id = auth.uid()
    );
