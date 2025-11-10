import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export const metadata = {
  title: 'Verify Email - Nexus AI',
  description: 'Please verify your email address',
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Click the link in the email we sent you to verify your account and
            complete your registration. The link will expire in 24 hours.
          </p>
          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-medium">Didn&apos;t receive the email?</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Check your spam or junk folder</li>
              <li>Make sure the email address is correct</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
