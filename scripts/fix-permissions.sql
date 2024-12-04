-- Drop and recreate tables to ensure clean state
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for roles table
CREATE POLICY "Enable read access for all authenticated users on roles"
    ON roles FOR SELECT
    TO authenticated
    USING (true);

-- Create policies for user_roles table
CREATE POLICY "Enable read access for all authenticated users on user_roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable write access for admins on user_roles"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_app_meta_data->>'is_admin')::boolean = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_app_meta_data->>'is_admin')::boolean = true
        )
    );

-- Insert default roles
INSERT INTO roles (name, permissions) 
VALUES 
    ('admin', '{
        "users": {
            "create": true,
            "read": true,
            "update": true,
            "delete": true,
            "manage_roles": true
        }
    }'::jsonb),
    ('user', '{
        "users": {
            "create": false,
            "read": true,
            "update": false,
            "delete": false,
            "manage_roles": false
        }
    }'::jsonb)
ON CONFLICT (name) DO UPDATE 
SET permissions = EXCLUDED.permissions;

-- Function to ensure user has role
CREATE OR REPLACE FUNCTION ensure_user_has_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = NEW.id
    ) THEN
        INSERT INTO user_roles (user_id, role_id)
        SELECT NEW.id, id FROM roles WHERE name = 'user'
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS ensure_user_role_trigger ON auth.users;
CREATE TRIGGER ensure_user_role_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION ensure_user_has_role();

-- Make your user an admin (replace with your email)
DO $$
DECLARE
    user_id uuid;
    admin_role_id uuid;
BEGIN
    -- Get your user ID
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'zach@windsurf.io';

    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Set admin flag in metadata
    UPDATE auth.users 
    SET raw_app_meta_data = 
        CASE 
            WHEN raw_app_meta_data IS NULL THEN '{"is_admin": true}'::jsonb
            ELSE raw_app_meta_data || '{"is_admin": true}'::jsonb
        END
    WHERE id = user_id;

    -- Get admin role ID
    SELECT id INTO admin_role_id
    FROM roles
    WHERE name = 'admin';

    -- Assign admin role
    INSERT INTO user_roles (user_id, role_id)
    VALUES (user_id, admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
END;
$$;
