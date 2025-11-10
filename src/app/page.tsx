'use client';

import { useState } from 'react';
import { ProjectTemplates } from '@/components/projects/ProjectTemplates';
import { ProjectDashboard } from '@/components/projects/ProjectDashboard';
import { useProjectStore } from '@/lib/stores/project-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [view, setView] = useState<'home' | 'templates' | 'dashboard'>('home');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { projects } = useProjectStore();

  if (view === 'templates') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Nexus AI</h1>
            <Button variant="outline" onClick={() => setView('home')}>
              Back to Home
            </Button>
          </div>
        </div>
        <ProjectTemplates />
      </div>
    );
  }

  if (view === 'dashboard' && selectedProjectId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Nexus AI</h1>
            <Button variant="outline" onClick={() => setView('home')}>
              Back to Home
            </Button>
          </div>
        </div>
        <ProjectDashboard projectId={selectedProjectId} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold tracking-tight">Nexus AI</h1>
          <p className="text-muted-foreground mt-2">
            Projects & Memory System - Advanced project management with shared memory across AI models
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Features */}
        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-6">Features</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Layered Memory</CardTitle>
                <CardDescription>
                  Immediate, project, user, company, semantic, and cross-conversation memory layers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Immediate context from current chat</li>
                  <li>• Project-specific memory</li>
                  <li>• User preferences and patterns</li>
                  <li>• Company shared knowledge</li>
                  <li>• Semantic concept relationships</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cross-Model Support</CardTitle>
                <CardDescription>
                  Share memory across Claude, GPT, Gemini, and other AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Model-specific adapters</li>
                  <li>• Memory format conversion</li>
                  <li>• Context preservation</li>
                  <li>• Seamless switching</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  Comprehensive project organization and tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 13+ project types</li>
                  <li>• Goals and milestones</li>
                  <li>• Team collaboration</li>
                  <li>• Analytics and insights</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Semantic Search</CardTitle>
                <CardDescription>
                  Vector-based semantic memory search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Concept extraction</li>
                  <li>• Relationship mapping</li>
                  <li>• Similarity search</li>
                  <li>• Knowledge graphs</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pattern Recognition</CardTitle>
                <CardDescription>
                  AI-powered pattern identification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Usage patterns</li>
                  <li>• Learning trajectories</li>
                  <li>• Problem-solving patterns</li>
                  <li>• Collaboration insights</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Templates</CardTitle>
                <CardDescription>
                  Pre-configured templates for quick start
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Web development</li>
                  <li>• Data science</li>
                  <li>• Mobile apps</li>
                  <li>• Machine learning</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-6">Get Started</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create New Project</CardTitle>
                <CardDescription>
                  Start from scratch or use a template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setView('templates')} className="w-full">
                  Browse Templates
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>View Projects</CardTitle>
                <CardDescription>
                  {projects.length} project{projects.length !== 1 ? 's' : ''} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No projects yet. Create one to get started!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {projects.slice(0, 3).map((project) => (
                      <Button
                        key={project.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setView('dashboard');
                        }}
                      >
                        <span className="mr-2">{project.type === 'web-development' ? '🌐' : '📦'}</span>
                        {project.name}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Architecture Overview */}
        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-6">Architecture</h2>
          <Card>
            <CardHeader>
              <CardTitle>System Components</CardTitle>
              <CardDescription>
                Overview of the projects and memory system architecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Memory Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Shared memory manager with vector store, semantic processor, and cross-model bridge
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Project Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Zustand-based state management with comprehensive project types and templates
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">UI Components</h4>
                  <p className="text-sm text-muted-foreground">
                    Radix UI and shadcn/ui components with Tailwind CSS styling
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Memory Layers</h4>
                  <p className="text-sm text-muted-foreground">
                    Immediate, project, user, company, semantic, and conversational memory
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
