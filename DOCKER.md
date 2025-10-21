# 🐳 Docker Guide for Redis Explorer

## Quick Start

### Pull and Run from Docker Hub

```bash
# Latest version
docker pull ruanbarroso/redis-explorer:latest
docker run -d --name redis-explorer -p 3000:3000 ruanbarroso/redis-explorer:latest

# Specific version
docker pull ruanbarroso/redis-explorer:v1.0.0
docker run -d --name redis-explorer -p 3000:3000 ruanbarroso/redis-explorer:v1.0.0
```

Access Redis Explorer at: http://localhost:3000

## Available Tags

- `latest` - Latest stable release
- `v1.0.0`, `v1.1.0`, etc. - Specific version releases
- `main-<sha>` - Development builds from main branch

## Multi-Platform Support

Redis Explorer Docker images support multiple architectures:
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit, Apple Silicon, Raspberry Pi)

Docker will automatically pull the correct architecture for your system.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port for the web server |
| `NODE_ENV` | `production` | Node.js environment |
| `REDIS_URL` | - | Default Redis connection URL |
| `REDIS_HOST` | `localhost` | Default Redis host |
| `REDIS_PORT` | `6379` | Default Redis port |
| `REDIS_PASSWORD` | - | Default Redis password |

## Docker Compose Examples

### Basic Setup

```yaml
version: '3.8'
services:
  redis-explorer:
    image: ruanbarroso/redis-explorer:latest
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### With Redis Authentication

```yaml
version: '3.8'
services:
  redis-explorer:
    image: ruanbarroso/redis-explorer:latest
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PASSWORD=mypassword
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass mypassword
```

### Production Setup with Persistence

```yaml
version: '3.8'
services:
  redis-explorer:
    image: ruanbarroso/redis-explorer:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis_data:
```

## Kubernetes Deployment

### Basic Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-explorer
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis-explorer
  template:
    metadata:
      labels:
        app: redis-explorer
    spec:
      containers:
      - name: redis-explorer
        image: ruanbarroso/redis-explorer:latest
        ports:
        - containerPort: 3000
        env:
        - name: REDIS_HOST
          value: "redis-service"
---
apiVersion: v1
kind: Service
metadata:
  name: redis-explorer-service
spec:
  selector:
    app: redis-explorer
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Health Checks

The Docker image includes a health check endpoint:

```bash
# Check if the container is healthy
docker exec redis-explorer curl -f http://localhost:3000/api/health || exit 1
```

## Security Considerations

### Production Deployment

1. **Use specific version tags** instead of `latest` in production
2. **Set strong passwords** for Redis instances
3. **Use SSL/TLS** for Redis connections when possible
4. **Limit network access** using Docker networks
5. **Run as non-root user** (already configured in the image)

### Example Secure Setup

```yaml
version: '3.8'
services:
  redis-explorer:
    image: ruanbarroso/redis-explorer:v1.0.0  # Specific version
    ports:
      - "127.0.0.1:3000:3000"  # Bind to localhost only
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD}  # From environment
    networks:
      - redis-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - redis-network
    restart: unless-stopped

volumes:
  redis_data:

networks:
  redis-network:
    driver: bridge
```

## Troubleshooting

### Common Issues

1. **Connection refused to Redis**
   ```bash
   # Check if Redis is running
   docker ps | grep redis
   
   # Check Redis logs
   docker logs redis-container-name
   ```

2. **Permission denied errors**
   ```bash
   # The image runs as non-root user (nextjs:1001)
   # Ensure volumes have correct permissions
   docker exec redis-explorer ls -la /app
   ```

3. **Memory issues**
   ```bash
   # Monitor container memory usage
   docker stats redis-explorer
   
   # Set memory limits
   docker run -m 512m ruanbarroso/redis-explorer:latest
   ```

### Logs and Debugging

```bash
# View application logs
docker logs redis-explorer

# Follow logs in real-time
docker logs -f redis-explorer

# Execute commands inside container
docker exec -it redis-explorer sh

# Check container health
docker inspect redis-explorer | grep Health -A 10
```

## Building Custom Images

If you need to customize the image:

```dockerfile
FROM ruanbarroso/redis-explorer:latest

# Add custom configuration
COPY custom-config.json /app/config/

# Install additional tools
USER root
RUN apk add --no-cache curl
USER nextjs

# Custom startup script
COPY startup.sh /app/
ENTRYPOINT ["/app/startup.sh"]
```

## Support

- **GitHub Issues**: https://github.com/ruanbarroso/redis-explorer/issues
- **Docker Hub**: https://hub.docker.com/r/ruanbarroso/redis-explorer
- **Documentation**: https://github.com/ruanbarroso/redis-explorer#readme
