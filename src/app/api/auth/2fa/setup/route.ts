import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateTwoFactorSecret, hashBackupCode } from '@/lib/auth/2fa';

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email
    const email = user.email;
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // Generate 2FA secret and backup codes
    const { secret, qrCodeUrl, backupCodes } = await generateTwoFactorSecret(
      email
    );

    // Hash backup codes before storing
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => hashBackupCode(code))
    );

    // Store secret in database (not yet enabled)
    const { error } = await supabase
      .from('user_profiles')
      .update({
        two_factor_secret: secret,
        backup_codes: hashedBackupCodes,
        two_factor_enabled: false, // Will be enabled after verification
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return QR code and backup codes to user (only shown once!)
    return NextResponse.json({
      qrCodeUrl,
      backupCodes, // Plain text codes (shown only once)
      secret,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
