'use client';

import { Project } from '@/types/projects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';

interface ProjectOverviewProps {
  project: Project;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
          <CardDescription>Track project goals and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          {project.goals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No goals set yet</p>
          ) : (
            <div className="space-y-3">
              {project.goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          goal.status === 'completed'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : goal.status === 'in-progress'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {goal.status}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          goal.priority === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            : goal.priority === 'high'
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                            : goal.priority === 'medium'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                            : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {goal.priority}
                      </span>
                    </div>
                  </div>
                  {goal.dueDate && (
                    <div className="text-sm text-muted-foreground">
                      Due {formatRelativeTime(goal.dueDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Tech Stack</CardTitle>
          <CardDescription>Technologies used in this project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project.techStack.languages && project.techStack.languages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.languages.map((lang, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.techStack.frontend && project.techStack.frontend.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Frontend</h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.frontend.map((tech, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.techStack.backend && project.techStack.backend.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Backend</h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.backend.map((tech, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/20 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.techStack.database && project.techStack.database.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Database</h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.database.map((db, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-900/20 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300"
                    >
                      {db}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Insights</CardTitle>
          <CardDescription>AI-generated insights about your project</CardDescription>
        </CardHeader>
        <CardContent>
          {project.insights.filter((i) => !i.dismissedAt).length === 0 ? (
            <p className="text-muted-foreground text-sm">No insights available</p>
          ) : (
            <div className="space-y-3">
              {project.insights
                .filter((i) => !i.dismissedAt)
                .slice(0, 5)
                .map((insight) => (
                  <div key={insight.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                        {insight.actionable && insight.actionable.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium">Suggested Actions:</p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground">
                              {insight.actionable.map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          insight.type === 'achievement'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : insight.type === 'warning'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                            : insight.type === 'suggestion'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        }`}
                      >
                        {insight.type}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Project notes and documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {project.notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notes yet</p>
          ) : (
            <div className="space-y-3">
              {project.notes.slice(0, 5).map((note) => (
                <div key={note.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium">{note.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {note.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-gray-50 dark:bg-gray-900/20 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
