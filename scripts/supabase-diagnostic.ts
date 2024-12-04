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

console.log(`🔍 Diagnostic for Supabase Project: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
  try {
    // Test Authentication
    console.log('\n🔐 Testing Authentication:');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Authentication Error:', authError);
    } else {
      console.log('✅ Authentication connection successful');
      console.log('Current User:', user?.email || 'No active user');
    }

    // Test Database Connection
    console.log('\n💾 Testing Database Connection:');
    const { data: testData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (dbError) {
      console.error('❌ Database Query Error:', dbError);
    } else {
      console.log('✅ Database connection successful');
      console.log('Sample User Data:', testData);
    }

    // Test Roles Table
    console.log('\n🔑 Testing Roles Table:');
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('*');

    if (rolesError) {
      console.error('❌ Roles Query Error:', rolesError);
    } else {
      console.log('✅ Roles table accessible');
      console.log('Available Roles:', rolesData);
    }

    // Test User Roles Junction Table
    console.log('\n🔗 Testing User Roles Junction:');
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);

    if (userRolesError) {
      console.error('❌ User Roles Query Error:', userRolesError);
    } else {
      console.log('✅ User Roles table accessible');
      console.log('Sample User Role Data:', userRolesData);
    }

  } catch (error) {
    console.error('❌ Unexpected Error:', error);
  }
}

runDiagnostics();
