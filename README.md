# Nexus AI - Complete Authentication & User Management System

A comprehensive, production-ready authentication and user management system built with **Next.js 14+**, **Supabase Auth**, and **TypeScript**. This system provides enterprise-grade security, multi-provider OAuth, two-factor authentication, and complete user profile management.

## Features

### Authentication & Security
- **Multi-Provider OAuth**: Google, GitHub, Microsoft (Azure), Discord, Slack, Apple, LinkedIn
- **Email/Password Authentication**: With advanced password security
- **Two-Factor Authentication (2FA)**: TOTP-based with QR code generation and backup codes
- **Password Security**:
  - Strength validation
  - Breach checking via HaveIBeenPwned API
  - Password hashing with bcrypt
- **Session Management**: Multiple device tracking and management
- **Security Audit Logs**: Complete activity logging for compliance
- **Device Fingerprinting**: Track and manage sessions across devices

### User Profile Management
- **Complete User Profiles**: Username, bio, avatar, cover image, social links
- **Role-Based System**: Developer, Designer, Product Manager, Student, etc.
- **Skills & Interests**: Custom tags for personalization
- **Professional Info**: Title, company, website, GitHub, LinkedIn, Twitter
- **Customizable Preferences**:
  - Theme (light/dark/system)
  - Code editor preferences
  - Notification settings
  - Privacy settings
  - AI model preferences

### User Onboarding
- **Multi-Step Onboarding Flow**:
  - Step 1: Basic info (username, display name)
  - Step 2: Role selection
  - Step 3: Skills and interests
- **Progress Tracking**: Visual progress indicator
- **Skip Options**: Flexible onboarding experience

### GDPR Compliance
- **Data Export**: Complete user data export in JSON format
- **Account Deletion**: Soft delete with data retention policies
- **Privacy Controls**: User-controlled data visibility
- **Consent Management**: Terms and privacy policy acceptance tracking

### Enterprise Features
- **Row Level Security (RLS)**: Database-level security policies
- **API Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete activity tracking
- **Session Management**: Multi-device login tracking
- **Email Verification**: Secure account verification
- **Password Reset**: Secure password recovery flow

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Security**: bcrypt, TOTP (otpauth), QR codes
- **Notifications**: Sonner toast notifications

## Project Structure

```
nexiums/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── signin/page.tsx           # Sign in page
│   │   │   ├── signup/page.tsx           # Sign up page
│   │   │   ├── verify-email/page.tsx     # Email verification
│   │   │   └── callback/route.ts         # OAuth callback handler
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # User dashboard
│   │   ├── onboarding/
│   │   │   └── page.tsx                  # Onboarding flow
│   │   ├── api/
│   │   │   ├── profile/
│   │   │   │   ├── route.ts              # Profile CRUD
│   │   │   │   └── preferences/route.ts  # Preferences management
│   │   │   ├── auth/
│   │   │   │   └── 2fa/
│   │   │   │       ├── setup/route.ts    # 2FA setup
│   │   │   │       ├── verify/route.ts   # 2FA verification
│   │   │   │       └── disable/route.ts  # 2FA disable
│   │   │   └── user/
│   │   │       ├── export/route.ts       # GDPR data export
│   │   │       └── delete/route.ts       # Account deletion
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Homepage
│   │   └── globals.css                   # Global styles
│   ├── components/
│   │   ├── auth/
│   │   │   ├── SignInForm.tsx            # Sign in form
│   │   │   ├── SignUpForm.tsx            # Sign up form
│   │   │   └── PasswordStrength.tsx      # Password strength indicator
│   │   └── ui/                           # Reusable UI components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       └── toast.tsx
│   ├── hooks/
│   │   ├── useAuth.ts                    # Authentication hook
│   │   └── useProfile.ts                 # Profile management hook
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   ├── server.ts                 # Server client
│   │   │   └── middleware.ts             # Middleware helper
│   │   ├── auth/
│   │   │   ├── password.ts               # Password utilities
│   │   │   └── 2fa.ts                    # 2FA utilities
│   │   └── utils.ts                      # General utilities
│   ├── types/
│   │   └── database.types.ts             # Database type definitions
│   └── middleware.ts                     # Next.js middleware
├── supabase/
│   ├── config.toml                       # Supabase configuration
│   └── migrations/
│       └── 20240110000000_initial_schema.sql  # Database schema
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── .env.example

```

