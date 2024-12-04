-- First, drop any existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON locations;
DROP POLICY IF EXISTS "Enable insert for users with create permission" ON locations;
DROP POLICY IF EXISTS "Enable update for users with update permission" ON locations;
DROP POLICY IF EXISTS "Enable delete for users with delete permission" ON locations;
DROP POLICY IF EXISTS "locations_select_policy" ON locations;
DROP POLICY IF EXISTS "locations_insert_policy" ON locations;
DROP POLICY IF EXISTS "locations_update_policy" ON locations;
DROP POLICY IF EXISTS "locations_delete_policy" ON locations;

-- Drop existing foreign key constraints and policies that depend on locations
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_location_id_fkey;
DROP POLICY IF EXISTS "Users can view their organization groups" ON groups;

-- Now we can safely drop and recreate the locations table
DROP TABLE IF EXISTS locations CASCADE;

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    street_address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    organization_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies that avoid recursion
CREATE POLICY "locations_select_policy" ON locations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
        )
    );

CREATE POLICY "locations_insert_policy" ON locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{locations,create}' = 'true'
        )
    );

CREATE POLICY "locations_update_policy" ON locations
    FOR UPDATE
    TO authenticated
    USING (
        organization_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{locations,update}' = 'true'
        )
    );

CREATE POLICY "locations_delete_policy" ON locations
    FOR DELETE
    TO authenticated
    USING (
        organization_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{locations,delete}' = 'true'
        )
    );

-- Create trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Recreate the foreign key constraint on groups
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Recreate the groups policy
CREATE POLICY "Users can view their organization groups" ON groups
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM locations l
            WHERE l.id = groups.location_id
            AND l.organization_id = auth.uid()
        )
    );
