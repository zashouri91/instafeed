-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS setup_database() CASCADE;
DROP FUNCTION IF EXISTS initialize_roles() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create base tables
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to initialize roles
CREATE OR REPLACE FUNCTION initialize_roles()
RETURNS void AS $$
BEGIN
    -- Admin Role (full system access)
    INSERT INTO roles (name, description, permissions)
    VALUES (
        'admin',
        'Full system access with all management capabilities',
        jsonb_build_object(
            'users', jsonb_build_object(
                'create', true,
                'read', true,
                'update', true,
                'delete', true,
                'manage_roles', true
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
            )
        )
    ) ON CONFLICT (name) DO UPDATE 
    SET permissions = EXCLUDED.permissions;

    -- Manager Role (content and user management)
    INSERT INTO roles (name, description, permissions)
    VALUES (
        'manager',
        'Content and user management capabilities',
        jsonb_build_object(
            'users', jsonb_build_object(
                'create', false,
                'read', true,
                'update', false,
                'delete', false,
                'manage_roles', false
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
                'export', false
            )
        )
    ) ON CONFLICT (name) DO UPDATE 
    SET permissions = EXCLUDED.permissions;

    -- Regular User Role (basic access)
    INSERT INTO roles (name, description, permissions)
    VALUES (
        'user',
        'Standard user with basic access',
        jsonb_build_object(
            'users', jsonb_build_object(
                'create', false,
                'read', true,
                'update', false,
                'delete', false,
                'manage_roles', false
            ),
            'posts', jsonb_build_object(
                'create', true,
                'read', true,
                'update', true,
                'delete', true,
                'moderate', false
            ),
            'comments', jsonb_build_object(
                'create', true,
                'read', true,
                'update', true,
                'delete', true,
                'moderate', false
            ),
            'analytics', jsonb_build_object(
                'view', false,
                'export', false
            )
        )
    ) ON CONFLICT (name) DO UPDATE 
    SET permissions = EXCLUDED.permissions;
END;
$$ LANGUAGE plpgsql;

-- Create function to setup database
CREATE OR REPLACE FUNCTION setup_database()
RETURNS void AS $$
BEGIN
    -- Initialize roles
    PERFORM initialize_roles();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON roles;
DROP POLICY IF EXISTS "Enable read access for own roles" ON user_roles;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Roles are viewable by all authenticated users" ON roles;
DROP POLICY IF EXISTS "Users can view roles" ON roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
DROP POLICY IF EXISTS "User roles are viewable by all authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Users can view their roles" ON user_roles;
DROP POLICY IF EXISTS "User roles can be inserted by authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

-- Create function to check user role
CREATE OR REPLACE FUNCTION auth.has_role(role_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION auth.has_permission(permission jsonb)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.permissions @> permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies with role-based access
DO $$ 
BEGIN
    -- Roles table policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for authenticated users' AND tablename = 'roles') THEN
        CREATE POLICY "Enable read access for authenticated users"
        ON roles FOR SELECT
        TO authenticated
        USING (true);
    END IF;

    -- User roles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for own roles' AND tablename = 'user_roles') THEN
        CREATE POLICY "Enable read access for own roles"
        ON user_roles FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert access for authenticated users' AND tablename = 'user_roles') THEN
        CREATE POLICY "Enable insert access for authenticated users"
        ON user_roles FOR INSERT
        TO authenticated
        WITH CHECK (
            auth.uid() = user_id OR
            auth.has_role('admin')
        );
    END IF;

    -- Add policies for content tables
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable content management for authorized users' AND tablename = 'posts') THEN
        CREATE POLICY "Enable content management for authorized users"
        ON posts FOR ALL
        TO authenticated
        USING (
            auth.has_permission('{"posts": {"read": true}}'::jsonb) OR
            auth.uid() = user_id
        )
        WITH CHECK (
            auth.has_permission('{"posts": {"create": true}}'::jsonb) OR
            auth.uid() = user_id
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable comment management for authorized users' AND tablename = 'comments') THEN
        CREATE POLICY "Enable comment management for authorized users"
        ON comments FOR ALL
        TO authenticated
        USING (
            auth.has_permission('{"comments": {"read": true}}'::jsonb) OR
            auth.uid() = user_id
        )
        WITH CHECK (
            auth.has_permission('{"comments": {"create": true}}'::jsonb) OR
            auth.uid() = user_id
        );
    END IF;
END
$$;

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user was invited with a specific role
    IF NEW.raw_user_meta_data->>'role_id' IS NOT NULL THEN
        -- Assign the specified role
        INSERT INTO user_roles (user_id, role_id)
        VALUES (NEW.id, (NEW.raw_user_meta_data->>'role_id')::uuid);
    ELSE
        -- Assign default user role
        INSERT INTO user_roles (user_id, role_id)
        VALUES (NEW.id, (SELECT id FROM roles WHERE name = 'user'));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Execute setup
SELECT setup_database();
