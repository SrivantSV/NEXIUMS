'use client';

import { useState } from 'react';
import { useProjectMemory } from '@/lib/hooks/use-project-memory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectMemoryProps {
  projectId: string;
}

export function ProjectMemory({ projectId }: ProjectMemoryProps) {
  const { memoryData, searchMemory, updateMemory, exportMemory, loading, error } =
    useProjectMemory(projectId);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const handleExport = async () => {
    await exportMemory();
  };

  return (
    <div className="space-y-6">
      {/* Memory Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Memory</CardTitle>
          <CardDescription>
            Search through architecture decisions, insights, and project knowledge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search project memory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => searchMemory(searchQuery)} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              Export Memory
            </Button>
          </div>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* Memory Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <MemorySummary memoryData={memoryData} />
        </TabsContent>

        <TabsContent value="architecture" className="space-y-4">
          <MemorySection
            title="Architecture Decisions"
            items={memoryData.architecture}
            emptyMessage="No architecture decisions recorded yet"
          />
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <MemorySection
            title="Decisions"
            items={memoryData.decisions}
            emptyMessage="No decisions recorded yet"
          />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <MemorySection
            title="Requirements"
            items={memoryData.requirements}
            emptyMessage="No requirements recorded yet"
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <MemorySection
            title="Key Insights"
            items={memoryData.insights}
            emptyMessage="No insights recorded yet"
          />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <MemorySection
            title="Identified Patterns"
            items={memoryData.patterns}
            emptyMessage="No patterns identified yet"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MemorySummaryProps {
  memoryData: any;
}

function MemorySummary({ memoryData }: MemorySummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Architecture Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{memoryData.architecture.length}</div>
          <p className="text-xs text-muted-foreground">Decisions recorded</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{memoryData.insights.length}</div>
          <p className="text-xs text-muted-foreground">Insights captured</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{memoryData.requirements.length}</div>
          <p className="text-xs text-muted-foreground">Requirements tracked</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{memoryData.decisions.length}</div>
          <p className="text-xs text-muted-foreground">Decisions made</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{memoryData.patterns.length}</div>
          <p className="text-xs text-muted-foreground">Patterns identified</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{memoryData.learnings.length}</div>
          <p className="text-xs text-muted-foreground">Learnings recorded</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface MemorySectionProps {
  title: string;
  items: any[];
  emptyMessage: string;
}

function MemorySection({ title, items, emptyMessage }: MemorySectionProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-base">{item.title || `Item ${index + 1}`}</CardTitle>
            {item.description && (
              <CardDescription>{item.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {item.context && (
              <p className="text-sm text-muted-foreground">{item.context}</p>
            )}
            {item.date && (
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(item.date).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
