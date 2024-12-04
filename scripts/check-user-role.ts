import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

interface Role {
  name: string;
  permissions: string[];
}

interface UserRoleResponse {
  role_id: number;
  roles: Role;
}

// Load environment variables from .env
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npx tsx scripts/check-user-role.ts <email> <password>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRole() {
  try {
    // Sign in with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Error signing in:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('No user found after sign in');
      return;
    }

    console.log('Signed in successfully as:', authData.user.email);

    // Get user's roles and permissions
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles:role_id (
          name,
          permissions
        )
      `)
      .eq('user_id', authData.user.id);

    if (rolesError) {
      console.error('Error getting roles:', rolesError.message);
      return;
    }

    if (!userRoles || userRoles.length === 0) {
      console.log('No roles found for this user');
      return;
    }

    console.log('\nUser Roles and Permissions:');
    (userRoles as unknown as UserRoleResponse[]).forEach((roleData) => {
      console.log(`\nRole: ${roleData.roles.name}`);
      console.log('Permissions:', JSON.stringify(roleData.roles.permissions, null, 2));
    });
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    // Sign out after we're done
    await supabase.auth.signOut();
  }
}

checkUserRole();
