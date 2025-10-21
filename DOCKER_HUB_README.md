# Redis Explorer - Docker Image

A modern, web-based Redis GUI explorer built with Next.js 15 and React 19. This Docker image provides a comprehensive interface for managing Redis databases with a focus on performance and user experience.

## 🚀 Quick Start

```bash
# Run Redis Explorer
docker run -d --name redis-explorer -p 3000:3000 ruanbarroso/redis-explorer:latest

# Access the application
open http://localhost:3000
```

## 🔗 Connect to Redis

### Local Redis
```bash
# Start Redis server
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run Redis Explorer with link
docker run -d --name redis-explorer -p 3000:3000 --link redis:redis ruanbarroso/redis-explorer:latest
```

### External Redis
Connect to any Redis instance by configuring the connection in the web interface:
- **Host**: Your Redis server IP/hostname
- **Port**: Redis port (default: 6379)
- **Password**: If authentication is enabled
- **Database**: Database number (default: 0)

## 🏷️ Available Tags

- `latest` - Latest stable release
- `v1.0.0`, `v1.1.0`, etc. - Specific version releases
- `main-<sha>` - Development builds from main branch

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port for the web server |
| `NODE_ENV` | `production` | Node.js environment |

### Example with Environment Variables
```bash
docker run -d \
  --name redis-explorer \
  -p 8080:8080 \
  -e PORT=8080 \
  ruanbarroso/redis-explorer:latest
```

## 🐳 Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  redis-explorer:
    image: ruanbarroso/redis-explorer:latest
    ports:
      - "3000:3000"
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

Run with: `docker-compose up -d`

## 📊 Features

- ✅ **Multi-Connection Management** - Connect to multiple Redis instances
- ✅ **Real-time Dashboard** - Live monitoring with performance metrics
- ✅ **Key Browser** - Tree view with smart hierarchy and search
- ✅ **Value Editor** - Syntax highlighting for different data types
- ✅ **CLI Terminal** - Execute Redis commands directly
- ✅ **Import/Export** - Backup and restore functionality
- ✅ **Performance Monitoring** - Track slow queries and statistics

## 🔒 Security

- Runs as non-root user (`nextjs:1001`)
- No sensitive data stored in the image
- Supports SSL/TLS connections to Redis
- Environment-based configuration

## 📏 Image Details

- **Base Image**: Node.js 20 Alpine Linux
- **Size**: ~285MB (optimized)
- **Architecture**: linux/amd64
- **User**: nextjs (non-root)
- **Exposed Port**: 3000

## 🆘 Troubleshooting

### Common Issues

1. **Cannot connect to Redis**
   - Ensure Redis is running and accessible
   - Check network connectivity between containers
   - Verify Redis authentication settings

2. **Port already in use**
   ```bash
   # Use different port
   docker run -d -p 3001:3000 ruanbarroso/redis-explorer:latest
   ```

3. **Permission issues**
   ```bash
   # Check container logs
   docker logs redis-explorer
   ```

## 📚 Documentation

- **GitHub**: https://github.com/ruanbarroso/redis-explorer
- **Issues**: https://github.com/ruanbarroso/redis-explorer/issues
- **Wiki**: https://github.com/ruanbarroso/redis-explorer/wiki

## 📄 License

MIT License - see [LICENSE](https://github.com/ruanbarroso/redis-explorer/blob/main/LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/ruanbarroso/redis-explorer/blob/main/CONTRIBUTING.md).

---

⭐ **Star us on GitHub**: https://github.com/ruanbarroso/redis-explorer
