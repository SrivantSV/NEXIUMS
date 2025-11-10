/**
 * Home Page
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight">
          Nexus AI
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Advanced AI platform with comprehensive MCP (Model Context Protocol) integration framework.
          Connect to 50+ external services seamlessly.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/integrations">
            <Button size="lg">
              View Integrations
            </Button>
          </Link>
          <Link href="/docs">
            <Button size="lg" variant="outline">
              Documentation
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">50+ Integrations</h3>
            <p className="text-sm text-muted-foreground">
              Connect to GitHub, Slack, Notion, Linear, and many more services
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Smart Workflows</h3>
            <p className="text-sm text-muted-foreground">
              Multi-step workflows with intelligent intent classification
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Secure & Reliable</h3>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade security with OAuth and encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
