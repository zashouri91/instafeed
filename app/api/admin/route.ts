import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    console.log('Starting admin setup process...');

    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 401 });
    }
    if (!session) {
      console.error('No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('User authenticated:', userId);

    // Debug: List all roles
    const { data: allRoles, error: rolesError } = await supabase
      .from('roles')
      .select('*');
    
    console.log('All roles:', allRoles, 'Roles error:', rolesError);

    // Debug: List all user roles
    const { data: allUserRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    console.log('All user roles:', allUserRoles, 'User roles error:', userRolesError);

    // Get admin role
    const { data: adminRole, error: adminRoleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (adminRoleError) {
      console.error('Error fetching admin role:', adminRoleError);
      return NextResponse.json({ 
        error: 'Failed to fetch admin role', 
        details: adminRoleError.message,
        hint: 'This might be a permissions issue or the roles table might not be set up correctly'
      }, { status: 500 });
    }

    if (!adminRole) {
      console.log('Admin role not found, running initialization...');
      const { error: initError } = await supabase.rpc('initialize_roles');
      if (initError) {
        console.error('Error initializing roles:', initError);
        return NextResponse.json({ 
          error: 'Failed to initialize roles', 
          details: initError.message 
        }, { status: 500 });
      }

      // Try fetching admin role again
      const { data: newAdminRole, error: newAdminError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'admin')
        .single();

      if (newAdminError || !newAdminRole) {
        console.error('Error fetching new admin role:', newAdminError);
        return NextResponse.json({ 
          error: 'Failed to fetch new admin role', 
          details: newAdminError?.message || 'Role not found after initialization'
        }, { status: 500 });
      }

      console.log('Successfully created admin role:', newAdminRole);
      
      // Insert user role
      const { error: assignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: newAdminRole.id
        });

      if (assignError) {
        console.error('Error assigning new admin role:', assignError);
        return NextResponse.json({ 
          error: 'Failed to assign admin role', 
          details: assignError.message 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Successfully created and assigned admin role',
        roleId: newAdminRole.id
      });
    }

    // Check if user already has admin role
    const { data: existingRole, error: existingRoleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role_id', adminRole.id)
      .single();

    if (existingRoleError && existingRoleError.code !== 'PGRST116') { // Ignore "no rows returned" error
      console.error('Error checking existing role:', existingRoleError);
      return NextResponse.json({ 
        error: 'Failed to check existing role', 
        details: existingRoleError.message 
      }, { status: 500 });
    }

    if (existingRole) {
      return NextResponse.json({ 
        message: 'User is already an admin',
        roleId: adminRole.id
      });
    }

    // Assign admin role
    const { error: assignError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: adminRole.id
      });

    if (assignError) {
      console.error('Error assigning admin role:', assignError);
      return NextResponse.json({ 
        error: 'Failed to assign admin role', 
        details: assignError.message,
        context: {
          userId,
          roleId: adminRole.id
        }
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Successfully assigned admin role',
      roleId: adminRole.id
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
