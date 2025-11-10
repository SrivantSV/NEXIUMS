// Recommendations Panel Component
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Recommendation } from '@/types/analytics';
import {
  Lightbulb,
  TrendingUp,
  DollarSign,
  Zap,
  Users,
  Target,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
}

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recommendations
          </CardTitle>
          <CardDescription>
            No recommendations at this time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="text-sm">You're doing great!</p>
            <p className="text-xs mt-1">Keep up the good work.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          Recommendations
        </CardTitle>
        <CardDescription>
          {recommendations.length} actionable insights
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const getIcon = () => {
    switch (recommendation.type) {
      case 'cost':
        return <DollarSign className="h-4 w-4" />;
      case 'performance':
        return <Zap className="h-4 w-4" />;
      case 'growth':
        return <TrendingUp className="h-4 w-4" />;
      case 'usage':
        return <Target className="h-4 w-4" />;
      case 'retention':
        return <Users className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'critical':
        return 'border-red-300 bg-red-50';
      case 'high':
        return 'border-orange-300 bg-orange-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return 'border-blue-300 bg-blue-50';
    }
  };

  const getPriorityBadgeColor = () => {
    switch (recommendation.priority) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getPriorityColor()}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{recommendation.title}</h4>
            <p className="text-xs text-gray-600 mt-1">
              {recommendation.description}
            </p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${getPriorityBadgeColor()}`}
        >
          {recommendation.priority}
        </span>
      </div>

      {/* Impact & Effort */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Impact:</span>
          <span className="font-medium">{recommendation.impact}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Effort:</span>
          <span className="font-medium">{recommendation.effort}</span>
        </div>
        {recommendation.potentialValue > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Value:</span>
            <span className="font-medium text-green-600">
              ${recommendation.potentialValue.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Action Items */}
      {recommendation.actionItems && recommendation.actionItems.length > 0 && (
        <div className="space-y-1">
          {recommendation.actionItems.map((item, index) => (
            <div key={index} className="flex items-start gap-2 text-xs">
              <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-gray-500" />
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
