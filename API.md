# Nexus AI - Complete API Documentation

## Table of Contents

1. [Authentication](#authentication)
2. [Chat API](#chat-api)
3. [Models API](#models-api)
4. [Analytics API](#analytics-api)
5. [A/B Testing API](#ab-testing-api)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

All API requests require authentication using either JWT tokens or API keys.

### Methods

**1. JWT Bearer Token**
```http
Authorization: Bearer <your_jwt_token>
```

**2. API Key**
```http
Authorization: ApiKey <your_api_key>
```

### Getting a Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "subscriptionTier": "PRO"
  }
}
```

---

## Chat API

### POST /api/ai/chat

Generate AI responses with automatic or manual model selection.

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| messages | Array | Yes | Array of message objects |
| model | String | No | Specific model ID (auto-selects if not provided) |
| stream | Boolean | No | Enable streaming response (default: false) |
| temperature | Number | No | Sampling temperature 0-2 (default: 1.0) |
| maxTokens | Number | No | Maximum tokens to generate |
| userId | String | Yes | User identifier |
| projectId | String | No | Project identifier |
| preferences | Object | No | User preferences for model selection |
| constraints | Object | No | Request constraints |

#### Message Object

```typescript
{
  role: 'system' | 'user' | 'assistant',
  content: string,
  metadata?: Record<string, any>
}
```

#### Preferences Object

```typescript
{
  preferredModels?: string[],
  avoidModels?: string[],
  maxCostPerRequest?: number,
  minQualityScore?: number,
  prioritizeCost?: boolean,
  prioritizeSpeed?: boolean,
  prioritizeQuality?: boolean
}
```

#### Constraints Object

```typescript
{
  maxLatency?: number,
  maxCost?: number,
  requireStreaming?: boolean,
  requireFunctionCalling?: boolean,
  requireVision?: boolean
}
```

#### Examples

**Basic Request:**
```bash
curl -X POST https://api.example.com/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Explain React hooks"}
    ],
    "userId": "user-123"
  }'
```

**With Model Selection:**
```bash
curl -X POST https://api.example.com/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Write a sorting algorithm"}
    ],
    "model": "deepseek-coder",
    "userId": "user-123"
  }'
```

**With Cost Optimization:**
```bash
curl -X POST https://api.example.com/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Simple greeting"}
    ],
    "userId": "user-123",
    "preferences": {
      "prioritizeCost": true,
      "minQualityScore": 0.7
    }
  }'
```

**Streaming Request:**
```bash
curl -X POST https://api.example.com/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Tell me a story"}
    ],
    "stream": true,
    "userId": "user-123"
  }'
```

#### Response

**Non-Streaming:**
```json
{
  "id": "msg_abc123",
  "model": "claude-sonnet-4.5",
  "content": "React hooks are functions that let you...",
  "usage": {
    "promptTokens": 45,
    "completionTokens": 200,
    "totalTokens": 245
  },
  "cost": 0.00125,
  "responseTime": 1234,
  "finishReason": "stop",
  "routing": {
    "selectedModel": "claude-sonnet-4.5",
    "reasoning": [
      "Selected Claude Sonnet 4.5 based on:",
      "- Quality score: 95/100",
      "- Cost efficiency: 95/100",
      "- Average latency: 1200ms",
      "- Specializations: balanced performance, coding, general tasks"
    ]
  }
}
```

**Streaming:**
```
data: {"id":"msg_abc","delta":"React"}

data: {"id":"msg_abc","delta":" hooks"}

data: {"id":"msg_abc","delta":" are"}

data: {"id":"msg_abc","delta":"","finishReason":"stop"}

data: [DONE]
```

---

## Models API

### GET /api/ai/models

List and query available AI models.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| provider | String | Filter by provider (anthropic, openai, google, etc.) |
| capability | String | Filter by capability (codeGeneration, reasoning, etc.) |
| id | String | Get specific model by ID |
| performance | Boolean | Include real-time performance data |

#### Examples

**Get All Models:**
```bash
curl -X GET "https://api.example.com/api/ai/models" \
  -H "Authorization: Bearer <token>"
