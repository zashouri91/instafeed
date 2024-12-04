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

async function setupSupabaseDatabase() {
  try {
    console.log('🚀 Starting Supabase Database Setup');

    // 1. Create Roles Table
    console.log('\n🔑 Setting up Roles Table');
    const { error: rolesTableError } = await supabase.rpc('create_table', {
      table_name: 'roles',
      table_definition: `
        CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          permissions JSONB NOT NULL
        )
      `
    });

    if (rolesTableError) {
      console.error('❌ Error creating roles table:', rolesTableError);
      return;
    }

    // 2. Create User Roles Junction Table
    console.log('\n🔗 Setting up User Roles Junction Table');
    const { error: userRolesTableError } = await supabase.rpc('create_table', {
      table_name: 'user_roles',
      table_definition: `
        CREATE TABLE IF NOT EXISTS user_roles (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id),
          role_id INTEGER REFERENCES roles(id),
          UNIQUE(user_id, role_id)
        )
      `
    });

    if (userRolesTableError) {
      console.error('❌ Error creating user_roles table:', userRolesTableError);
      return;
    }

    // 3. Insert Default Roles
    console.log('\n📋 Inserting Default Roles');
    const { data: existingRoles, error: fetchRolesError } = await supabase
      .from('roles')
      .select('name');

    if (fetchRolesError) {
      console.error('❌ Error fetching existing roles:', fetchRolesError);
      return;
    }

    const rolesToInsert = [
      {
        name: 'admin',
        permissions: {
          posts: { read: true, create: true, delete: true, update: true, moderate: true },
          roles: { read: true, create: true, delete: true, update: true },
          users: { read: true, create: true, delete: true, update: true, manage_roles: true },
          groups: { read: true, create: true, delete: true, update: true, manage_members: true },
          surveys: { read: true, create: true, delete: true, update: true, manage_responses: true },
          comments: { read: true, create: true, delete: true, update: true, moderate: true },
          settings: { manage: true },
          analytics: { view: true, export: true },
          dashboard: { view: true },
          locations: { read: true, create: true, delete: true, update: true }
        }
      },
      {
        name: 'member',
        permissions: {
          posts: { read: true, create: true },
          users: { read: false, create: false, delete: false, update: false }
        }
      }
    ];

    // Only insert roles that don't already exist
    const newRoles = rolesToInsert.filter(
      role => !existingRoles.some(existingRole => existingRole.name === role.name)
    );

    if (newRoles.length > 0) {
      const { error: insertRolesError } = await supabase
        .from('roles')
        .insert(newRoles);

      if (insertRolesError) {
        console.error('❌ Error inserting roles:', insertRolesError);
        return;
      }
      console.log('✅ Roles inserted successfully');
    } else {
      console.log('ℹ️ Roles already exist, skipping insertion');
    }

    // 4. Set up Row Level Security (RLS) for tables
    console.log('\n🔒 Configuring Row Level Security');
    
    // Disable RLS for initial setup (you should configure more granular policies later)
    const { error: rlsError } = await supabase.rpc('setup_rls', {
      tables: ['roles', 'user_roles']
    });

    if (rlsError) {
      console.error('❌ Error setting up RLS:', rlsError);
      return;
    }

    console.log('✅ Supabase database setup completed successfully!');
  } catch (error) {
    console.error('❌ Unexpected error during setup:', error);
  }
}

setupSupabaseDatabase();
