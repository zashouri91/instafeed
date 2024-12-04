import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Get email from command line arguments
const email = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || 'member'; // Default to 'member' if no role specified

if (!email || !password) {
  console.error('Usage: npx tsx scripts/invite-user.ts <email> <password> [role]');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inviteUser() {
  try {
    // Sign in as admin first
    const { data: adminAuthData, error: adminAuthError } = await supabase.auth.signInWithPassword({
      email: 'ashoza01@me.com', // Replace with your admin email
      password: 'Password1234'   // Replace with your admin password
    });

    if (adminAuthError) {
      console.error('Admin sign-in error:', adminAuthError);
      return;
    }

    // Invite user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role
        }
      }
    });

    if (error) {
      console.error('User invitation error:', error);
      return;
    }

    console.log('User invited successfully:', data.user);

    // Fetch available roles to debug
    const { data: availableRoles, error: rolesError } = await supabase
      .from('roles')
      .select('*');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return;
    }

    console.log('Available roles:', availableRoles);

    // Find the role ID
    const { data: roleData, error: roleFindError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    if (roleFindError) {
      console.error('Error finding role:', roleFindError);
      return;
    }

    console.log('Found role:', roleData);

    // Add user role to user_roles table
    const { error: userRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: data.user?.id,
        role_id: roleData.id
      });

    if (userRoleError) {
      console.error('Error assigning user role:', userRoleError);
      return;
    }

    console.log(`User assigned ${role} role successfully`);
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    // Sign out after we're done
    await supabase.auth.signOut();
  }
}

inviteUser();
