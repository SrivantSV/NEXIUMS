import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code2, Zap, Shield, Share2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create & Execute Code Artifacts with AI
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Build, test, and share code artifacts across multiple languages and frameworks.
              Secure execution, AI assistance, and real-time collaboration.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="outline" size="lg">
                  Browse Templates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to build and execute code
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Powerful features for developers, educators, and teams
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Code2 className="h-8 w-8" />}
              title="Multi-Language Support"
              description="Execute JavaScript, Python, React, HTML, and more with built-in runners"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Secure Execution"
              description="Docker-based sandboxing with resource limits and network isolation"
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Real-Time Preview"
              description="See your code come to life with instant preview for web technologies"
            />
            <FeatureCard
              icon={<Share2 className="h-8 w-8" />}
              title="Share & Collaborate"
              description="Share artifacts with password protection and permission controls"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to start building?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Join thousands of developers creating amazing code artifacts
            </p>
            <div className="mt-8">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-blue-600 dark:text-blue-400 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
