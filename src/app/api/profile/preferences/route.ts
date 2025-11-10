import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  code_theme: z
    .enum(['vs-dark', 'github', 'monokai', 'solarized', 'dracula', 'nord'])
    .optional(),
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  slack_notifications: z.boolean().optional(),
  discord_notifications: z.boolean().optional(),
  weekly_digest: z.boolean().optional(),
  security_alerts: z.boolean().optional(),
  billing_alerts: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  profile_visibility: z.enum(['public', 'private', 'team']).optional(),
  activity_visibility: z.enum(['public', 'private', 'team']).optional(),
  allow_indexing: z.boolean().optional(),
  allow_analytics: z.boolean().optional(),
  allow_mentions: z.boolean().optional(),
  show_email: z.boolean().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Extract preferences
    const preferences = {
      theme: profile.theme,
      code_theme: profile.code_theme,
      email_notifications: profile.email_notifications,
      push_notifications: profile.push_notifications,
      slack_notifications: profile.slack_notifications,
      discord_notifications: profile.discord_notifications,
      weekly_digest: profile.weekly_digest,
      security_alerts: profile.security_alerts,
      billing_alerts: profile.billing_alerts,
      marketing_emails: profile.marketing_emails,
      profile_visibility: profile.profile_visibility,
      activity_visibility: profile.activity_visibility,
      allow_indexing: profile.allow_indexing,
      allow_analytics: profile.allow_analytics,
      allow_mentions: profile.allow_mentions,
      show_email: profile.show_email,
    };

    return NextResponse.json({ preferences });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePreferencesSchema.parse(body);

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(validatedData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
