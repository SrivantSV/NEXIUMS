// Cost Analytics Panel Component
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CostInsights, TimePeriod } from '@/types/analytics';
import {
  DollarSign,
  TrendingDown,
  Lightbulb,
  ArrowRight,
  PieChart
} from 'lucide-react';

interface CostAnalyticsPanelProps {
  data?: CostInsights;
  period: TimePeriod;
}

export function CostAnalyticsPanel({ data, period }: CostAnalyticsPanelProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Analytics</CardTitle>
          <CardDescription>Loading cost data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const optimizationScore = data.optimization.score || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Analytics
            </CardTitle>
            <CardDescription>
              Cost breakdown and optimization insights
            </CardDescription>
          </div>

          {/* Optimization Score */}
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {optimizationScore.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600">Optimization Score</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cost Overview Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Monthly Forecast</p>
            <p className="text-2xl font-bold">
              ${data.forecasting.monthlyForecast.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Total Savings</p>
            <p className="text-2xl font-bold text-green-600">
              ${data.optimization.totalSavings.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Smart Router Efficiency */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              Smart Router Efficiency
            </span>
            <span className="text-sm font-bold text-green-600">
              {data.optimization.routerEfficiency.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(data.optimization.routerEfficiency, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Optimizing {data.optimization.routerEfficiency.toFixed(0)}% of requests
          </p>
        </div>

        {/* Model Efficiency */}
        {data.optimization.modelEfficiency && data.optimization.modelEfficiency.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Model Efficiency
            </h4>
            <div className="space-y-2">
              {data.optimization.modelEfficiency.slice(0, 3).map((model, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{model.modelId}</p>
                    <p className="text-xs text-gray-600">{model.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${
                        model.efficiencyScore >= 70
                          ? 'text-green-600'
                          : model.efficiencyScore >= 40
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {model.efficiencyScore.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Optimization Opportunities */}
        {data.optimization.savingsOpportunities &&
          data.optimization.savingsOpportunities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                Savings Opportunities
              </h4>
              <div className="space-y-2">
                {data.optimization.savingsOpportunities.slice(0, 3).map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium">{opportunity.title}</h5>
                        <p className="text-xs text-gray-600 mt-1">
                          {opportunity.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-gray-600">
                            Effort: <span className="font-medium">{opportunity.effort}</span>
                          </span>
                          <span className="text-gray-600">
                            Impact: <span className="font-medium">{opportunity.impact}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-green-600">
                          ${opportunity.potentialSaving.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">potential saving</p>
                      </div>
                    </div>

                    {opportunity.actionItems && opportunity.actionItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <p className="text-xs font-medium mb-1">Action Items:</p>
                        <ul className="space-y-1">
                          {opportunity.actionItems.map((item, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                              <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Budget Alerts */}
        {data.forecasting.budgetAlerts && data.forecasting.budgetAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Budget Alerts</h4>
            <div className="space-y-2">
              {data.forecasting.budgetAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'high'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <span className="text-sm font-bold">
                      {alert.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
