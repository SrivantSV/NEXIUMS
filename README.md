# Nexus AI - Advanced AI Model Integration & Smart Router

Complete AI model integration and smart routing system supporting 25+ AI models with advanced routing intelligence, cost optimization, and performance tracking.

## Features

### 🤖 AI Model Integration (25+ Models)

- **Anthropic** (7 models): Claude Opus 4.1, Claude Opus 4, Claude Sonnet 4.5, Claude Sonnet 4, Claude Sonnet 3.5, Claude Haiku 3.5, Claude Haiku 3
- **OpenAI** (9 models): GPT-4o, GPT-4o Mini, GPT-4 Turbo, o1, o1 Mini, GPT-3.5 Turbo, DALL-E 3, Whisper, TTS-1
- **Google** (5 models): Gemini 2.0 Flash (Experimental), Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 1.0 Pro, Imagen 3
- **DeepSeek** (4 models): DeepSeek V3, DeepSeek Coder, DeepSeek Chat, DeepSeek Math
- **Mistral** (5 models): Mistral Large 2, Mistral Medium, Mistral Small, Codestral, Pixtral
- **Others**: Perplexity Sonar Pro, Perplexity Sonar, Llama 3.3 70B, Llama 3.1 405B, Qwen 2.5, Command R+, Grok 2

### 🎯 Smart Router Engine

Advanced routing with multi-dimensional analysis:
- **Intent Classification** - Automatic detection of task type (coding, reasoning, creative, math, etc.)
- **Complexity Analysis** - Multi-factor complexity scoring
- **Context Analysis** - Conversation history and domain awareness
- **Cost Optimization** - Balance quality vs cost
- **Performance Requirements** - Speed, quality, or cost prioritization

### 📊 Performance Tracking & Analytics

Real-time performance monitoring:
- Latency tracking
- Token usage and cost tracking
- Quality and reliability scores
- User satisfaction metrics
- Success rate monitoring
- Cost efficiency analysis

### 🧪 A/B Testing Framework

Compare model performance with statistical significance:
- Traffic splitting
- Multi-metric comparison
- Statistical significance testing
- Winner determination

### 🤝 Model Ensemble

Combine multiple models for enhanced results:
- **Voting** - Most common response wins
- **Weighted** - Combine based on model weights
- **Best-of** - Select highest quality response
- **Consensus** - Require minimum agreement threshold

### 💰 Cost Optimization

Minimize costs while maintaining quality:
- Quality threshold enforcement
- Cost/quality ratio optimization
- Alternative model suggestions
- Savings calculations

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Required environment variables:
```env
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_AI_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
MISTRAL_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here
COHERE_API_KEY=your_key_here

DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## API Documentation

### 1. Chat Completion

Generate AI responses with automatic or manual model selection.

**Endpoint:** `POST /api/ai/chat`

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Write a function to check if a number is prime" }
  ],
  "model": "claude-sonnet-4.5",  // Optional - auto-selects if not provided
  "stream": false,
  "temperature": 0.7,
  "maxTokens": 2000,
  "userId": "user-123",
  "preferences": {
    "prioritizeCost": true,
    "minQualityScore": 0.8
  }
}
```

**Response:**
```json
{
  "id": "msg_abc123",
  "model": "claude-sonnet-4.5",
  "content": "Here's a function to check if a number is prime...",
  "usage": {
    "promptTokens": 50,
    "completionTokens": 200,
    "totalTokens": 250
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
      "- Average latency: 1200ms"
    ]
  }
}
```

### 2. List Models

Get available AI models with optional filtering.

**Endpoint:** `GET /api/ai/models`

**Query Parameters:**
- `provider` - Filter by provider (anthropic, openai, google, etc.)
- `capability` - Filter by capability (codeGeneration, reasoning, etc.)
- `id` - Get specific model by ID
- `performance` - Include real-time performance data (true/false)

**Examples:**

```bash
# Get all models
GET /api/ai/models

# Get Anthropic models
GET /api/ai/models?provider=anthropic

# Get code generation models
GET /api/ai/models?capability=codeGeneration

# Get specific model with performance data
GET /api/ai/models?id=claude-sonnet-4.5&performance=true
```

**Response:**
```json
{
  "models": [
    {
      "id": "claude-sonnet-4.5",
      "name": "Claude Sonnet 4.5",
      "provider": "anthropic",
      "capabilities": {
        "textGeneration": true,
        "codeGeneration": true,
        "reasoning": true,
        "contextWindow": 200000
      },
      "pricing": {
        "inputTokenCost": 3.0,
        "outputTokenCost": 15.0,
        "currency": "USD"
      },
      "performance": {
        "averageLatency": 1200,
        "tokensPerSecond": 75,
        "qualityScore": 95,
        "costEfficiency": 95
      }
    }
  ]
}
```

### 3. Analytics

Get performance metrics and analytics.

**Endpoint:** `GET /api/ai/analytics`

