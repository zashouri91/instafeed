-- Create function to handle user signup and assignments
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    metadata jsonb;
    role_id uuid;
    group_ids uuid[];
    location_id uuid;
    invited_by uuid;
BEGIN
    -- Extract metadata from the raw_user_meta_data
    metadata := NEW.raw_user_meta_data;
    
    -- Get values from metadata
    role_id := (metadata->>'role_id')::uuid;
    group_ids := ARRAY(SELECT jsonb_array_elements_text(metadata->'group_ids')::uuid);
    location_id := (metadata->>'location_id')::uuid;
    invited_by := (metadata->>'invited_by')::uuid;

    -- Insert user role
    IF role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id)
        VALUES (NEW.id, role_id);
    END IF;

    -- Insert user into groups
    IF array_length(group_ids, 1) > 0 THEN
        INSERT INTO group_members (group_id, user_id)
        SELECT unnest(group_ids), NEW.id;
    END IF;

    -- Assign user to location
    IF location_id IS NOT NULL THEN
        INSERT INTO user_locations (user_id, location_id)
        VALUES (NEW.id, location_id);
    END IF;

    -- Set organization context from inviter
    IF invited_by IS NOT NULL THEN
        INSERT INTO user_organizations (user_id, organization_id)
        SELECT NEW.id, organization_id
        FROM user_organizations
        WHERE user_id = invited_by
        LIMIT 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_signup();
