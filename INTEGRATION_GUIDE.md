# Integration Guide for Other Agents

This guide explains how other AI agents can integrate with the Nexus AI authentication and user management system.

## Overview

The authentication system is built with **Supabase Auth** and provides:
- User authentication (multi-provider OAuth + email/password)
- User profile management
- Session management
- Security features (2FA, audit logs)
- GDPR compliance

## Quick Start for Other Agents

### 1. Get Current User

**Server Component (Recommended)**

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function MyServerComponent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // User is not authenticated
    redirect('/auth/signin');
  }

  // Use user.id, user.email, etc.
  return <div>Welcome {user.email}</div>;
}
```

**Client Component**

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyClientComponent() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return (
    <div>
      <p>Welcome {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### 2. Get User Profile

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function MyComponent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get full profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div>
      <h1>{profile.display_name || profile.username}</h1>
      <p>{profile.bio}</p>
      <p>Role: {profile.user_role}</p>
    </div>
  );
}
```

**Using Hook (Client Component)**

```typescript
'use client';

import { useProfile } from '@/hooks/useProfile';

export default function MyComponent() {
  const { profile, loading, updateProfile } = useProfile();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{profile?.display_name}</h1>
      <button onClick={() => updateProfile({ bio: 'New bio' })}>
        Update Bio
      </button>
    </div>
  );
}
```

### 3. Protect Routes

**Middleware (Already Configured)**

The `src/middleware.ts` automatically protects routes:
- `/dashboard/*` requires authentication
- Redirects to `/auth/signin` if not authenticated
- Redirects authenticated users away from auth pages

**Server Action Protection**

```typescript
import { createClient } from '@/lib/supabase/server';

export async function myServerAction() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Your protected logic here
}
```

### 4. Check User Permissions

```typescript
import { createClient } from '@/lib/supabase/server';

export async function checkPermission(requiredTier: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  return profile?.subscription_tier === requiredTier;
}

// Usage
export default async function PremiumFeature() {
  const hasAccess = await checkPermission('pro');

  if (!hasAccess) {
    return <div>Upgrade to Pro to access this feature</div>;
  }

  return <div>Premium content</div>;
}
```

### 5. Log User Activity

```typescript
import { createClient } from '@/lib/supabase/server';

export async function logActivity(
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: any
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('user_activity_log')
    .insert({
      user_id: user.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    });
}

// Usage
await logActivity('created_project', 'project', projectId, {
  name: 'My Project',
  type: 'web',
});
```

### 6. Check API Quota

```typescript
import { createClient } from '@/lib/supabase/server';

export async function checkQuota() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { allowed: false, remaining: 0 };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('monthly_requests, api_quota_limit')
    .eq('id', user.id)
    .single();

  const remaining = profile.api_quota_limit - profile.monthly_requests;
  const allowed = remaining > 0;

  return { allowed, remaining, used: profile.monthly_requests };
}

// Usage
export async function myAPIEndpoint() {
  const { allowed, remaining } = await checkQuota();

  if (!allowed) {
    return { error: 'Quota exceeded', remaining: 0 };
  }

  // Process request and increment counter
  await incrementQuota();

  return { success: true, remaining: remaining - 1 };
}

async function incrementQuota() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.rpc('increment_monthly_requests', {
    user_id: user.id,
  });
}
```

### 7. Send Notifications

```typescript
import { createClient } from '@/lib/supabase/server';

export async function sendNotification(
  userId: string,
  type: 'email' | 'push' | 'slack' | 'discord',
  subject: string,
  content: string,
  metadata?: any
) {
  const supabase = await createClient();

  // Check if user has this notification type enabled
  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`${type}_notifications`)
    .eq('id', userId)
    .single();

  const notificationKey = `${type}_notifications`;
  if (!profile[notificationKey]) {
    return; // User has disabled this notification type
  }

  // Queue notification
  await supabase
    .from('notification_queue')
    .insert({
      user_id: userId,
      type,
      subject,
      content,
      metadata,
      status: 'pending',
    });
}

// Usage
await sendNotification(
  user.id,
  'email',
  'New message',
  'You have a new message from John',
  { messageId: '123' }
);
```

