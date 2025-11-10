import { SignInForm } from '@/components/auth/SignInForm';

export const metadata = {
  title: 'Sign In - Nexus AI',
  description: 'Sign in to your Nexus AI account',
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignInForm />
    </div>
  );
}
