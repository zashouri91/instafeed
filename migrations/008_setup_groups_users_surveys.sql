-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON groups;
DROP POLICY IF EXISTS "Users can view their organization groups" ON groups;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON auth.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON surveys;

-- Drop and recreate groups table
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Drop and recreate surveys table
DROP TABLE IF EXISTS surveys CASCADE;

CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'draft',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "groups_select_policy" ON groups
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
        )
    );

CREATE POLICY "groups_insert_policy" ON groups
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{groups,create}' = 'true'
        )
    );

CREATE POLICY "groups_update_policy" ON groups
    FOR UPDATE
    TO authenticated
    USING (
        organization_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{groups,update}' = 'true'
        )
    );

CREATE POLICY "groups_delete_policy" ON groups
    FOR DELETE
    TO authenticated
    USING (
        organization_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{groups,delete}' = 'true'
        )
    );

-- Group members policies
CREATE POLICY "group_members_select_policy" ON group_members
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id
            AND g.organization_id = auth.uid()
        )
    );

CREATE POLICY "group_members_insert_policy" ON group_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id
            AND g.organization_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{groups,manage_members}' = 'true'
        )
    );

CREATE POLICY "group_members_update_policy" ON group_members
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id
            AND g.organization_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{groups,manage_members}' = 'true'
        )
    );

CREATE POLICY "group_members_delete_policy" ON group_members
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id
            AND g.organization_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{groups,manage_members}' = 'true'
        )
    );

-- Surveys policies
CREATE POLICY "surveys_select_policy" ON surveys
    FOR SELECT
    TO authenticated
    USING (
        organization_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = surveys.group_id
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "surveys_insert_policy" ON surveys
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{surveys,create}' = 'true'
        )
    );

CREATE POLICY "surveys_update_policy" ON surveys
    FOR UPDATE
    TO authenticated
    USING (
        organization_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{surveys,update}' = 'true'
        )
    );

CREATE POLICY "surveys_delete_policy" ON surveys
    FOR DELETE
    TO authenticated
    USING (
        organization_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.permissions::jsonb #>> '{surveys,delete}' = 'true'
        )
    );

-- Create triggers for updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Groups trigger
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Group members trigger
DROP TRIGGER IF EXISTS update_group_members_updated_at ON group_members;
CREATE TRIGGER update_group_members_updated_at
    BEFORE UPDATE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Surveys trigger
DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at
    BEFORE UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
