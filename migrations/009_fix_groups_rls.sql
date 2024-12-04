-- Drop existing policies
DROP POLICY IF EXISTS "groups_select_policy" ON groups;
DROP POLICY IF EXISTS "groups_insert_policy" ON groups;
DROP POLICY IF EXISTS "groups_update_policy" ON groups;
DROP POLICY IF EXISTS "groups_delete_policy" ON groups;

-- Create simpler RLS policies for groups
CREATE POLICY "Enable read access for all authenticated users" ON groups
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON groups
    FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Enable update for organization owners" ON groups
    FOR UPDATE
    TO authenticated
    USING (organization_id = auth.uid())
    WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Enable delete for organization owners" ON groups
    FOR DELETE
    TO authenticated
    USING (organization_id = auth.uid());

-- Drop existing policies for group_members
DROP POLICY IF EXISTS "group_members_select_policy" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_policy" ON group_members;
DROP POLICY IF EXISTS "group_members_update_policy" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_policy" ON group_members;

-- Create simpler RLS policies for group_members
CREATE POLICY "Enable read access for all authenticated users" ON group_members
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for group owners" ON group_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_id
            AND g.organization_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for group owners" ON group_members
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_id
            AND g.organization_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_id
            AND g.organization_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for group owners" ON group_members
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_id
            AND g.organization_id = auth.uid()
        )
    );

-- Drop existing policies for surveys
DROP POLICY IF EXISTS "surveys_select_policy" ON surveys;
DROP POLICY IF EXISTS "surveys_insert_policy" ON surveys;
DROP POLICY IF EXISTS "surveys_update_policy" ON surveys;
DROP POLICY IF EXISTS "surveys_delete_policy" ON surveys;

-- Create simpler RLS policies for surveys
CREATE POLICY "Enable read access for all authenticated users" ON surveys
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON surveys
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id = auth.uid() AND
        created_by = auth.uid()
    );

CREATE POLICY "Enable update for survey owners" ON surveys
    FOR UPDATE
    TO authenticated
    USING (organization_id = auth.uid())
    WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Enable delete for survey owners" ON surveys
    FOR DELETE
    TO authenticated
    USING (organization_id = auth.uid());
