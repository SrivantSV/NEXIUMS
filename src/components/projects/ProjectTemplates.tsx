'use client';

import { useState } from 'react';
import { ProjectTemplate } from '@/types/projects';
import { projectTemplates } from '@/lib/data/project-templates';
import { useProjectStore } from '@/lib/stores/project-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ProjectTemplates() {
  const { createFromTemplate } = useProjectStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = projectTemplates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = Array.from(new Set(projectTemplates.map((t) => t.category)));

  const handleCreateFromTemplate = (template: ProjectTemplate) => {
    const customName = prompt('Enter project name:', template.name);
    if (customName) {
      createFromTemplate(template, { name: customName, owner: 'current-user' });
      alert(`Project "${customName}" created successfully!`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Project Templates</h1>
        <p className="text-muted-foreground">
          Start your project with pre-configured templates and best practices
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category.replace(/-/g, ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <ProjectTemplateCard
            key={template.id}
            template={template}
            onCreate={() => handleCreateFromTemplate(template)}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found</p>
        </div>
      )}
    </div>
  );
}

interface ProjectTemplateCardProps {
  template: ProjectTemplate;
  onCreate: () => void;
}

function ProjectTemplateCard({ template, onCreate }: ProjectTemplateCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{template.icon}</span>
              <span>{template.name}</span>
            </CardTitle>
            <CardDescription className="mt-2">{template.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Tech Stack */}
        <div>
          <h4 className="text-sm font-medium mb-2">Tech Stack</h4>
          <div className="flex flex-wrap gap-2">
            {template.techStack.languages?.map((lang, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              >
                {lang}
              </span>
            ))}
            {template.techStack.frontend?.slice(0, 2).map((tech, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
              >
                {tech}
              </span>
            ))}
            {template.techStack.backend?.slice(0, 1).map((tech, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div>
          <h4 className="text-sm font-medium mb-2">Initial Goals</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {template.goals?.slice(0, 3).map((goal, index) => (
              <li key={index}>• {goal}</li>
            ))}
            {template.goals && template.goals.length > 3 && (
              <li>• +{template.goals.length - 3} more...</li>
            )}
          </ul>
        </div>

        {/* Create Button */}
        <Button onClick={onCreate} className="w-full">
          Use This Template
        </Button>
      </CardContent>
    </Card>
  );
}
