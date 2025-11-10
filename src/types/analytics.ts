// Complete Analytics Type System for Nexus AI
export type TimePeriod = '1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';
export type Timeframe = { start: Date; end: Date } | TimePeriod;
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timeseries';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type TrendDirection = 'up' | 'down' | 'stable';

// ============================================================================
// CORE ANALYTICS METRICS
// ============================================================================

export interface AnalyticsMetrics {
  // User Analytics
  userMetrics: UserMetrics;
  usageMetrics: UsageMetrics;
  behaviorMetrics: BehaviorMetrics;
  engagementMetrics: EngagementMetrics;
  retentionMetrics: RetentionMetrics;

  // Product Analytics
  featureMetrics: FeatureMetrics;
  performanceMetrics: PerformanceMetrics;
  qualityMetrics: QualityMetrics;
  satisfactionMetrics: SatisfactionMetrics;

  // Business Analytics
  revenueMetrics: RevenueMetrics;
  subscriptionMetrics: SubscriptionMetrics;
  churnMetrics: ChurnMetrics;
  growthMetrics: GrowthMetrics;

  // Technical Analytics
  systemMetrics: SystemMetrics;
  errorMetrics: ErrorMetrics;
  apiMetrics: APIMetrics;

  // AI Model Analytics
  modelMetrics: ModelMetrics;
  costMetrics: CostMetrics;
  routingMetrics: RouterMetrics;

  // Team Analytics
  teamMetrics: TeamMetrics;
  collaborationMetrics: CollaborationMetrics;
  productivityMetrics: ProductivityMetrics;
}

// ============================================================================
// USER METRICS
// ============================================================================

export interface UserMetrics {
  // Activity Metrics
  dailyActiveUsers: TimeSeriesData[];
  weeklyActiveUsers: TimeSeriesData[];
  monthlyActiveUsers: TimeSeriesData[];
  averageSessionDuration: number;
  sessionsPerUser: number;
  totalSessions: number;

  // Engagement Metrics
  messagesPerUser: number;
  artifactsCreated: number;
  filesUploaded: number;
  projectsCreated: number;
  collaborationsInitiated: number;

  // Feature Adoption
  featureAdoption: FeatureAdoptionMetric[];
  mcpUsage: MCPUsageMetric[];
  modelUsage: ModelUsageMetric[];

  // User Journey
  onboardingCompletion: number;
  timeToFirstValue: number;
  featureDiscovery: FeatureDiscoveryMetric[];

  // Segmentation
  userSegments: UserSegment[];
  cohortAnalysis: CohortData[];
}

export interface UsageMetrics {
  totalRequests: number;
  requestsPerUser: number;
  requestsPerDay: TimeSeriesData[];
  peakUsageHours: HourlyUsageData[];
  averageRequestsPerSession: number;
  tokensConsumed: TokenUsageData;
}

export interface BehaviorMetrics {
  mostUsedFeatures: FeatureUsageData[];
  userFlows: UserFlowData[];
  dropOffPoints: DropOffData[];
  conversionFunnels: FunnelData[];
}

export interface EngagementMetrics {
  engagementScore: number;
  stickinessRatio: number; // DAU/MAU
  returnRate: number;
  sessionFrequency: number;
  featureInteractions: number;
}

export interface RetentionMetrics {
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  cohortRetention: CohortRetentionData[];
  churnRate: number;
  churnPrediction: ChurnPredictionData[];
}

// ============================================================================
// COST METRICS
// ============================================================================

export interface CostMetrics {
  // Total Cost Breakdown
  totalCost: number;
  costPerUser: number;
  costPerRequest: number;
  costPerProject: number;
  costTrend: TrendDirection;

  // Model Costs
  modelCosts: ModelCostBreakdown[];
  averageRequestCost: number;
  costTrends: CostTrendData[];

  // Smart Router Savings
  potentialCost: number; // without smart routing
  actualCost: number; // with smart routing
  totalSavings: number;
  savingsPercentage: number;
  savingsByUser: UserSavingsData[];
  routerEfficiency: number;

