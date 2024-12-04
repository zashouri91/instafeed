-- Function to ensure a user has at least one role
CREATE OR REPLACE FUNCTION ensure_user_has_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If the user doesn't have any roles yet, assign them the default 'user' role
    IF NOT EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = NEW.id
    ) THEN
        -- Get the 'user' role ID
        INSERT INTO user_roles (user_id, role_id)
        SELECT NEW.id, id FROM roles WHERE name = 'user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS ensure_user_role_trigger ON auth.users;

-- Create the trigger
CREATE TRIGGER ensure_user_role_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION ensure_user_has_role();

-- Function to make a user an admin
CREATE OR REPLACE FUNCTION make_user_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;

    -- Set the is_admin flag in user metadata
    PERFORM set_user_admin(target_user_id, true);
    
    -- Ensure they have the admin role
    INSERT INTO user_roles (user_id, role_id)
    SELECT target_user_id, id FROM roles WHERE name = 'admin'
    ON CONFLICT (user_id, role_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DO NOT run make_user_admin here. Instead, run it separately with your user ID:
-- SELECT make_user_admin('your-user-id-here');
