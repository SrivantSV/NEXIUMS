// Main Analytics Dashboard Component
'use client';

import { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TimePeriod } from '@/types/analytics';
import {
  Download,
  TrendingUp,
  DollarSign,
  Activity,
  Users,
  Zap,
  AlertCircle
} from 'lucide-react';
import { CostAnalyticsPanel } from './CostAnalyticsPanel';
import { ModelPerformancePanel } from './ModelPerformancePanel';
import { RecommendationsPanel } from './RecommendationsPanel';

interface AnalyticsDashboardProps {
  userId?: string;
  workspaceId?: string;
  role?: string;
}

export function AnalyticsDashboard({
  userId,
  workspaceId,
  role
}: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7d');

  const { metrics, insights, isLoading, error, refetch, exportData } = useAnalytics(
    selectedPeriod,
    { userId, workspaceId, autoRefresh: true, refreshInterval: 60000 }
  );

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      await exportData(format);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load analytics: {error.message}</p>
          </div>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive platform analytics and performance metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex gap-2">
            {['24h', '7d', '30d', '90d'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod(period as TimePeriod)}
                size="sm"
              >
                {period}
              </Button>
            ))}
          </div>

          {/* Export Button */}
          <Button
            onClick={() => handleExport('json')}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.usageMetrics.totalRequests.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {metrics?.usageMetrics.requestsPerUser || 0} per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.costMetrics.totalCost.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-green-600 mt-1">
              ↓ ${metrics?.costMetrics.totalSavings.toFixed(2) || '0.00'} saved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.performanceMetrics.averageResponseTime.toFixed(0) || 0}ms
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {metrics?.performanceMetrics.successRate.toFixed(1) || 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.userMetrics.dailyActiveUsers[metrics.userMetrics.dailyActiveUsers.length - 1]?.value || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Daily active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Highlights Section */}
      {insights?.summary.highlights && insights.summary.highlights.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle>Key Highlights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.summary.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span className="text-sm">{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Analytics */}
        <div className="lg:col-span-2">
          <CostAnalyticsPanel
            data={insights?.costInsights}
            period={selectedPeriod}
          />
        </div>

        {/* Recommendations */}
        <div className="lg:col-span-1">
          <RecommendationsPanel recommendations={insights?.recommendations || []} />
        </div>
      </div>

      {/* Model Performance */}
      <ModelPerformancePanel
        data={insights?.modelInsights}
        period={selectedPeriod}
      />

      {/* Anomalies Section */}
      {insights?.anomalies && insights.anomalies.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle>Detected Anomalies</CardTitle>
            </div>
            <CardDescription>
              Issues that require attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={`p-3 rounded-lg border ${
                    anomaly.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : anomaly.severity === 'high'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{anomaly.type.replace(/_/g, ' ').toUpperCase()}</h4>
                      <p className="text-sm text-gray-600 mt-1">{anomaly.description}</p>
                      {anomaly.suggestion && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          💡 {anomaly.suggestion}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        anomaly.severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : anomaly.severity === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {anomaly.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
