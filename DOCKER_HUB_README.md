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

- `latest` - Latest stable release (currently v1.16.1)
- `1.16.1`, `1.16.0`, `1.15.2`, etc. - Specific version releases
- Automated releases via GitHub Actions with semantic versioning

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

- ✅ **Multi-Connection Management** - Unlimited connections with import/export
- ✅ **Real-time Dashboard** - Live monitoring with intelligent alerts
- ✅ **Smart Key Browser** - Tree view with auto separator detection
- ✅ **Advanced Value Editor** - Monaco editor with TTL countdown
- ✅ **CLI Terminal** - Full Redis CLI with command history
- ✅ **System Alerts** - Memory fragmentation, latency, cache monitoring
- ✅ **Auto-Disconnect** - Automatic cleanup of inactive connections
- ✅ **Bulk Operations** - Delete multiple keys and folders
- ✅ **Authentication** - Secure password-based access

## 🔒 Security

- Runs as non-root user (`nextjs:1001`)
- No sensitive data stored in the image
- Supports SSL/TLS connections to Redis
- Environment-based configuration

## 📏 Image Details

- **Base Image**: Node.js 22 Alpine Linux
- **Size**: ~285MB (optimized with multi-stage build)
- **Architecture**: linux/amd64 (ARM64 coming soon)
- **User**: nextjs:1001 (non-root)
- **Exposed Port**: 3000
- **Build Cache**: GitHub Actions cache for faster builds

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
