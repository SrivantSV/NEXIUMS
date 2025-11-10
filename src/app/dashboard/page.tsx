import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Redirect to onboarding if not completed
  if (profile && !profile.onboarding_completed) {
    redirect('/onboarding');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.display_name || profile?.username || 'there'}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your account
          </p>
        </div>
        <Link href="/dashboard/settings">
          <Button variant="outline">Settings</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Username:</span> {profile?.username || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-medium">Role:</span>{' '}
                {profile?.user_role?.replace('_', ' ') || 'Not set'}
              </div>
            </div>
            <Link href="/dashboard/profile">
              <Button variant="outline" className="w-full mt-4">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">2FA:</span>{' '}
                {profile?.two_factor_enabled ? (
                  <span className="text-green-600">Enabled</span>
                ) : (
                  <span className="text-orange-600">Disabled</span>
                )}
              </div>
              <div>
                <span className="font-medium">Email Verified:</span>{' '}
                {user.email_confirmed_at ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-orange-600">No</span>
                )}
              </div>
            </div>
            <Link href="/dashboard/security">
              <Button variant="outline" className="w-full mt-4">
                Security Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Plan:</span>{' '}
                <span className="capitalize">{profile?.subscription_tier}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span className="capitalize">{profile?.subscription_status}</span>
              </div>
              <div>
                <span className="font-medium">Monthly Requests:</span>{' '}
                {profile?.monthly_requests} / {profile?.api_quota_limit}
              </div>
            </div>
            <Link href="/dashboard/billing">
              <Button variant="outline" className="w-full mt-4">
                Manage Billing
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access important features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/dashboard/profile">
              <Button variant="outline" className="w-full">
                Profile
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full">
                Settings
              </Button>
            </Link>
            <Link href="/dashboard/security">
              <Button variant="outline" className="w-full">
                Security
              </Button>
            </Link>
            <Link href="/api/user/export">
              <Button variant="outline" className="w-full">
                Export Data
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
