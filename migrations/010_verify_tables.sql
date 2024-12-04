-- Drop all existing tables and start fresh
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Create groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    organization_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create surveys table
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    organization_id UUID NOT NULL,
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

-- Create policies for groups
CREATE POLICY "Enable read access for authenticated users" ON groups
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON groups
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for organization owners" ON groups
    FOR UPDATE
    TO authenticated
    USING (organization_id = auth.uid());

CREATE POLICY "Enable delete for organization owners" ON groups
    FOR DELETE
    TO authenticated
    USING (organization_id = auth.uid());

-- Create policies for group_members
CREATE POLICY "Enable read access for authenticated users" ON group_members
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON group_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups
            WHERE id = group_id
            AND organization_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for organization owners" ON group_members
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE id = group_id
            AND organization_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for organization owners" ON group_members
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE id = group_id
            AND organization_id = auth.uid()
        )
    );

-- Create policies for surveys
CREATE POLICY "Enable read access for authenticated users" ON surveys
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON surveys
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for organization owners" ON surveys
    FOR UPDATE
    TO authenticated
    USING (organization_id = auth.uid());

CREATE POLICY "Enable delete for organization owners" ON surveys
    FOR DELETE
    TO authenticated
    USING (organization_id = auth.uid());

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at
    BEFORE UPDATE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at
    BEFORE UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
