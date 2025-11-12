# Persistent Data Storage

Redis Explorer stores connection configurations in a persistent data directory. This guide explains how to configure persistent storage in different deployment scenarios.

## 📁 Data Directory

By default, Redis Explorer stores connections in:
- **Docker/Kubernetes**: `/app/data` (configurable via `REDIS_EXPLORER_DATA_DIR`)
- **Local Development**: Platform-specific user data directory
  - Windows: `%APPDATA%\redis-explorer`
  - macOS: `~/Library/Application Support/redis-explorer`
  - Linux: `~/.local/share/redis-explorer`

## 🐳 Docker Deployment

### Using Docker Run

**Basic usage with volume:**
```bash
docker run -d \
  --name redis-explorer \
  -p 3000:3000 \
  -v redis-explorer-data:/app/data \
  ruanbarroso/redis-explorer:latest
```

**With custom data directory:**
```bash
docker run -d \
  --name redis-explorer \
  -p 3000:3000 \
  -v /path/on/host:/app/data \
  ruanbarroso/redis-explorer:latest
```

**With encryption key for passwords:**
```bash
docker run -d \
  --name redis-explorer \
  -p 3000:3000 \
  -v redis-explorer-data:/app/data \
  -e REDIS_EXPLORER_KEY=your-secret-key-here \
  ruanbarroso/redis-explorer:latest
```

### Using Docker Compose

```yaml
version: '3.8'

services:
  redis-explorer:
    image: ruanbarroso/redis-explorer:latest
    ports:
      - "3000:3000"
    environment:
      - REDIS_EXPLORER_DATA_DIR=/app/data
      - REDIS_EXPLORER_KEY=your-secret-key-here
    volumes:
      - redis-explorer-data:/app/data

volumes:
  redis-explorer-data:
```

## ☸️ Kubernetes Deployment

### Using PersistentVolumeClaim

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-explorer-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
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
        - name: REDIS_EXPLORER_DATA_DIR
          value: /app/data
        - name: REDIS_EXPLORER_KEY
          valueFrom:
            secretKeyRef:
              name: redis-explorer-secrets
              key: encryption-key
        volumeMounts:
        - name: data
          mountPath: /app/data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: redis-explorer-data
---
apiVersion: v1
kind: Service
metadata:
  name: redis-explorer
spec:
  type: LoadBalancer
  ports:
  - port: 3000
    targetPort: 3000
  selector:
    app: redis-explorer
---
apiVersion: v1
kind: Secret
metadata:
  name: redis-explorer-secrets
type: Opaque
stringData:
  encryption-key: your-secret-key-here
```

### Using ConfigMap for Encryption Key

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-explorer-config
data:
  REDIS_EXPLORER_DATA_DIR: /app/data
---
apiVersion: v1
kind: Secret
metadata:
  name: redis-explorer-secrets
type: Opaque
stringData:
  REDIS_EXPLORER_KEY: your-secret-encryption-key
```

Then reference in your Deployment:

```yaml
envFrom:
- configMapRef:
    name: redis-explorer-config
- secretRef:
    name: redis-explorer-secrets
```

## 🔐 Security Considerations

### Encryption Key

The `REDIS_EXPLORER_KEY` environment variable is used to encrypt Redis passwords before storing them. 

**Important:**
- Always set a custom encryption key in production
- Use Kubernetes Secrets or Docker Secrets to manage the key
- Never commit the key to version control
- Use a strong, random key (minimum 32 characters)

**Generate a secure key:**
```bash
# Linux/macOS
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### File Permissions

The data directory is owned by the `nextjs` user (UID 1001) inside the container. Ensure proper permissions when mounting host directories:

```bash
# Create directory with correct permissions
mkdir -p /path/on/host/redis-explorer-data
chown 1001:1001 /path/on/host/redis-explorer-data
chmod 700 /path/on/host/redis-explorer-data
```

## 📊 Data Structure

The connections are stored in JSON format:

```json
{
  "connections": [
    {
      "id": "unique-id",
      "name": "My Redis",
      "host": "localhost",
      "port": 6379,
      "password": "encrypted-password",
      "database": 0,
      "ssl": false
    }
  ]
}
```

## 🔄 Backup and Restore

### Backup

**Docker:**
```bash
# Copy data from container
docker cp redis-explorer:/app/data ./backup

# Or backup the volume
docker run --rm \
  -v redis-explorer-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/redis-explorer-backup.tar.gz -C /data .
```

**Kubernetes:**
```bash
# Copy from pod
kubectl cp redis-explorer-pod:/app/data ./backup
```

### Restore

**Docker:**
```bash
# Restore from backup
docker run --rm \
  -v redis-explorer-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/redis-explorer-backup.tar.gz -C /data
```

**Kubernetes:**
```bash
# Copy to pod
kubectl cp ./backup redis-explorer-pod:/app/data
```

## 🧪 Testing Persistence

1. **Start Redis Explorer with volume:**
   ```bash
   docker run -d --name redis-explorer -p 3000:3000 -v redis-data:/app/data ruanbarroso/redis-explorer:latest
   ```

2. **Add some connections** via the UI

3. **Stop and remove container:**
   ```bash
   docker stop redis-explorer
   docker rm redis-explorer
   ```

4. **Start new container with same volume:**
   ```bash
   docker run -d --name redis-explorer -p 3000:3000 -v redis-data:/app/data ruanbarroso/redis-explorer:latest
   ```

5. **Verify connections are still there** ✅

## 📝 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_EXPLORER_DATA_DIR` | Data directory path | `/app/data` (Docker)<br>Platform-specific (local) | No |
| `REDIS_EXPLORER_KEY` | Encryption key for passwords | `default-key-change-in-production` | **Yes** (production) |

## 🐛 Troubleshooting

### Connections not persisting

1. **Check volume is mounted:**
   ```bash
   docker inspect redis-explorer | grep -A 10 Mounts
   ```

2. **Verify data directory exists:**
   ```bash
   docker exec redis-explorer ls -la /app/data
   ```

3. **Check file permissions:**
   ```bash
   docker exec redis-explorer ls -la /app/data/connections.json
   ```

### Permission denied errors

```bash
# Fix permissions on host directory
sudo chown -R 1001:1001 /path/to/data
sudo chmod -R 700 /path/to/data
```

### Cannot decrypt passwords

This happens when the `REDIS_EXPLORER_KEY` changes between restarts. Always use the same encryption key.

## 📚 Related Documentation

- [Docker Installation](DOCKER.md)
- [Security Best Practices](SECURITY.md)
- [Server Storage Architecture](SERVER_STORAGE_ARCHITECTURE.md)