```

**Get Anthropic Models:**
```bash
curl -X GET "https://api.example.com/api/ai/models?provider=anthropic" \
  -H "Authorization: Bearer <token>"
```

**Get Code Generation Models:**
```bash
curl -X GET "https://api.example.com/api/ai/models?capability=codeGeneration" \
  -H "Authorization: Bearer <token>"
```

**Get Specific Model with Performance:**
```bash
curl -X GET "https://api.example.com/api/ai/models?id=claude-sonnet-4.5&performance=true" \
  -H "Authorization: Bearer <token>"
```

#### Response

```json
{
  "models": [
    {
      "id": "claude-sonnet-4.5",
      "name": "Claude Sonnet 4.5",
      "provider": "anthropic",
      "type": "text",
      "version": "4.5",
      "capabilities": {
        "textGeneration": true,
        "codeGeneration": true,
        "reasoning": true,
        "math": true,
        "analysis": true,
        "creative": true,
        "multimodal": true,
        "webSearch": false,
        "functionCalling": true,
        "streaming": true,
        "contextWindow": 200000,
        "maxOutputTokens": 8192,
        "visionCapable": true
      },
      "pricing": {
        "inputTokenCost": 3.0,
        "outputTokenCost": 15.0,
        "currency": "USD"
      },
      "limits": {
        "maxRequestsPerMinute": 100,
        "maxTokensPerRequest": 200000,
        "maxConcurrentRequests": 20
      },
      "performance": {
        "averageLatency": 1200,
        "tokensPerSecond": 75,
        "qualityScore": 95,
        "reliabilityScore": 99,
        "costEfficiency": 95,
        "userSatisfaction": 96,
        "successRate": 99.7,
        "lastUpdated": "2025-01-10T12:00:00Z"
      },
      "specializations": ["balanced performance", "coding", "general tasks"],
      "description": "Best balance of intelligence, speed, and cost",
      "isAvailable": true
    }
  ]
}
```

---

## Analytics API

### GET /api/ai/analytics

Get performance metrics and analytics.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | String | Yes | Analytics type (performance, top-models, cost-analysis) |
| modelId | String | Conditional | Model ID (required for performance, cost-analysis) |
| category | String | Optional | Category for top-models (quality, speed, cost, satisfaction) |

#### Examples

**Get Model Performance:**
```bash
curl -X GET "https://api.example.com/api/ai/analytics?type=performance&modelId=claude-sonnet-4.5" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "performance": {
    "averageLatency": 1200,
    "tokensPerSecond": 75,
    "qualityScore": 95,
    "reliabilityScore": 99,
    "costEfficiency": 95,
    "userSatisfaction": 96,
    "successRate": 99.7,
    "lastUpdated": "2025-01-10T12:00:00Z"
  }
}
```

**Get Top Models by Quality:**
```bash
curl -X GET "https://api.example.com/api/ai/analytics?type=top-models&category=quality" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "topModels": [
    {"modelId": "claude-opus-4.1", "score": 98},
    {"modelId": "claude-opus-4", "score": 97},
    {"modelId": "claude-sonnet-4.5", "score": 95},
    {"modelId": "gpt-4o", "score": 95},
    {"modelId": "o1", "score": 99}
  ]
}
```

### POST /api/ai/analytics

Submit user feedback and analytics data.

#### Request

```bash
curl -X POST https://api.example.com/api/ai/analytics \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "feedback",
    "modelId": "claude-sonnet-4.5",
    "userId": "user-123",
    "requestId": "msg_abc123",
    "rating": 5,
    "qualityScore": 95,
    "speedScore": 90,
    "valueScore": 95,
    "comments": "Excellent response quality and speed"
  }'
```

#### Response

```json
{
  "success": true
}
```

---

## A/B Testing API

### POST /api/ai/test

Create, manage, and record A/B tests.

#### Create Test

```bash
curl -X POST https://api.example.com/api/ai/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "name": "Claude Sonnet vs GPT-4o",
    "modelA": "claude-sonnet-4.5",
    "modelB": "gpt-4o",
    "trafficSplit": 50,
    "metrics": ["latency", "cost", "quality", "userRating"]
  }'
