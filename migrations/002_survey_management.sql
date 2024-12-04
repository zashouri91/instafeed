-- Create new tables for survey management
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update the initialize_roles function to include new permissions
CREATE OR REPLACE FUNCTION initialize_roles()
RETURNS void AS $$
BEGIN
    -- Admin Role (full system access)
    INSERT INTO roles (name, description, permissions)
    VALUES (
        'admin',
        'Full system access with all management capabilities',
        jsonb_build_object(
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
            'settings', jsonb_build_object(
                'manage', true
            )
        )
    ) ON CONFLICT (name) DO UPDATE 
    SET permissions = EXCLUDED.permissions;

    -- Manager Role (limited management capabilities)
    INSERT INTO roles (name, description, permissions)
    VALUES (
        'manager',
        'Limited management capabilities',
        jsonb_build_object(
            'dashboard', jsonb_build_object(
                'view', true
            ),
            'users', jsonb_build_object(
                'create', false,
                'read', true,
                'update', false,
                'delete', false,
                'manage_roles', false
            ),
            'roles', jsonb_build_object(
                'create', false,
                'read', true,
                'update', false,
                'delete', false
            ),
            'groups', jsonb_build_object(
                'create', true,
                'read', true,
                'update', true,
                'delete', false,
                'manage_members', true
            ),
            'locations', jsonb_build_object(
                'create', true,
                'read', true,
                'update', true,
                'delete', false
            ),
            'surveys', jsonb_build_object(
                'create', true,
                'read', true,
                'update', true,
                'delete', false,
                'manage_responses', true
            ),
            'settings', jsonb_build_object(
                'manage', false
            )
        )
    ) ON CONFLICT (name) DO UPDATE 
    SET permissions = EXCLUDED.permissions;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON groups
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users" ON locations
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users" ON surveys
    FOR SELECT
    TO authenticated
    USING (true);

-- Run the updated roles initialization
SELECT initialize_roles();
