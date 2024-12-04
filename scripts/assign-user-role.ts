import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignUserRole(email: string, roleName: string) {
  try {
    // Find the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);

    if (userError) {
      console.error('❌ Error finding user:', userError);
      return;
    }

    if (!userData.user) {
      console.error('❌ No user found with email:', email);
      return;
    }

    // Find the role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError) {
      console.error('❌ Error finding role:', roleError);
      return;
    }

    // Check if user already has this role
    const { data: existingRoleData, error: existingRoleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('role_id', roleData.id);

    if (existingRoleError) {
      console.error('❌ Error checking existing roles:', existingRoleError);
      return;
    }

    if (existingRoleData.length > 0) {
      console.log(`ℹ️ User already has ${roleName} role`);
      return;
    }

    // Assign the role
    const { error: assignRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role_id: roleData.id
      });

    if (assignRoleError) {
      console.error('❌ Error assigning role:', assignRoleError);
      return;
    }

    console.log(`✅ Successfully assigned ${roleName} role to ${email}`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email and role from command line arguments
const email = process.argv[2];
const roleName = process.argv[3] || 'member';

if (!email) {
  console.error('Usage: npx tsx scripts/assign-user-role.ts <email> [role]');
  process.exit(1);
}

assignUserRole(email, roleName);
