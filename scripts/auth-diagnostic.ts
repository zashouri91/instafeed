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

async function authDiagnostic(email: string, password: string) {
  try {
    console.log('🔍 Starting Authentication Diagnostic');

    // 1. Sign In Attempt
    console.log('\n🔐 Attempting Sign In:');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('❌ Sign In Error:', signInError);
      console.log('Error Details:', {
        message: signInError.message,
        status: signInError.status,
        code: signInError.code,
      });
      return;
    }

    if (!signInData.user) {
      console.error('❌ No user returned after sign in');
      return;
    }

    console.log('✅ Sign In Successful');
    console.log('User Details:', {
      id: signInData.user.id,
      email: signInData.user.email,
    });

    // 2. Check User Roles
    console.log('\n🔑 Checking User Roles:');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles:role_id (
          name,
          permissions
        )
      `)
      .eq('user_id', signInData.user.id);

    if (rolesError) {
      console.error('❌ Error fetching user roles:', rolesError);
      return;
    }

    if (!userRoles || userRoles.length === 0) {
      console.warn('⚠️ No roles found for this user');
    } else {
      console.log('✅ User Roles Found:');
      userRoles.forEach((roleData: any) => {
        console.log(`Role: ${roleData.roles.name}`);
        console.log('Permissions:', JSON.stringify(roleData.roles.permissions, null, 2));
      });
    }

    // 3. Session Verification
    console.log('\n🕰️ Verifying Session:');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
      return;
    }

    if (!session) {
      console.error('❌ No active session found');
      return;
    }

    console.log('✅ Active Session Verified');
    console.log('Session Details:', {
      expires_at: session.expires_at,
      user_id: session.user.id,
    });

  } catch (error) {
    console.error('❌ Unexpected Error:', error);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npx tsx scripts/auth-diagnostic.ts <email> <password>');
  process.exit(1);
}

authDiagnostic(email, password);
