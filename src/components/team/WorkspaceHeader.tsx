'use client';

import { TeamWorkspace } from '@/types/collaboration';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';

interface WorkspaceHeaderProps {
  workspace: TeamWorkspace;
  onUpdate: (updates: Partial<TeamWorkspace>) => void;
}

export function WorkspaceHeader({ workspace, onUpdate }: WorkspaceHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
          <Badge variant="secondary" className="capitalize">
            {workspace.plan}
          </Badge>
        </div>
        {workspace.description && (
          <p className="text-muted-foreground">{workspace.description}</p>
        )}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>{workspace.members.length} members</span>
          <span>•</span>
          <span>{workspace.projects.length} projects</span>
          <span>•</span>
          <span>{workspace.channels.length} channels</span>
        </div>
      </div>
    </div>
  );
}
