// Model Performance Panel Component
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ModelInsights, TimePeriod } from '@/types/analytics';
import {
  Zap,
  CheckCircle,
  Star,
  TrendingUp,
  Activity
} from 'lucide-react';

interface ModelPerformancePanelProps {
  data?: ModelInsights;
  period: TimePeriod;
}

export function ModelPerformancePanel({ data, period }: ModelPerformancePanelProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
          <CardDescription>Loading performance data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Model Performance
        </CardTitle>
        <CardDescription>
          AI model usage, performance, and quality metrics
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Zap className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">
              {data.performance.averageResponseTime.toFixed(0)}ms
            </p>
            <p className="text-xs text-gray-600">Avg Response Time</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">
              {data.performance.reliability.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600">Success Rate</p>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Star className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">
              {data.quality.satisfaction.toFixed(1)}/5
            </p>
            <p className="text-xs text-gray-600">User Rating</p>
          </div>
        </div>

        {/* Model Usage Distribution */}
        {data.usage.distribution && data.usage.distribution.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Model Usage Distribution
            </h4>
            <div className="space-y-2">
              {data.usage.distribution.slice(0, 5).map((model, index) => (
                <div key={model.modelId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.modelName}</span>
                      <span className="text-xs text-gray-500">
                        ({model.provider})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">
                        {model.requestCount.toLocaleString()} requests
                      </span>
                      <span className="font-medium">
                        {model.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        index === 0
                          ? 'bg-blue-600'
                          : index === 1
                          ? 'bg-purple-600'
                          : index === 2
                          ? 'bg-green-600'
                          : 'bg-gray-600'
                      }`}
                      style={{ width: `${model.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>{model.avgResponseTime.toFixed(0)}ms avg</span>
                    <span>{model.successRate.toFixed(1)}% success</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Comparisons */}
        {data.performance.comparisons && data.performance.comparisons.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Model Comparison</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Model</th>
                    <th className="text-center py-2 font-medium">Speed</th>
                    <th className="text-center py-2 font-medium">Quality</th>
                    <th className="text-center py-2 font-medium">Cost</th>
                    <th className="text-center py-2 font-medium">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {data.performance.comparisons.map((model) => (
                    <tr key={model.modelId} className="border-b">
                      <td className="py-2">{model.modelName}</td>
                      <td className="text-center">
                        <ScoreBar score={model.speed} />
                      </td>
                      <td className="text-center">
                        <ScoreBar score={model.quality} />
                      </td>
                      <td className="text-center">
                        <ScoreBar score={model.cost} />
                      </td>
                      <td className="text-center">
                        <span className="font-medium text-blue-600">
                          {model.overallScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Models */}
        {data.usage.topModels && data.usage.topModels.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium mb-3">🏆 Top Performing Models</h4>
            <div className="flex flex-wrap gap-2">
              {data.usage.topModels.map((modelId, index) => (
                <span
                  key={modelId}
                  className="px-3 py-1 bg-white rounded-full text-sm font-medium border border-blue-300"
                >
                  #{index + 1} {modelId}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBar({ score }: { score: number }) {
  const percentage = score * 10; // Assuming score is 0-10
  const color =
    percentage >= 80
      ? 'bg-green-500'
      : percentage >= 60
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-200 rounded-full h-1.5">
        <div
          className={`${color} h-1.5 rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-xs">{score.toFixed(1)}</span>
    </div>
  );
}
