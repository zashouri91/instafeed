import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { email, roleName } = await request.json();

    if (!email || !roleName) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Verify the inviter has a valid session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if inviter is an admin
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('raw_app_meta_data->is_admin')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error checking admin status:', userError);
      return NextResponse.json({ error: 'Error checking permissions' }, { status: 500 });
    }

    const isAdmin = userData?.raw_app_meta_data?.is_admin === true;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Get the role ID for the specified role name
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    // Create the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-12), // Random temporary password
      options: {
        data: {
          role_id: role.id,
          invited_by: session.user.id
        }
      }
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 500 });
    }

    if (!signUpData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Add user role
    const { error: userRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: signUpData.user.id,
        role_id: role.id
      });

    if (userRoleError) {
      console.error('Error adding user role:', userRoleError);
      // Don't return error as user was created successfully
    }

    return NextResponse.json({ 
      message: 'User invited successfully',
      user: signUpData.user 
    });

  } catch (error: any) {
    console.error('Error in invite API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
