# Redis Explorer

[![CI/CD Pipeline](https://github.com/ruanbarroso/redis-explorer/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/ruanbarroso/redis-explorer/actions)
[![Docker Pulls](https://img.shields.io/docker/pulls/ruanbarroso/redis-explorer)](https://hub.docker.com/r/ruanbarroso/redis-explorer)
[![Docker Image Size](https://img.shields.io/docker/image-size/ruanbarroso/redis-explorer/latest)](https://hub.docker.com/r/ruanbarroso/redis-explorer)
[![GitHub Stars](https://img.shields.io/github/stars/ruanbarroso/redis-explorer)](https://github.com/ruanbarroso/redis-explorer/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Redis](https://img.shields.io/badge/Redis-Compatible-red)](https://redis.io/)

A modern, web-based Redis GUI explorer built with Next.js 15 and React 19. This tool provides a comprehensive interface for managing Redis databases, similar to RedisInsight but with a focus on performance and user experience.

> 🎉 **Now Open Source!** We're excited to share Redis Explorer with the community. Contributions are welcome!

## 📸 Screenshots

### 🔐 Authentication
![Login Screen](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/login.png)
*Secure authentication with password protection*

### 🔌 Connection Management
![Connection Manager](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/connections.png)
*Manage multiple Redis connections with import/export functionality*

### 📊 Dashboard Overview
![Dashboard](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/dashboard.png)
*Real-time Redis monitoring with critical metrics and performance indicators*

### 🚨 System Alerts
![Alerts](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/alerts.png)
*Intelligent alerts for memory fragmentation, latency, and cache performance*

### 🔍 Key Browser
![Key Browser](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/keys-browser.png)
*Smart tree view with automatic separator detection and hierarchical navigation*

### ✏️ Value Editor
![Value Editor](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/value-editor.png)
*Monaco editor with JSON syntax highlighting and TTL countdown*

### 💻 Redis CLI
![CLI Terminal](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/cli.png)
*Integrated Redis CLI with command history and syntax highlighting*

### ⚙️ Configuration Management
![Configuration - General](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/config-1.png)
*General configuration settings and preferences*

![Configuration - Advanced](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/config-2.png)
*Advanced configuration options and customization*

![Configuration - Security](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/config-3.png)
*Security settings and authentication management*

### 📈 Real-time Monitoring
![Monitor - Performance](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/monitor-1.png)
*Real-time performance monitoring with detailed metrics*

![Monitor - Memory](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/monitor-2.png)
*Memory usage analysis and fragmentation tracking*

![Monitor - Operations](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/monitor-3.png)
*Operations monitoring with command statistics*

### 🐌 Slow Log Analysis
![Slow Log](https://raw.githubusercontent.com/ruanbarroso/redis-explorer/main/docs/screenshots/slow-log.png)
*Detailed slow query log with execution time analysis*

## 🚀 Quick Start

**Try it now with Docker:**
```bash
docker run -d -p 3000:3000 ruanbarroso/redis-explorer:latest
```
Then open http://localhost:3000 in your browser!

> 🔒 **First Access**: Create your admin password on first login

## 🆚 Why Redis Explorer?

| Feature | Redis Explorer | RedisInsight | redis-cli |
|---------|----------------|--------------|-----------|
| **Web Interface** | ✅ Modern React UI | ✅ Desktop App | ❌ CLI Only |
| **Real-time Monitoring** | ✅ Live Dashboard | ✅ Basic | ❌ Manual |
| **Docker Ready** | ✅ Single Command | ⚠️ Complex Setup | ✅ Available |
| **Open Source** | ✅ MIT License | ✅ SSPL | ✅ BSD |
| **Performance** | ✅ Optimized | ⚠️ Heavy | ✅ Fast |
| **Multi-Connection** | ✅ Unlimited | ✅ Limited | ❌ One at time |
| **Tree View** | ✅ Smart Hierarchy | ✅ Basic | ❌ No |
| **Value Editing** | ✅ Syntax Highlight | ✅ Basic | ⚠️ Limited |

## Features

### 🔌 Connection Management
- Multiple Redis connection support with unlimited connections
- SSL/TLS secure connections
- Connection testing and validation before saving
- Persistent connection storage (server-side)
- Import/Export connections (JSON format)
- Auto-disconnect for inactive connections
- Connection health monitoring

### 🔍 Key Browser
- Smart tree view with automatic separator detection (`:`, `::`, `/`, `-`, `_`)
- Advanced key search with pattern matching (Redis SCAN)
- Real-time key filtering and navigation
- Key type identification with color coding
- TTL countdown with live updates
- Bulk delete operations with folder support
- Streaming key loading for large datasets
- Custom separator configuration

### ✏️ Value Editor
- Support for all Redis data types:
  - **Strings**: Monaco editor with JSON syntax highlighting
  - **Hashes**: Table view with inline editing and field management
  - **Lists**: Indexed table view with add/remove operations
  - **Sets**: Member management with add/remove
  - **Sorted Sets**: Score-based ordering with inline editing
- Advanced TTL management:
  - Live countdown display
  - Human-readable format (days, hours, minutes)
  - Edit TTL inline with validation
  - Persist key (remove TTL)
- Real-time value updates
- JSON formatting and validation
- Copy to clipboard functionality

### 📊 Dashboard & Monitoring
- **Critical Metrics** (with intelligent alerts):
  - Cache Hit Ratio with trend analysis
  - Memory Usage and Fragmentation
  - Latency P50 and P95 percentiles
  - CPU Usage monitoring
- **Performance Indicators**:
  - Operations per second (real-time)
  - Connected clients tracking
  - Evicted/Expired keys statistics
- **Activity & Resources**:
  - Network I/O monitoring
  - Total keys count with TTL info
  - Server uptime
  - Replication status
- Auto-refresh with configurable intervals
- Color-coded alerts (Critical, Warning)
- Last update timestamp

### 💻 CLI Terminal
- Full Redis CLI integration with all commands
- Command history with arrow key navigation (↑/↓)
- Syntax highlighting for commands and responses
- Auto-complete suggestions
- Execution time tracking
- Error handling with detailed messages
- Clear output functionality
- Support for multi-line commands

### 🚨 Intelligent Alerts System
- **Memory Fragmentation**: Critical alerts when > 1.5 ratio
- **Latency Monitoring**: P95 latency warnings
- **Cache Performance**: Low hit ratio detection
- Real-time threshold monitoring
- Color-coded severity levels
- Actionable recommendations

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.0 with App Router and Turbopack
- **UI Library**: React 19.0.0 with React DOM 19.0.0
- **Language**: TypeScript 5.6
- **UI Components**: Material-UI (MUI) v6 with Data Grid Premium
- **State Management**: Redux Toolkit 2.3
- **Redis Client**: ioredis 5.4 (Node.js) + redis 4.7 (compatibility)
- **Code Editor**: Monaco Editor 0.52 with JSON syntax highlighting
- **Charts**: Recharts 2.13 for performance visualization
- **Styling**: Emotion 11 (CSS-in-JS)
- **Authentication**: JWT with bcryptjs
- **Real-time**: Socket.io 4.8 for live updates
- **Testing**: Jest 29 with React Testing Library
- **CI/CD**: GitHub Actions with Semantic Release
- **Container**: Docker with multi-stage builds

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd redis-explorer
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your default Redis connection:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

4. **Start the development server**
   ```bash
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Docker Installation

### 🐳 Using Docker Hub (Recommended)

**Quick Start:**
```bash
# Run Redis Explorer with Docker Hub image
docker run -d --name redis-explorer -p 3000:3000 ruanbarroso/redis-explorer:latest

# Or with specific version
docker run -d --name redis-explorer -p 3000:3000 ruanbarroso/redis-explorer:1.16.1
```

**Platform Support:**
- ✅ linux/amd64
- ⚠️ linux/arm64 (coming soon)

**With Redis server:**
```bash
# Start Redis server
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Start Redis Explorer (linked to Redis)
docker run -d --name redis-explorer -p 3000:3000 --link redis:redis ruanbarroso/redis-explorer:latest
```

### Using Docker Compose

1. **Clone the repository**
   ```bash
   git clone https://github.com/ruanbarroso/redis-explorer.git
   cd redis-explorer
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - Redis Explorer on [http://localhost:3000](http://localhost:3000)
   - Redis server on port 6379
   - Redis with auth on port 6380 (password: `mypassword`)

### Build from Source

1. **Clone and build**
   ```bash
   git clone https://github.com/ruanbarroso/redis-explorer.git
   cd redis-explorer
   docker build -t redis-explorer .
   docker run -d --name redis-explorer -p 3000:3000 redis-explorer
   ```

## Usage

### Adding a Connection

1. Click on "Connections" in the sidebar
2. Click "Add Connection"
3. Fill in your Redis connection details:
   - **Name**: A friendly name for your connection
   - **Host**: Redis server hostname (default: localhost)
   - **Port**: Redis server port (default: 6379)
   - **Password**: Redis password (if required)
   - **Database**: Database number (default: 0)
   - **SSL**: Enable for secure connections
4. Test the connection before saving
5. Click "Add" to save the connection

### Browsing Keys

1. Select "Keys Browser" from the sidebar
2. Use the search box to filter keys with patterns:
   - `*` - All keys
   - `user:*` - Keys starting with "user:"
   - `*session*` - Keys containing "session"
3. Click on any key to view its value
4. Use the editor to modify values

### Monitoring Performance

1. Go to "Dashboard" in the sidebar
2. View real-time metrics including:
   - Memory usage
   - Operations per second
   - Connected clients
   - Cache hit rate
3. Monitor slow queries in the slow log table
4. Toggle auto-refresh for real-time updates

### Using the CLI

1. Select "CLI" from the sidebar
2. Enter Redis commands in the terminal
3. Use arrow keys (↑/↓) to navigate command history
4. View command execution times and results

## Development

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/         # React components
│   ├── ConnectionManager.tsx
│   ├── KeysBrowser.tsx
│   ├── ValueEditor.tsx
│   ├── Dashboard.tsx
│   └── Terminal.tsx
├── services/           # Business logic
│   └── redis.ts        # Redis service
├── store/              # Redux store
│   ├── index.ts
│   └── slices/
├── types/              # TypeScript types
│   └── redis.ts
└── theme/              # MUI theme
    └── index.ts
```

### Available Scripts

- `yarn dev` - Start development server with Turbopack
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Fix ESLint issues
- `yarn format` - Format code with Prettier
- `yarn test` - Run tests
- `yarn type-check` - Run TypeScript type checking

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and type checking
6. Submit a pull request

## Security Considerations

- Never store Redis passwords in plain text
- Use environment variables for sensitive configuration
- Enable SSL/TLS for production connections
- Implement proper authentication and authorization
- Regularly update dependencies

## Performance Tips

- Use connection pooling for high-traffic scenarios
- Implement key pagination for large datasets
- Use Redis pipelining for bulk operations
- Monitor memory usage and set appropriate limits
- Use appropriate data structures for your use case

## Troubleshooting

### Connection Issues
- Verify Redis server is running
- Check firewall settings
- Ensure correct host/port configuration
- Validate authentication credentials

### Performance Issues
- Monitor Redis memory usage
- Check for slow queries
- Optimize key patterns
- Consider Redis clustering for scale

### UI Issues
- Clear browser cache
- Check browser console for errors
- Ensure JavaScript is enabled
- Try a different browser

## 🗺️ Roadmap

### ✅ Completed
- [x] Multi-connection management with import/export
- [x] Real-time dashboard with intelligent alerts
- [x] Key browser with smart tree view
- [x] Value editor with Monaco and TTL countdown
- [x] CLI terminal integration
- [x] Docker containerization with automated builds
- [x] CI/CD pipeline with Semantic Release
- [x] Auto-disconnect for inactive connections
- [x] Bulk delete operations
- [x] Automatic separator detection
- [x] System alerts and monitoring
- [x] Authentication and security

### 🚧 In Progress
- [ ] Redis Cluster support
- [ ] Advanced search filters with regex
- [ ] Performance profiling and optimization
- [ ] Multi-platform Docker builds (ARM64)

### 📋 Planned
- [ ] Redis Streams visualization
- [ ] Pub/Sub message monitoring
- [ ] Multi-language support (i18n)
- [ ] Plugin system
- [ ] Mobile responsive design
- [ ] Dark/Light theme toggle

## 📊 Project Status

- **Development Status**: ✅ Active Development
- **Stability**: 🟢 Stable (Production Ready)
- **Current Version**: v1.16.1
- **Last Updated**: October 25, 2025
- **Maintainers**: 1 active maintainer
- **Contributors**: Open for contributions!
- **Docker Pulls**: Available on Docker Hub
- **CI/CD**: Automated releases with semantic versioning

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)
- UI components from [Material-UI](https://mui.com/)
- Redis client powered by [ioredis](https://github.com/luin/ioredis)

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/ruanbarroso/redis-explorer/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/ruanbarroso/redis-explorer/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/ruanbarroso/redis-explorer/wiki)
- 🐳 **Docker**: [Docker Hub](https://hub.docker.com/r/ruanbarroso/redis-explorer)