  // Cost Attribution
  costByTeam: TeamCostData[];
  costByProject: ProjectCostData[];
  costByFeature: FeatureCostData[];
  costByUser: UserCostData[];

  // Cost Optimization
  optimizationOpportunities: CostOptimization[];
  recommendedActions: CostRecommendation[];
  budgetAlerts: BudgetAlert[];

  // Forecasting
  monthlyForecast: number;
  quarterlyForecast: number;
  yearlyForecast: number;
}

export interface ModelCostBreakdown {
  modelId: string;
  modelName: string;
  provider: string;
  requestCount: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  averageCostPerRequest: number;
  costShare: number; // percentage of total cost
  trend: TrendDirection;
}

export interface CostOptimization {
  id: string;
  type: 'model_selection' | 'routing' | 'caching' | 'batching' | 'quota';
  title: string;
  description: string;
  potentialSaving: number;
  savingsPercentage: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  priority: number;
  actionItems: string[];
}

export interface CostRecommendation {
  id: string;
  type: string;
  message: string;
  savingAmount: number;
  confidence: number;
  createdAt: Date;
}

// ============================================================================
// MODEL METRICS
// ============================================================================

export interface ModelMetrics {
  // Usage Statistics
  requestsPerModel: ModelUsageData[];
  responseTime: ModelPerformanceData[];
  successRate: ModelReliabilityData[];

  // Quality Metrics
  userSatisfaction: ModelSatisfactionData[];
  taskCompletion: ModelEffectivenessData[];
  accuracyScores: ModelAccuracyData[];

  // Smart Router Performance
  routingAccuracy: number;
  routingLatency: number;
  routingConfidence: RouterConfidenceData[];

  // A/B Testing Results
  modelComparisons: ModelComparisonData[];
  performanceBenchmarks: ModelBenchmarkData[];

  // Cost Efficiency
  costEfficiency: ModelCostEfficiencyData[];
  qualityCostRatio: ModelQualityCostData[];
}

export interface RouterMetrics {
  totalRoutes: number;
  routingAccuracy: number;
  averageConfidence: number;
  routingLatency: number;
  modelSelections: ModelSelectionData[];
  savingsGenerated: number;
  failoverRate: number;
  optimizationScore: number;
}

export interface ModelUsageData {
  modelId: string;
  modelName: string;
  provider: string;
  requestCount: number;
  percentage: number;
  trend: TrendDirection;
  avgResponseTime: number;
  successRate: number;
}

export interface ModelPerformanceData {
  modelId: string;
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  trend: TimeSeriesData[];
}

export interface ModelSatisfactionData {
  modelId: string;
  averageRating: number;
  totalRatings: number;
  thumbsUp: number;
  thumbsDown: number;
  satisfactionScore: number;
}

export interface ModelComparisonData {
  modelId: string;
  modelName: string;
  speed: number;
  quality: number;
  cost: number;
  reliability: number;
  overallScore: number;
}

// ============================================================================
// BUSINESS METRICS
// ============================================================================

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  revenueGrowthRate: number;
  revenueByTier: TierRevenueData[];
  revenueTrend: TimeSeriesData[];
}

export interface SubscriptionMetrics {
  totalSubscribers: number;
  newSubscribers: number;
  canceledSubscriptions: number;
  upgrades: number;
  downgrades: number;
  subscribersByTier: SubscriptionTierData[];
  conversionRate: number;
  trialConversionRate: number;
}

export interface ChurnMetrics {
  churnRate: number;
  churnedUsers: number;
  churnReasons: ChurnReasonData[];
  churnRisk: UserChurnRisk[];
  retentionRate: number;
  lifeTimeValue: number;
}

export interface GrowthMetrics {
  userGrowthRate: number;
  revenueGrowthRate: number;
  netPromoterScore: number;
  viralCoefficient: number;
  customerAcquisitionCost: number;
  lifeTimeValueToCAC: number;
}

// ============================================================================
// TECHNICAL METRICS
// ============================================================================

export interface SystemMetrics {
  uptime: number;
  availability: number;
  latency: LatencyMetrics;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  errorsByType: ErrorTypeData[];
  errorsByEndpoint: ErrorEndpointData[];
  criticalErrors: number;
  errorTrend: TimeSeriesData[];
}

