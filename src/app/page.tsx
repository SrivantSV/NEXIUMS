import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Nexus AI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Team Collaboration Platform
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive workspace management with real-time collaboration,
              role-based permissions, and powerful team features.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Collaboration</CardTitle>
                <CardDescription>
                  WebSocket-based real-time editing with operational transformation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Live cursor tracking</li>
                  <li>• Conflict resolution</li>
                  <li>• Presence management</li>
                  <li>• Auto-save & sync</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Flexible role-based access control and member management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Custom roles & permissions</li>
                  <li>• Team invitations</li>
                  <li>• Activity tracking</li>
                  <li>• Usage analytics</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Multi-channel notification system with smart preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Email notifications</li>
                  <li>• Slack integration</li>
                  <li>• In-app alerts</li>
                  <li>• Custom preferences</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Tech Stack */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Built With Modern Technology</CardTitle>
              <CardDescription>
                Next.js 14, React 18, TypeScript, Prisma, WebSockets, Tailwind CSS, Radix UI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  'Next.js 14',
                  'React 18',
                  'TypeScript',
                  'Prisma ORM',
                  'WebSockets',
                  'Tailwind CSS',
                  'Radix UI',
                  'PostgreSQL',
                ].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Ready to explore? Check out the README for setup instructions.
            </p>
            <Button size="lg" className="mr-4">
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