## Database Schema

### Core Tables

1. **user_profiles**: Extended user information
   - Basic info (username, display name, bio, avatar)
   - Professional info (title, company, social links)
   - Role and skills
   - Preferences (theme, notifications, privacy)
   - Subscription details
   - Security settings (2FA status, backup codes)
   - Metadata (onboarding status, activity tracking)

2. **security_logs**: Security event tracking
   - Event type (login, logout, password change, etc.)
   - IP address and user agent
   - Device fingerprint
   - Location data
   - Risk score

3. **user_sessions**: Active session management
   - Session tokens
   - Device information
   - Location data
   - Activity tracking

4. **user_preferences**: Detailed user preferences
   - Editor settings
   - AI model preferences
   - UI preferences
   - Feature flags

5. **oauth_connections**: OAuth provider connections
   - Provider details
   - Access/refresh tokens
   - Scopes
   - Sync status

## Setup Instructions

### 1. Prerequisites

- Node.js 18.17+
- npm 9.0+
- Supabase account

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd nexiums

# Install dependencies
npm install
```

### 3. Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OAuth Providers (configure in Supabase Dashboard)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Database Setup

```bash
# Initialize Supabase locally (optional)
npx supabase init

# Run migrations
npx supabase db push

# Or apply the SQL migration directly in Supabase Dashboard:
# Copy contents of supabase/migrations/20240110000000_initial_schema.sql
# and run in SQL Editor
```

### 5. OAuth Provider Setup

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:54321/auth/v1/callback` (for local development)

#### GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Add callback URL: `https://your-project.supabase.co/auth/v1/callback`

#### Configure in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable desired providers
3. Add Client ID and Client Secret
4. Save changes

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA token
- `POST /api/auth/2fa/disable` - Disable 2FA

### Profile Management

- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update user profile
- `GET /api/profile/preferences` - Get user preferences
- `PATCH /api/profile/preferences` - Update preferences

### User Management

- `GET /api/user/export` - Export user data (GDPR)
- `POST /api/user/delete` - Delete user account

## React Hooks for Integration

### useAuth Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, session, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### useProfile Hook

```typescript
import { useProfile } from '@/hooks/useProfile';

function ProfileComponent() {
  const { profile, loading, error, updateProfile } = useProfile();

  const handleUpdate = async () => {
    await updateProfile({
      display_name: 'New Name',
      bio: 'Updated bio',
    });
  };

  return (
    <div>
      <h1>{profile?.display_name}</h1>
      <button onClick={handleUpdate}>Update Profile</button>
    </div>
  );
}
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use service role key only in server-side code
3. **RLS Policies**: All tables have Row Level Security enabled
4. **Password Security**:
   - Minimum 8 characters
   - Requires uppercase, lowercase, numbers, special characters
   - Checked against HaveIBeenPwned database
5. **2FA**: Strongly recommended for all users
6. **Session Management**: Regular session cleanup and monitoring

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [Read the docs](https://docs.nexus.ai)
- Email: support@nexus.ai

## Roadmap

- [ ] Magic link authentication
- [ ] WebAuthn/Passkey support
- [ ] SAML SSO for enterprise
- [ ] LDAP/Active Directory integration
- [ ] Mobile app authentication
- [ ] Advanced analytics dashboard
- [ ] Team management features
- [ ] API key management
- [ ] Webhook support

---

Built with by the Nexus AI Team