export interface APIMetrics {
  totalRequests: number;
  requestsPerSecond: number;
  averageLatency: number;
  successRate: number;
  endpointUsage: EndpointUsageData[];
  slowestEndpoints: SlowEndpointData[];
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  responseTimeTrend: TimeSeriesData[];
  throughput: number;
  cacheHitRate: number;
}

// ============================================================================
// TEAM & COLLABORATION METRICS
// ============================================================================

export interface TeamMetrics {
  totalTeams: number;
  averageTeamSize: number;
  activeTeams: number;
  teamGrowth: number;
  teamActivity: TeamActivityData[];
}

export interface CollaborationMetrics {
  sharedProjects: number;
  collaborationSessions: number;
  averageCollaborators: number;
  messageExchanges: number;
  fileShares: number;
}

export interface ProductivityMetrics {
  tasksCompleted: number;
  averageTaskDuration: number;
  projectsCompleted: number;
  codeGenerated: number;
  artifactsCreated: number;
}

// ============================================================================
// FEATURE METRICS
// ============================================================================

export interface FeatureMetrics {
  features: FeatureUsageData[];
  adoption: FeatureAdoptionData[];
  engagement: FeatureEngagementData[];
  retention: FeatureRetentionData[];
}

export interface FeatureUsageData {
  featureId: string;
  featureName: string;
  usageCount: number;
  uniqueUsers: number;
  adoptionRate: number;
  trend: TrendDirection;
}

export interface FeatureAdoptionMetric {
  featureId: string;
  featureName: string;
  totalUsers: number;
  adoptedUsers: number;
  adoptionRate: number;
  timeToAdopt: number;
}

export interface MCPUsageMetric {
  serverId: string;
  serverName: string;
  usageCount: number;
  uniqueUsers: number;
  averageCallsPerUser: number;
}

export interface ModelUsageMetric {
  modelId: string;
  modelName: string;
  usageCount: number;
  uniqueUsers: number;
  preferenceRate: number;
}

// ============================================================================
// INSIGHTS & ANALYTICS
// ============================================================================

export interface AnalyticsInsights {
  // Core Insights
  userInsights: UserInsights;
  usageInsights: UsageInsights;
  costInsights: CostInsights;
  performanceInsights: PerformanceInsights;
  modelInsights: ModelInsights;
  businessInsights: BusinessInsights;
  routerInsights: RouterInsights;

  // Recommendations
  recommendations: Recommendation[];

  // Anomaly Detection
  anomalies: Anomaly[];

  // Predictive Analytics
  predictions: PredictiveAnalytics;

  // Recent Activity
  recentActivity: ActivityEvent[];

  // Summary
  summary: AnalyticsSummary;
}

export interface UserInsights {
  userGrowth: GrowthInsight;
  engagement: EngagementInsight;
  retention: RetentionInsight;
  adoption: AdoptionInsight;
}

export interface CostInsights {
  optimization: CostOptimizationInsight;
  attribution: CostAttributionInsight;
  forecasting: CostForecastingInsight;
  roi: ROIInsight;
}

export interface ModelInsights {
  usage: ModelUsageInsight;
  performance: ModelPerformanceInsight;
  quality: ModelQualityInsight;
  efficiency: ModelEfficiencyInsight;
}

export interface Recommendation {
  id: string;
  type: 'cost' | 'performance' | 'usage' | 'growth' | 'retention' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: string;
  potentialValue: number;
  actionItems: string[];
  createdAt: Date;
}

export interface Anomaly {
  id: string;
  type: 'statistical' | 'cost_spike' | 'performance' | 'usage' | 'error' | 'model_cost_anomaly';
  metric: string;
  severity: AnomalySeverity;
  value: number;
  expectedValue?: number;
  change?: number;
  zScore?: number;
  model?: string;
  timestamp: Date;
  description: string;
  suggestion?: string;
}

export interface PredictiveAnalytics {
  userGrowthForecast: ForecastData[];
  churnPrediction: ChurnPredictionData[];
  costForecast: CostForecastData[];
  capacityPlanning: CapacityPlanningData;
}

