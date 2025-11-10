import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyTwoFactorToken } from '@/lib/auth/2fa';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().length(6),
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
    const { token } = verifySchema.parse(body);

    // Get user's 2FA secret
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('two_factor_secret, two_factor_enabled')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!profile.two_factor_secret) {
      return NextResponse.json(
        { error: '2FA not set up' },
        { status: 400 }
      );
    }

    // Verify the token
    const isValid = verifyTwoFactorToken(token, profile.two_factor_secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Enable 2FA if this is first-time verification
    if (!profile.two_factor_enabled) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ two_factor_enabled: true })
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '2FA verified successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
