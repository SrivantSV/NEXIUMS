import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get security logs (last 100)
    const { data: securityLogs } = await supabase
      .from('security_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get user sessions
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id);

    // Get OAuth connections (without tokens)
    const { data: oauthConnections } = await supabase
      .from('oauth_connections')
      .select('provider, provider_email, connected_at, is_active')
      .eq('user_id', user.id);

    // Compile all data
    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile: {
        ...profile,
        // Remove sensitive fields
        two_factor_secret: undefined,
        backup_codes: undefined,
      },
      preferences,
      security_logs: securityLogs,
      sessions: sessions?.map((s) => ({
        ...s,
        // Remove sensitive fields
        session_token: undefined,
        refresh_token: undefined,
      })),
      oauth_connections: oauthConnections,
    };

    // Return as JSON file download
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nexus-ai-data-export-${user.id}.json"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