### 8. Get User Preferences

```typescript
import { createClient } from '@/lib/supabase/server';

export async function getUserPreferences() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return preferences;
}

// Usage
const prefs = await getUserPreferences();
const theme = prefs?.theme || 'system';
const defaultModel = prefs?.default_model || 'gpt-4';
```

## API Routes Available

### Authentication
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA token
- `POST /api/auth/2fa/disable` - Disable 2FA

### Profile
- `GET /api/profile` - Get current user's profile
- `PATCH /api/profile` - Update profile
- `GET /api/profile/preferences` - Get preferences
- `PATCH /api/profile/preferences` - Update preferences

### User Management
- `GET /api/user/export` - Export user data (GDPR)
- `POST /api/user/delete` - Delete account

## Database Tables

### user_profiles
Main user profile table with all user information.

**Key Fields:**
- `id` (UUID) - User ID (references auth.users)
- `username` (string) - Unique username
- `display_name` (string) - Display name
- `bio` (text) - User bio
- `avatar_url` (string) - Avatar URL
- `user_role` (enum) - User role
- `subscription_tier` (enum) - Subscription tier
- `two_factor_enabled` (boolean) - 2FA status
- `onboarding_completed` (boolean) - Onboarding status

### security_logs
Track all security-related events.

**Fields:**
- `user_id` (UUID)
- `event_type` (string) - Event type
- `event_status` (string) - Status
- `ip_address` (inet) - IP address
- `user_agent` (text) - User agent
- `metadata` (jsonb) - Additional data

### user_sessions
Track active user sessions.

**Fields:**
- `user_id` (UUID)
- `device_name` (string)
- `device_type` (string)
- `is_active` (boolean)
- `last_activity_at` (timestamp)

## Security Considerations

1. **Always use server-side validation**: Never trust client-side data
2. **Check permissions**: Verify user has access to resources
3. **Log sensitive actions**: Use security_logs table
4. **Respect user preferences**: Check notification settings
5. **Rate limiting**: Implement rate limiting for API endpoints
6. **Input validation**: Always validate and sanitize user input

## Row Level Security (RLS)

All tables have RLS policies enabled. Users can only:
- View their own data
- Update their own profile
- View public profiles (if profile_visibility = 'public')

**Example Query (automatically filtered by RLS):**

```typescript
// This only returns the current user's profile
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .single();
```

## Hooks Available

### useAuth()
Returns: `{ user, session, loading, signOut }`

### useProfile()
Returns: `{ profile, loading, error, updateProfile }`

## Common Patterns

### 1. Protected Server Component

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/signin');

  // Component code
}
```

### 2. Protected API Route

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // API logic
}
```

### 3. User-Specific Data Query

```typescript
const { data } = await supabase
  .from('your_table')
  .select('*')
  .eq('user_id', user.id); // Filter by current user
```

## Testing Authentication

### Manual Testing

1. Sign up: `http://localhost:3000/auth/signup`
2. Sign in: `http://localhost:3000/auth/signin`
3. Dashboard: `http://localhost:3000/dashboard`
4. Onboarding: `http://localhost:3000/onboarding`

### Test OAuth Locally

1. Use Supabase CLI: `npx supabase start`
2. Configure OAuth providers in Supabase Dashboard
3. Use local URLs for testing

## Troubleshooting

### "Unauthorized" Errors

- Check if user is authenticated: `await supabase.auth.getUser()`
- Verify session is valid
- Check middleware configuration

### RLS Policy Issues

- Ensure RLS policies are enabled
- Verify user has permission to access data
- Check table ownership

### OAuth Not Working

- Verify OAuth credentials in Supabase Dashboard
- Check redirect URLs are configured correctly
- Ensure provider is enabled in Supabase

## Support

For integration questions:
1. Check this guide first
2. Review the main README.md
3. Inspect the code examples in `/src/app`
4. Create an issue on GitHub

---

**Pro Tip:** Always test authentication flows in incognito/private browsing mode to ensure session handling works correctly.