// ============================================================================
// EVENTS & TRACKING
// ============================================================================

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  userId: string;
  timestamp: Date;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

export type EventType =
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  | 'profile_update'
  | 'subscription_change'
  | 'ai_request'
  | 'ai_response'
  | 'model_selection'
  | 'feature_usage'
  | 'project_created'
  | 'file_uploaded'
  | 'collaboration_started'
  | 'error_occurred'
  | 'payment_processed'
  | 'export_data'
  | 'settings_changed';

export interface EnrichedAnalyticsEvent extends AnalyticsEvent {
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  userTier: string;
  userSegment: string;
  platform: string;
  version: string;
}

export interface AIRequestEvent extends EnrichedAnalyticsEvent {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  responseTime: number;
  cost: number;
  wasRouted: boolean;
  routerConfidence?: number;
  userFeedback?: {
    rating: number;
    comment?: string;
  };
}

export interface ActivityEvent {
  id: string;
  type: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// SUPPORTING DATA STRUCTURES
// ============================================================================

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface CohortData {
  cohortName: string;
  cohortDate: Date;
  size: number;
  retentionByDay: number[];
}

export interface UserSegment {
  segmentId: string;
  segmentName: string;
  userCount: number;
  percentage: number;
  criteria: Record<string, any>;
}

export interface FeatureDiscoveryMetric {
  featureId: string;
  featureName: string;
  discoveryRate: number;
  timeToDiscover: number;
}

export interface TokenUsageData {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averageTokensPerRequest: number;
}

export interface HourlyUsageData {
  hour: number;
  requestCount: number;
  userCount: number;
}

export interface UserFlowData {
  flowId: string;
  flowName: string;
  steps: string[];
  completionRate: number;
  averageTime: number;
}

export interface DropOffData {
  step: string;
  dropOffRate: number;
  usersDropped: number;
}

export interface FunnelData {
  funnelId: string;
  funnelName: string;
  stages: FunnelStage[];
  conversionRate: number;
}

export interface FunnelStage {
  name: string;
  userCount: number;
  conversionRate: number;
}

export interface CostTrendData {
  date: Date;
  cost: number;
  requests: number;
  costPerRequest: number;
}

export interface UserSavingsData {
  userId: string;
  userName: string;
  potentialCost: number;
  actualCost: number;
  savings: number;
}

export interface TeamCostData {
  teamId: string;
  teamName: string;
  totalCost: number;
  memberCount: number;
  costPerMember: number;
}

export interface ProjectCostData {
  projectId: string;
  projectName: string;
  totalCost: number;
  requestCount: number;
  costPerRequest: number;
}

export interface FeatureCostData {
  featureId: string;
  featureName: string;
  totalCost: number;
  usageCount: number;
  costPerUse: number;
}

export interface UserCostData {
  userId: string;
  userName: string;
  totalCost: number;
  requestCount: number;
  averageCostPerRequest: number;
  tier: string;
}

export interface BudgetAlert {
  id: string;
  threshold: number;
  currentSpend: number;
  percentage: number;
  severity: AnomalySeverity;
  message: string;
}

export interface ModelReliabilityData {
  modelId: string;
  successCount: number;
  failureCount: number;
  successRate: number;
  uptimePercentage: number;
}

export interface ModelEffectivenessData {
  modelId: string;
  taskCompletionRate: number;
  averageTaskDuration: number;
  userRetryRate: number;
}

export interface ModelAccuracyData {
  modelId: string;
  accuracyScore: number;
  precisionScore: number;
  recallScore: number;
}

export interface RouterConfidenceData {
  timestamp: Date;
  confidence: number;
  modelSelected: string;
  wasCorrect: boolean;
}

export interface ModelBenchmarkData {
  modelId: string;
  benchmarkName: string;
  score: number;
  rank: number;
}

export interface ModelCostEfficiencyData {
  modelId: string;
  costPerTask: number;
  performanceScore: number;
  efficiencyRatio: number;
}

export interface ModelQualityCostData {
  modelId: string;
  qualityScore: number;
  cost: number;
  ratio: number;
}

export interface ModelSelectionData {
  modelId: string;
  selectionCount: number;
  percentage: number;
  avgConfidence: number;
}

export interface TierRevenueData {
  tier: string;
  revenue: number;
  subscribers: number;
  revenuePerSubscriber: number;
}

export interface SubscriptionTierData {
  tier: string;
  count: number;
  percentage: number;
  growth: number;
}

export interface ChurnReasonData {
  reason: string;
  count: number;
  percentage: number;
}

export interface UserChurnRisk {
  userId: string;
  userName: string;
  riskScore: number;
  factors: string[];
  probability: number;
}

export interface LatencyMetrics {
  p50: number;
  p95: number;
  p99: number;
  average: number;
}

export interface ErrorTypeData {
  errorType: string;
  count: number;
  percentage: number;
  trend: TrendDirection;
}

export interface ErrorEndpointData {
  endpoint: string;
  errorCount: number;
  errorRate: number;
}

export interface EndpointUsageData {
  endpoint: string;
  requestCount: number;
  averageLatency: number;
  errorRate: number;
}

export interface SlowEndpointData {
  endpoint: string;
  averageLatency: number;
  p95Latency: number;
  requestCount: number;
}

export interface TeamActivityData {
  teamId: string;
  teamName: string;
  activityScore: number;
  requestCount: number;
  activeMembers: number;
}

export interface FeatureAdoptionData {
  featureId: string;
  adoptionRate: number;
  trend: TrendDirection;
}

export interface FeatureEngagementData {
  featureId: string;
  engagementScore: number;
  dailyActiveUsers: number;
}

export interface FeatureRetentionData {
  featureId: string;
  retentionRate: number;
  churnRate: number;
}

export interface GrowthInsight {
  rate: number;
  trend: TrendDirection;
  seasonality: string;
  forecast: ForecastData[];
}

export interface EngagementInsight {
  score: number;
  trends: TimeSeriesData[];
  segments: SegmentEngagement[];
  drivers: EngagementDriver[];
}

export interface SegmentEngagement {
  segment: string;
  score: number;
  trend: TrendDirection;
}

export interface EngagementDriver {
  driver: string;
  impact: number;
  correlation: number;
}

export interface RetentionInsight {
  cohortAnalysis: CohortRetentionData[];
  churnPrediction: ChurnPredictionData[];
  retentionFactors: RetentionFactor[];
}

export interface CohortRetentionData {
  cohort: string;
  size: number;
  retention: number[];
}

export interface ChurnPredictionData {
  userId: string;
  userName: string;
  churnProbability: number;
  factors: string[];
  recommendedActions: string[];
}

export interface RetentionFactor {
  factor: string;
  impact: number;
  direction: 'positive' | 'negative';
}

export interface AdoptionInsight {
  featureUsage: FeatureUsageData[];
  adoptionFunnel: AdoptionFunnelData[];
  stickiness: StickinessData[];
}

export interface AdoptionFunnelData {
  stage: string;
  userCount: number;
  conversionRate: number;
}

export interface StickinessData {
  featureId: string;
  stickinessScore: number;
  dau: number;
  mau: number;
}

export interface CostOptimizationInsight {
  totalSavings: number;
  savingsOpportunities: CostOptimization[];
  routerEfficiency: number;
  modelEfficiency: ModelEfficiency[];
  score: number;
}

export interface ModelEfficiency {
  modelId: string;
  efficiencyScore: number;
  recommendation: string;
}

export interface CostAttributionInsight {
  byUser: UserCostData[];
  byTeam: TeamCostData[];
  byProject: ProjectCostData[];
  byFeature: FeatureCostData[];
}

export interface CostForecastingInsight {
  monthlyForecast: number;
  budgetAlerts: BudgetAlert[];
  scalingCosts: ScalingCostData[];
}

export interface ScalingCostData {
  userCount: number;
  projectedCost: number;
  costPerUser: number;
}

export interface ROIInsight {
  userROI: number;
  featureROI: ROIData[];
  modelROI: ROIData[];
}

export interface ROIData {
  id: string;
  name: string;
  investment: number;
  return: number;
  roi: number;
}

export interface UsageInsights {
  totalRequests: number;
  trend: TrendDirection;
  peakHours: HourlyUsageData[];
  topFeatures: FeatureUsageData[];
  userDistribution: UserDistributionData[];
}

export interface UserDistributionData {
  category: string;
  userCount: number;
  percentage: number;
}

export interface PerformanceInsights {
  responseTime: PerformanceMetric;
  errorRate: PerformanceMetric;
  throughput: PerformanceMetric;
  reliability: number;
  issues: PerformanceIssue[];
}

export interface PerformanceMetric {
  current: number;
  baseline: number;
  change: number;
  trend: TrendDirection;
}

export interface PerformanceIssue {
  type: string;
  severity: AnomalySeverity;
  description: string;
  affectedUsers: number;
}

export interface ModelUsageInsight {
  distribution: ModelUsageData[];
  trends: TimeSeriesData[];
  topModels: string[];
}

export interface ModelPerformanceInsight {
  averageResponseTime: number;
  reliability: number;
  comparisons: ModelComparisonData[];
}

export interface ModelQualityInsight {
  satisfaction: number;
  accuracy: number;
  effectiveness: number;
}

export interface ModelEfficiencyInsight {
  costEfficiency: number;
  qualityCostRatio: number;
  recommendations: string[];
}

export interface BusinessInsights {
  revenue: RevenueInsight;
  growth: GrowthMetric;
  health: BusinessHealthScore;
}

export interface RevenueInsight {
  mrr: number;
  arr: number;
  growth: number;
  forecast: number;
}

export interface BusinessHealthScore {
  overall: number;
  metrics: {
    userGrowth: number;
    retention: number;
    engagement: number;
    revenue: number;
  };
}

export interface RouterInsights {
  accuracy: number;
  confidence: number;
  savings: number;
  efficiency: number;
  distribution: ModelSelectionData[];
}

export interface ForecastData {
  date: Date;
  predicted: number;
  confidence: {
    lower: number;
    upper: number;
  };
}

export interface CostForecastData {
  date: Date;
  predictedCost: number;
  confidence: number;
}

export interface CapacityPlanningData {
  currentCapacity: number;
  projectedDemand: number;
  recommendedCapacity: number;
  timeline: Date;
}

export interface AnalyticsSummary {
  period: TimePeriod;
  highlights: string[];
  keyMetrics: {
    totalUsers: number;
    activeUsers: number;
    totalRequests: number;
    totalCost: number;
    avgResponseTime: number;
    satisfaction: number;
  };
  changes: {
    users: number;
    requests: number;
    cost: number;
    performance: number;
  };
}

// ============================================================================
// FILTERS & QUERIES
// ============================================================================

export interface AnalyticsFilters {
  userId?: string;
  teamId?: string;
  projectId?: string;
  modelId?: string;
  featureId?: string;
  tier?: string;
  segment?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface AnalyticsQuery {
  metrics: string[];
  dimensions: string[];
  filters: AnalyticsFilters;
  timeframe: Timeframe;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  groupBy?: string[];
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface AnalyticsEventRecord {
  id: string;
  event_type: EventType;
  user_id: string;
  session_id: string;
  timestamp: string;
  properties: any;
  metadata: any;
  user_tier: string;
  user_segment: string;
  ip_address: string;
  user_agent: string;
  platform: string;
  created_at: string;
}

export interface ModelRequestRecord {
  id: string;
  user_id: string;
  model_id: string;
  model_name: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  response_time: number;
  was_routed: boolean;
  router_confidence: number | null;
  status: 'success' | 'error' | 'timeout';
  error_type: string | null;
  user_feedback_rating: number | null;
  user_feedback_comment: string | null;
  created_at: string;
}

export interface AggregatedMetricRecord {
  id: string;
  metric_name: string;
  metric_type: MetricType;
  dimension: string | null;
  dimension_value: string | null;
  period_start: string;
  period_end: string;
  value: number;
  count: number;
  metadata: any;
  created_at: string;
}
