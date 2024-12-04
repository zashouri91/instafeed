-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for users with create permission" ON user_roles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable users to manage their own roles" ON user_roles;
DROP POLICY IF EXISTS "Enable users with create permission to manage roles" ON user_roles;

-- Ensure user_roles table exists with correct structure
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for user_roles
CREATE POLICY "Enable read access for all authenticated users"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable self-management and admin access"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'is_admin' = 'true'
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'is_admin' = 'true'
        )
    );

-- Grant necessary permissions
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON roles TO authenticated;

-- Insert default roles if they don't exist
INSERT INTO roles (name, permissions) 
VALUES 
    ('admin', 
     '{
        "users": {
            "create": true,
            "read": true,
            "update": true,
            "delete": true,
            "manage_roles": true
        }
     }'::jsonb
    )
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, permissions)
VALUES 
    ('user',
     '{
        "users": {
            "create": false,
            "read": true,
            "update": false,
            "delete": false,
            "manage_roles": false
        }
     }'::jsonb
    )
ON CONFLICT (name) DO NOTHING;

-- Set up admin user function
CREATE OR REPLACE FUNCTION set_user_admin(user_id UUID, is_admin BOOLEAN)
RETURNS VOID AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = 
        CASE 
            WHEN is_admin THEN 
                COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
            ELSE 
                COALESCE(raw_app_meta_data, '{}'::jsonb) - 'is_admin'
        END
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
