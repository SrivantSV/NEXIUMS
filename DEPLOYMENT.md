# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Redis instance (optional, for caching)
- API keys for AI providers

## Environment Variables

Create a `.env` file with the following variables:

```env
# AI Provider API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIza...
DEEPSEEK_API_KEY=...
MISTRAL_API_KEY=...
PERPLEXITY_API_KEY=...
COHERE_API_KEY=...
XAI_API_KEY=...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nexus_ai

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/nexus-ai.log
```

## Database Setup

### 1. Create Database

```bash
createdb nexus_ai
```

### 2. Run Migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### 3. Seed Database (Optional)

```bash
npx prisma db seed
```

## Build for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configure environment variables in Vercel dashboard

### Option 2: Docker

1. Build Docker image:
```bash
docker build -t nexus-ai .
```

2. Run container:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e ANTHROPIC_API_KEY="..." \
  nexus-ai
```

### Option 3: Traditional Server

1. Install dependencies:
```bash
npm install --production
```

2. Build application:
```bash
npm run build
```

3. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "nexus-ai" -- start
pm2 save
pm2 startup
```

## Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/nexus_ai
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=nexus_ai
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Deploy with:
```bash
docker-compose up -d
```

## Performance Optimization

### 1. Enable Caching

Configure Redis for caching model responses and routing decisions:

```typescript
// In your .env
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
```

### 2. Database Optimization

- Create indexes on frequently queried fields
- Use connection pooling
- Configure read replicas for analytics

### 3. CDN Configuration

Use a CDN for static assets and API responses:

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
    ];
  },
};
```

## Monitoring

### 1. Application Monitoring

Install monitoring tools:

```bash
npm install @vercel/analytics
npm install @sentry/nextjs
```

### 2. Performance Monitoring

Configure performance monitoring:

```typescript
// pages/_app.tsx
import { Analytics } from '@vercel/analytics/react';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

### 3. Error Tracking

Configure Sentry:

```bash
npx @sentry/wizard@latest -i nextjs
```

## Health Checks

Add health check endpoint:

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

## Backup Strategy

### Database Backups

```bash
# Automated daily backups
pg_dump nexus_ai > backup_$(date +%Y%m%d).sql
```

### Backup to S3

```bash
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-bucket/backups/
```

## Scaling

### Horizontal Scaling

Deploy multiple instances behind a load balancer:

```nginx
upstream nexus_ai {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://nexus_ai;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Database Scaling

- Read replicas for analytics queries
- Connection pooling with PgBouncer
- Sharding for high-volume usage data

## Security Checklist

- [ ] All API keys stored securely in environment variables
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Rate limiting configured
- [ ] CORS policies set appropriately
- [ ] SQL injection protection enabled
- [ ] Input validation on all endpoints
- [ ] Authentication required for all routes
- [ ] Database credentials rotated regularly
- [ ] Security headers configured
- [ ] API versioning implemented

## Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check database is running
pg_isready -h localhost -p 5432

# Test connection
psql postgresql://user:password@localhost:5432/nexus_ai
```

**API Keys Not Working:**
```bash
# Verify environment variables are loaded
node -e "console.log(process.env.ANTHROPIC_API_KEY)"
```

**High Memory Usage:**
```bash
# Monitor memory
pm2 monit

# Adjust Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## Support

For deployment issues:
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: https://docs.example.com
- Email: support@example.com
