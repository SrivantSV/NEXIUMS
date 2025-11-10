import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const deleteSchema = z.object({
  password: z.string().min(1),
  confirmation: z.literal('DELETE'),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password, confirmation } = deleteSchema.parse(body);

    // Verify password before deletion
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Log deletion event
    await supabase.rpc('log_security_event', {
      p_user_id: user.id,
      p_event_type: 'account_deletion',
      p_event_status: 'success',
      p_ip_address: null,
      p_user_agent: request.headers.get('user-agent'),
      p_metadata: { reason: 'user_requested' },
    });

    // Soft delete: Mark account as inactive instead of hard delete
    // This allows for data retention policies and potential account recovery
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        is_active: false,
        username: null, // Free up username
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // For complete deletion (hard delete), use:
    // await supabase.auth.admin.deleteUser(user.id);

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