**Query Parameters:**
- `type` - Analytics type (performance, top-models, cost-analysis)
- `modelId` - Model ID for specific metrics
- `category` - Category for top models (quality, speed, cost, satisfaction)

**Examples:**

```bash
# Get model performance
GET /api/ai/analytics?type=performance&modelId=claude-sonnet-4.5

# Get top models by quality
GET /api/ai/analytics?type=top-models&category=quality

# Get cost analysis
GET /api/ai/analytics?type=cost-analysis&modelId=gpt-4o
```

### 4. Submit Feedback

**Endpoint:** `POST /api/ai/analytics`

**Request:**
```json
{
  "type": "feedback",
  "modelId": "claude-sonnet-4.5",
  "userId": "user-123",
  "requestId": "msg_abc123",
  "rating": 5,
  "qualityScore": 95,
  "speedScore": 90,
  "comments": "Excellent response quality"
}
```

### 5. A/B Testing

Create and manage A/B tests for model comparison.

**Create Test:**
```bash
POST /api/ai/test
{
  "action": "create",
  "name": "Claude vs GPT-4o",
  "modelA": "claude-sonnet-4.5",
  "modelB": "gpt-4o",
  "trafficSplit": 50,
  "metrics": ["latency", "cost", "quality"]
}
```

**Get Test Results:**
```bash
GET /api/ai/test?testId=test-123
```

**Stop Test:**
```bash
POST /api/ai/test
{
  "action": "stop",
  "testId": "test-123"
}
```

## Usage Examples

### Basic Chat

```typescript
import axios from 'axios';

const response = await axios.post('/api/ai/chat', {
  messages: [
    { role: 'user', content: 'Explain quantum computing' }
  ],
  userId: 'user-123'
});

console.log(response.data.content);
```

### With Model Selection

```typescript
const response = await axios.post('/api/ai/chat', {
  messages: [
    { role: 'user', content: 'Write a sorting algorithm' }
  ],
  model: 'deepseek-coder',  // Specialized code model
  userId: 'user-123'
});
```

### With Cost Optimization

```typescript
const response = await axios.post('/api/ai/chat', {
  messages: [
    { role: 'user', content: 'Simple greeting response' }
  ],
  userId: 'user-123',
  preferences: {
    prioritizeCost: true,
    minQualityScore: 0.7
  }
});
```

### Streaming Responses

```typescript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Tell me a story' }],
    stream: true,
    userId: 'user-123'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.delta);
    }
  }
}
```

## Architecture

### System Components

```
src/
├── lib/
│   ├── ai/
│   │   ├── types.ts                 # Core type definitions
│   │   ├── models/
│   │   │   └── registry.ts          # Model registry (25+ models)
│   │   ├── providers/
│   │   │   ├── anthropic.ts         # Anthropic integration
│   │   │   ├── openai.ts            # OpenAI integration
│   │   │   ├── google.ts            # Google AI integration
│   │   │   ├── universal.ts         # Universal provider
│   │   │   └── factory.ts           # Provider factory
│   │   ├── router/
│   │   │   └── smart-router.ts      # Smart routing engine
│   │   ├── analytics/
│   │   │   ├── performance-tracker.ts
│   │   │   └── cost-optimizer.ts
│   │   ├── testing/
│   │   │   └── ab-tester.ts         # A/B testing framework
│   │   └── ensemble/
│   │       └── model-ensemble.ts    # Model ensemble system
│   ├── auth/
│   │   └── middleware.ts            # Authentication
│   └── logging/
│       └── logger.ts                # Logging system
├── app/
│   └── api/
│       └── ai/
│           ├── chat/route.ts        # Chat endpoint
│           ├── models/route.ts      # Models endpoint
│           ├── analytics/route.ts   # Analytics endpoint
│           └── test/route.ts        # A/B testing endpoint
└── prisma/
    └── schema.prisma                # Database schema
```

## Model Selection Algorithm

The smart router uses a sophisticated algorithm:

1. **Intent Classification** (Pattern matching + keyword analysis)
2. **Complexity Scoring** (Multi-dimensional analysis)
3. **Candidate Filtering** (Based on capabilities and constraints)
4. **Multi-criteria Ranking**:
   - Quality Score (40%)
   - Cost Efficiency (20-30%)
   - Speed (20-30%)
   - Intent Match (10%)
   - Complexity Match (10%)
   - Reliability (5%)
   - User Satisfaction (5%)
5. **Final Selection** with confidence scoring

## Performance Metrics

All models are tracked for:
- Average latency (ms)
- Tokens per second
- Quality score (1-100)
- Reliability score (1-100)
- Cost efficiency (quality/cost ratio)
- User satisfaction (from feedback)
- Success rate (%)

## Cost Tracking

Every request tracks:
- Input tokens and cost
- Output tokens and cost
- Total cost in USD
- Cost per quality point
- Potential savings vs baseline

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Documentation: [Full Docs](https://docs.example.com)
- Email: support@example.com
