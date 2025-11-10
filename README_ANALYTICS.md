# Analytics & Insights Platform

A comprehensive analytics and insights platform for Nexus AI, providing deep insights into user activity, costs, performance, and AI model usage.

## 🚀 Features

### 📊 Core Analytics

- **User Analytics**: DAU, WAU, MAU, engagement metrics, retention analysis
- **Usage Analytics**: Request tracking, peak usage patterns, feature adoption
- **Cost Analytics**: Real-time cost tracking, optimization insights, forecasting
- **Model Analytics**: Performance metrics, quality scores, comparisons
- **Business Analytics**: Revenue tracking, growth metrics, churn analysis
- **Performance Analytics**: Response times, error rates, system health

### 💰 Cost Optimization

- **Smart Router Savings**: Track cost savings from intelligent model routing
- **Cost Attribution**: Break down costs by user, team, project, and feature
- **Optimization Opportunities**: AI-powered recommendations for cost reduction
- **Budget Alerts**: Proactive alerts when approaching spending thresholds
- **Forecasting**: Predict monthly, quarterly, and yearly costs

### 🤖 AI Model Insights

- **Usage Distribution**: See which models are used most frequently
- **Performance Comparison**: Compare speed, quality, and cost across models
- **Quality Metrics**: User satisfaction ratings and feedback analysis
- **Router Performance**: Smart routing accuracy and confidence scores

### 🔍 Advanced Features

- **Anomaly Detection**: Automatic detection of unusual patterns
- **Predictive Analytics**: Forecast user growth, churn, and costs
- **Real-time Dashboards**: Live updates every 60 seconds
- **Custom Reports**: Export analytics data in JSON or CSV formats
- **Actionable Recommendations**: AI-generated suggestions for improvement

## 📁 Project Structure

```
src/
├── types/
│   └── analytics.ts              # Complete type definitions
├── lib/
│   └── analytics/
│       ├── event-collector.ts    # Event tracking & collection
│       ├── metrics-aggregator.ts # Metrics computation
│       └── insights-generator.ts # Insights & recommendations
├── hooks/
│   └── useAnalytics.ts          # React hooks for analytics
├── components/
│   └── analytics/
│       ├── AnalyticsDashboard.tsx
│       ├── CostAnalyticsPanel.tsx
│       ├── ModelPerformancePanel.tsx
│       └── RecommendationsPanel.tsx
├── app/
│   ├── analytics/
│   │   └── page.tsx             # Analytics page
│   └── api/
│       └── analytics/
│           ├── route.ts         # Main analytics API
│           ├── costs/route.ts   # Cost analytics API
│           ├── models/route.ts  # Model analytics API
│           └── export/route.ts  # Data export API
└── supabase/
    └── migrations/
        └── 20240110_create_analytics_tables.sql
```

## 🗄️ Database Schema

### Core Tables

- **analytics_events**: Raw event tracking
- **model_requests**: AI model request logs with performance metrics
- **cost_tracking**: Detailed cost attribution and tracking
- **user_analytics_summary**: Pre-aggregated user metrics
- **aggregated_metrics**: Time-series metrics storage
- **analytics_anomalies**: Detected anomalies and issues
- **analytics_recommendations**: AI-generated recommendations
- **feature_usage**: Feature adoption tracking
- **router_analytics**: Smart router performance metrics
- **session_analytics**: User session tracking

## 🔧 Setup

### 1. Run Database Migrations

```bash
# Apply the analytics schema
supabase db push

# Or if using migration files
supabase migration up
```

### 2. Install Dependencies

All required dependencies are already in `package.json`:

- @supabase/supabase-js
- React hooks (useState, useEffect, useCallback)
- Next.js 14+ with App Router

### 3. Access Analytics

Navigate to `/analytics` in your application to view the analytics dashboard.

## 📖 Usage

### Tracking Events

```typescript
import { analytics } from '@/lib/analytics/event-collector';

// Track a generic event
await analytics.track('feature_usage', userId, {
  featureId: 'smart-router',
  action: 'enabled'
});

// Track AI request
await analytics.trackAIRequest(
  userId,
  'gpt-4',
  'GPT-4',
  'openai',
  {
    inputTokens: 100,
    outputTokens: 200,
    responseTime: 1500,
    cost: 0.015,
    wasRouted: true,
    routerConfidence: 0.95
  }
);

// Track feature usage
await analytics.trackFeature(
  userId,
  'code-generation',
  'Code Generation'
);
```

### Using Analytics in Components

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { metrics, insights, isLoading, exportData } = useAnalytics('7d', {
    userId: 'user-id',
    autoRefresh: true
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Total Requests: {metrics?.usageMetrics.totalRequests}</h1>
      <h2>Total Cost: ${metrics?.costMetrics.totalCost}</h2>

      <button onClick={() => exportData('json')}>Export Data</button>
    </div>
  );
}
```

### API Endpoints

#### Get Analytics Data

```bash
GET /api/analytics?period=7d&userId=xxx
```

Response:

```json
{
  "success": true,
  "data": {
    "metrics": { ... },
    "insights": { ... }
  }
}
```

#### Get Cost Analytics

```bash
GET /api/analytics/costs?period=30d
```

#### Get Model Analytics

```bash
GET /api/analytics/models?period=7d
```

#### Export Data

```bash
POST /api/analytics/export
Content-Type: application/json

{
  "format": "json",
  "period": "30d",
  "includeInsights": true
}
```

## 🎨 Dashboard Features

### Key Metrics Overview

- Total Requests
- Total Cost with Savings
- Average Response Time
- Active Users

### Cost Analytics Panel

- Monthly forecast
- Smart router efficiency
- Model efficiency scores
- Savings opportunities
- Budget alerts

### Model Performance Panel

- Usage distribution
- Performance metrics
- Quality scores
- Model comparisons
- Top performing models

### Recommendations Panel

- Cost optimization tips
- Performance improvements
- Growth strategies
- Feature adoption suggestions

### Anomalies Section

- Cost spikes
- Performance degradation
- Error rate increases
- Usage anomalies

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Users can only view their own analytics
- Service role required for event insertion
- Secure API endpoints with authentication

## 📈 Performance

- Batch event processing (50 events per batch)
- Automatic flush every 5 seconds
- Indexed queries for fast retrieval
- Pre-aggregated metrics for common queries
- Efficient time-series data storage

## 🎯 Best Practices

1. **Event Tracking**: Track events asynchronously to avoid blocking user interactions
2. **Cost Attribution**: Always associate costs with users, teams, or projects
3. **Anomaly Monitoring**: Review anomalies daily to catch issues early
4. **Budget Alerts**: Set up alerts at 50%, 75%, and 90% of budget
5. **Regular Exports**: Export analytics data monthly for long-term storage

## 🚧 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Custom dashboard builder
- [ ] Advanced filtering and segmentation
- [ ] A/B testing framework
- [ ] Integration with external analytics platforms
- [ ] Mobile app analytics
- [ ] Team collaboration analytics
- [ ] Advanced ML-based predictions

## 📝 License

Part of the Nexus AI platform. All rights reserved.