```

**Response:**
```json
{
  "testId": "test-abc123",
  "config": {
    "id": "test-abc123",
    "name": "Claude Sonnet vs GPT-4o",
    "modelA": "claude-sonnet-4.5",
    "modelB": "gpt-4o",
    "trafficSplit": 50,
    "metrics": ["latency", "cost", "quality", "userRating"],
    "startDate": "2025-01-10T12:00:00Z",
    "status": "active"
  }
}
```

#### Record Test Result

```bash
curl -X POST https://api.example.com/api/ai/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "record",
    "testId": "test-abc123",
    "modelId": "claude-sonnet-4.5",
    "response": {
      "responseTime": 1200,
      "finishReason": "stop"
    },
    "cost": 0.00125,
    "userRating": 5
  }'
```

#### Stop Test

```bash
curl -X POST https://api.example.com/api/ai/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "stop",
    "testId": "test-abc123"
  }'
```

**Response:**
```json
{
  "result": {
    "testId": "test-abc123",
    "modelA": {
      "model": "claude-sonnet-4.5",
      "metrics": {
        "latency": 1200,
        "cost": 0.00125,
        "successRate": 99.5,
        "userRating": 4.8,
        "sampleSize": 500
      }
    },
    "modelB": {
      "model": "gpt-4o",
      "metrics": {
        "latency": 1500,
        "cost": 0.00200,
        "successRate": 99.2,
        "userRating": 4.7,
        "sampleSize": 500
      }
    },
    "winner": "claude-sonnet-4.5",
    "significance": 0.96,
    "sampleSize": 1000
  }
}
```

### GET /api/ai/test

Get test results or list active tests.

**Get Specific Test:**
```bash
curl -X GET "https://api.example.com/api/ai/test?testId=test-abc123" \
  -H "Authorization: Bearer <token>"
```

**List Active Tests:**
```bash
curl -X GET "https://api.example.com/api/ai/test" \
  -H "Authorization: Bearer <token>"
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Model unavailable |

### Common Errors

**Invalid Authentication:**
```json
{
  "error": "Invalid token",
  "code": "AUTH_INVALID_TOKEN"
}
```

**Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "window": "60s",
    "retryAfter": 30
  }
}
```

**Model Not Available:**
```json
{
  "error": "Model is not available: grok-2",
  "code": "MODEL_UNAVAILABLE"
}
```

---

## Rate Limiting

API rate limits vary by subscription tier:

| Tier | Requests/Minute | Requests/Day |
|------|----------------|--------------|
| FREE | 20 | 1,000 |
| PRO | 100 | 10,000 |
| ENTERPRISE | 500 | Unlimited |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Chat completion
const response = await client.post('/api/ai/chat', {
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  userId: 'user-123'
});

// Get models
const models = await client.get('/api/ai/models');

// Submit feedback
await client.post('/api/ai/analytics', {
  type: 'feedback',
  modelId: 'claude-sonnet-4.5',
  userId: 'user-123',
  requestId: response.data.id,
  rating: 5
});
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Chat completion
response = requests.post(
    'https://api.example.com/api/ai/chat',
    headers=headers,
    json={
        'messages': [{'role': 'user', 'content': 'Hello!'}],
        'userId': 'user-123'
    }
)

# Get models
models = requests.get(
    'https://api.example.com/api/ai/models',
    headers=headers
)
```

---

## Webhooks

Configure webhooks to receive real-time updates about model performance, costs, and more.

**Webhook Events:**
- `model.performance.updated` - Model performance metrics updated
- `usage.limit.warning` - Approaching usage limits
- `cost.threshold.exceeded` - Cost threshold exceeded
- `test.completed` - A/B test completed

Configure webhooks in your account settings or via API.

---

For more information, visit our [documentation portal](https://docs.example.com).
