# NEXIUMS Deployment Guide

This guide covers deploying NEXIUMS to production environments.

## Deployment Options

- Docker Compose (Recommended)
- Kubernetes
- Cloud Platforms (AWS, GCP, Azure)
- Vercel (Frontend only)

## Prerequisites

- Domain name with DNS access
- SSL certificate
- Server with:
  - 4+ CPU cores
  - 8GB+ RAM
  - 50GB+ disk space
  - Docker installed

## Docker Compose Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Create application directory
mkdir -p /opt/nexiums
cd /opt/nexiums
```

### 2. Clone Repository

```bash
git clone https://github.com/SrivantSV/NEXIUMS.git .
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Required environment variables:**

```env
# Database
DATABASE_URL="postgresql://nexiums:CHANGE_THIS_PASSWORD@postgres:5432/nexiums"

# Redis
REDIS_URL="redis://redis:6379"

# JWT
JWT_SECRET="CHANGE_THIS_TO_RANDOM_STRING_MIN_32_CHARS"

# URLs
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"

# Production settings
NODE_ENV="production"
```

### 4. Set Up SSL

```bash
# Install Certbot
sudo apt install certbot -y

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
```

### 5. Deploy

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Run migrations
docker-compose -f docker-compose.prod.yml run backend npx prisma migrate deploy

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### 6. Configure Nginx

```nginx
# /etc/nginx/sites-available/nexiums

upstream backend {
    server localhost:4000;
}

upstream frontend {
    server localhost:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/nexiums /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Kubernetes Deployment

### 1. Create Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: nexiums
```

```yaml
# k8s/postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: nexiums
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: nexiums
        - name: POSTGRES_USER
          value: nexiums
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: nexiums-secrets
              key: database-password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

### 2. Apply Configurations

```bash
kubectl apply -f k8s/
```

## Cloud Platform Deployment

### AWS (ECS + RDS)

1. **Create RDS PostgreSQL instance**
2. **Create ElastiCache Redis cluster**
3. **Build and push Docker images to ECR**
4. **Create ECS task definitions**
5. **Deploy ECS services**
6. **Configure Application Load Balancer**

### Google Cloud (Cloud Run + Cloud SQL)

1. **Create Cloud SQL PostgreSQL instance**
2. **Create Memorystore Redis instance**
3. **Build and push images to GCR**
4. **Deploy Cloud Run services**
5. **Configure Cloud Load Balancer**

### Azure (Container Instances + Azure Database)

1. **Create Azure Database for PostgreSQL**
2. **Create Azure Cache for Redis**
3. **Build and push images to ACR**
4. **Deploy Container Instances**
5. **Configure Application Gateway**

## Monitoring & Logging

### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Log Aggregation

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

## Backup Strategy

### Database Backups

```bash
# Create backup script
cat > /opt/nexiums/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/nexiums/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose exec -T postgres pg_dump -U nexiums nexiums | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Keep only last 7 days
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/nexiums/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/nexiums/backup.sh") | crontab -
```

## Scaling

### Horizontal Scaling

```yaml
# Scale backend service
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale executor service
docker-compose -f docker-compose.prod.yml up -d --scale executor=5
```

### Load Balancing

Use Nginx or HAProxy for load balancing multiple instances.

## Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Frontend health
curl https://yourdomain.com/

# Database health
docker-compose exec postgres pg_isready -U nexiums
```

## Troubleshooting

### Check Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Common Issues

**Database connection failed:**
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check network connectivity

**Execution timeout:**
- Increase MAX_EXECUTION_TIME
- Check executor service logs
- Verify Docker is running properly

**High memory usage:**
- Check running containers
- Monitor with `docker stats`
- Adjust resource limits

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable firewall (UFW)
- [ ] Configure fail2ban
- [ ] Set up SSL/TLS
- [ ] Enable security headers
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Database encryption at rest
- [ ] API rate limiting enabled
- [ ] CORS properly configured

## Performance Optimization

1. **Enable caching:**
   - Redis for session storage
   - CDN for static assets
   - Browser caching headers

2. **Database optimization:**
   - Add indexes
   - Connection pooling
   - Query optimization

3. **Application optimization:**
   - Code splitting (frontend)
   - Lazy loading
   - Compression enabled

## Support

For deployment support:
- Documentation: https://docs.nexiums.dev
- Issues: https://github.com/SrivantSV/NEXIUMS/issues
- Discord: https://discord.gg/nexiums
