import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Nexus AI
        </h1>
        <p className="text-xl text-muted-foreground">
          Premium AI Aggregator Platform with Complete Authentication & User Management
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Access the world&apos;s leading AI models in one unified platform. Built with enterprise-grade security, multi-provider OAuth, two-factor authentication, and comprehensive user management.
        </p>
        <div className="flex gap-4 justify-center pt-6">
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Sign In
            </Button>
          </Link>
        </div>
        <div className="pt-12 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground mb-4">Features:</h3>
          <ul className="grid grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
            <li>✓ Multi-Provider OAuth (Google, GitHub, Microsoft, Discord)</li>
            <li>✓ Two-Factor Authentication (TOTP)</li>
            <li>✓ Advanced Password Security</li>
            <li>✓ User Profile Management</li>
            <li>✓ Security Audit Logs</li>
            <li>✓ Session Management</li>
            <li>✓ GDPR Compliance</li>
            <li>✓ Enterprise-Ready</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
