# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial open source release
- Comprehensive dashboard with 25+ Redis metrics
- Server-side connection storage with encryption
- Enhanced UI with symmetric card layouts
- Performance optimizations for large datasets

### Changed
- Migrated from localStorage to server-side connection storage
- Improved dashboard layout and visual consistency
- Enhanced error handling and user feedback

### Fixed
- Connection persistence issues in development mode
- Dashboard scroll functionality
- Memory leak in real-time metrics updates

## [1.0.0] - 2025-01-21

### Added
- **Connection Management**
  - Multiple Redis connection support
  - SSL/TLS connection support
  - Connection testing and validation
  - Import/export connection configurations
  - Server-side encrypted storage

- **Key Browser**
  - Advanced pattern-based key search
  - Real-time key filtering
  - Support for all Redis data types
  - TTL and size information display
  - Bulk operations support

- **Value Editor**
  - Monaco editor integration for strings
  - Table-based editing for hashes and lists
  - Set and sorted set management
  - JSON syntax highlighting
  - TTL management

- **Dashboard & Monitoring**
  - Real-time performance metrics
  - Memory usage tracking with fragmentation ratio
  - Operations per second monitoring
  - Cache hit rate analysis with visual indicators
  - Slow query log with execution times
  - Network I/O statistics
  - Client connection monitoring
  - Keyspace analysis
  - Replication and sync statistics
  - Pub/Sub monitoring
  - Interactive charts and graphs
  - Auto-refresh capabilities

- **CLI Terminal**
  - Full Redis CLI integration
  - Command history with arrow key navigation
  - Syntax highlighting for Redis commands
  - Command categorization and help
  - Execution time tracking
  - Error handling and display

- **Technical Features**
  - Next.js 15 with App Router
  - React 19 with modern hooks
  - TypeScript for type safety
  - Material-UI v6 for consistent design
  - Redux Toolkit for state management
  - ioredis for Redis connectivity
  - Recharts for data visualization
  - Monaco Editor for code editing
  - Responsive design for all screen sizes

### Security
- Password encryption for stored connections
- Secure environment variable handling
- Input validation and sanitization
- XSS protection
- CSRF protection

### Performance
- Connection pooling
- Lazy loading of components
- Optimized re-renders with React.memo
- Efficient state management
- Debounced search inputs
- Virtualized lists for large datasets

## [0.1.0] - 2024-12-01

### Added
- Initial project setup
- Basic Redis connection functionality
- Simple key browsing
- Basic value editing
- Minimal dashboard

---

## Release Notes

### Version 1.0.0 Highlights

This is the first stable release of Redis Explorer, featuring a complete rewrite with modern technologies and a comprehensive feature set that rivals commercial Redis GUI tools.

**Key Improvements:**
- 🚀 **Performance**: 3x faster key loading with virtualization
- 🎨 **UI/UX**: Complete Material-UI redesign with dark theme
- 📊 **Monitoring**: 25+ real-time metrics and charts
- 🔒 **Security**: Encrypted connection storage and secure defaults
- 🛠 **Developer Experience**: Full TypeScript coverage and modern tooling

**Migration Guide:**
- Existing connections will be automatically migrated to the new storage system
- No breaking changes for end users
- Developers should update to Node.js 18+ and yarn for optimal experience

**Known Issues:**
- Large datasets (>100k keys) may experience slower initial load
- WebSocket connections not yet supported for real-time updates
- Mobile responsiveness needs improvement for complex views

**Roadmap:**
- Real-time collaboration features
- Plugin system for custom extensions
- Advanced query builder
- Redis Cluster support
- Docker deployment options
