# Redis Explorer - Feature Documentation

## 🎯 Core Features

### 1. 🔐 Authentication System
- Password-based authentication
- JWT token management
- Secure session handling
- First-time setup wizard
- Auto-logout on inactivity

### 2. 🔌 Connection Management
- **Multiple Connections**: Manage unlimited Redis connections
- **Connection Testing**: Validate before saving
- **Import/Export**: Backup and restore connections in JSON format
- **Auto-Disconnect**: Automatic cleanup of inactive connections (configurable timeout)
- **SSL/TLS Support**: Secure connections to Redis
- **Connection Health**: Real-time status monitoring

### 3. 📊 Dashboard & Monitoring

#### Critical Metrics
- **Cache Hit Ratio**: Percentage with trend analysis and alerts
- **Memory Usage**: Current usage with fragmentation detection
- **Memory Fragmentation**: Critical alerts when ratio > 1.5
- **CPU Usage**: Real-time processor utilization
- **Latency P50/P95**: Performance percentiles with warnings

#### Performance Indicators
- **Operations/sec**: Real-time throughput monitoring
- **Connected Clients**: Active client connections
- **Evicted Keys**: Keys removed due to memory pressure
- **Expired Keys**: Keys removed due to TTL expiration

#### Activity & Resources
- **Network I/O**: Incoming/outgoing traffic
- **Total Keys**: Key count with TTL statistics
- **Uptime**: Server running time
- **Replication**: Master/slave status

### 4. 🔍 Smart Key Browser

#### Tree View
- **Auto Separator Detection**: Automatically detects `:`, `::`, `/`, `-`, `_`
- **Custom Separators**: Configure your own separator patterns
- **Hierarchical Navigation**: Folder-like structure for keys
- **Expand/Collapse**: Navigate through key namespaces

#### Key Operations
- **Pattern Search**: Redis SCAN with pattern matching
- **Real-time Filtering**: Filter keys as you type
- **Bulk Delete**: Delete multiple keys or entire folders
- **Type Identification**: Color-coded by data type
- **TTL Display**: Live countdown for expiring keys
- **Streaming Load**: Progressive loading for large datasets

### 5. ✏️ Advanced Value Editor

#### Data Type Support
- **String**: Monaco editor with JSON syntax highlighting
- **Hash**: Table view with inline field editing
- **List**: Indexed table with add/remove operations
- **Set**: Member management interface
- **Sorted Set**: Score-based ordering with editing

#### TTL Management
- **Live Countdown**: Real-time TTL display in human-readable format
- **Edit TTL**: Inline editing with validation
- **Persist Key**: Remove TTL to make key permanent
- **Format Display**: Shows days, hours, minutes, seconds

#### Editor Features
- **JSON Formatting**: Automatic JSON beautification
- **Syntax Highlighting**: Color-coded JSON structure
- **Copy to Clipboard**: Quick value copying
- **Validation**: Real-time JSON validation
- **Auto-save**: Automatic value persistence

### 6. 💻 Redis CLI Terminal

#### Command Execution
- **Full Redis CLI**: Support for all Redis commands
- **Command History**: Navigate with arrow keys (↑/↓)
- **Syntax Highlighting**: Color-coded commands and responses
- **Auto-complete**: Command suggestions (planned)
- **Multi-line Support**: Execute complex commands

#### Output Features
- **Execution Time**: Track command performance
- **Error Handling**: Detailed error messages
- **Clear Output**: Clean terminal view
- **Result Formatting**: Structured output display

### 7. 🚨 Intelligent Alerts System

#### Alert Types
- **Memory Fragmentation** (Critical): Ratio > 1.5
  - Recommendation: Consider Redis restart
  - Threshold: 1.5 ratio
  
- **Latency P95** (Critical): > 10ms
  - Recommendation: Performance degraded
  - Threshold: 10ms
  
- **Cache Hit Ratio** (Warning): < 80%
  - Recommendation: Cache could be more effective
  - Threshold: 80%

#### Alert Features
- Real-time monitoring
- Color-coded severity (Critical/Warning)
- Actionable recommendations
- Threshold configuration
- Alert history

## 🔧 Technical Features

### Performance Optimizations
- **Streaming Key Loading**: Progressive data fetching
- **Redis SCAN**: Non-blocking key iteration
- **Connection Pooling**: Efficient resource usage
- **Debounced Search**: Optimized filtering
- **Virtual Scrolling**: Handle large datasets

### Security Features
- **Password Hashing**: bcrypt encryption
- **JWT Tokens**: Secure authentication
- **Non-root Docker**: Security-hardened container
- **SSL/TLS Support**: Encrypted connections
- **Session Management**: Automatic timeout

### Developer Experience
- **TypeScript**: Full type safety
- **Hot Reload**: Fast development with Turbopack
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting
- **Jest**: Comprehensive testing

## 🚀 Recent Additions (v1.16.x)

### v1.16.1
- ✅ Removed ARM64 support temporarily (build optimization)
- ✅ Added GitHub Actions cache for faster builds
- ✅ Updated documentation with real screenshots

### v1.16.0
- ✅ Docker Hub integration in release notes
- ✅ Automated Docker image publishing

### v1.15.x
- ✅ Fixed child folder deletion in TreeView
- ✅ Improved recursive key removal

### v1.14.0 - v1.15.0
- ✅ TTL countdown with live updates
- ✅ Human-readable TTL format
- ✅ Inline TTL editing
- ✅ Folder deletion optimization

### v1.11.0 - v1.13.0
- ✅ System alerts implementation
- ✅ Dashboard refactoring with Context API
- ✅ Download modal improvements
- ✅ Hydration mismatch fixes

### v1.10.x
- ✅ Auto-disconnect for inactive connections
- ✅ Bulk delete functionality
- ✅ Custom separator configuration
- ✅ Separator detection improvements

## 📋 Planned Features

### Short-term
- [ ] Redis Cluster support
- [ ] Advanced search with regex
- [ ] Performance profiling tools
- [ ] Multi-platform Docker (ARM64)

### Medium-term
- [ ] Redis Streams visualization
- [ ] Pub/Sub message monitoring
- [ ] Export/Import keys
- [ ] Backup and restore

### Long-term
- [ ] Multi-language support (i18n)
- [ ] Plugin system
- [ ] Mobile responsive design
- [ ] Dark/Light theme toggle
- [ ] Custom dashboards
- [ ] Alert notifications

## 🎨 UI/UX Features

### Design System
- **Material-UI v6**: Modern component library
- **Dark Theme**: Professional dark interface
- **Responsive Layout**: Adaptive to screen sizes
- **Icon System**: MUI Icons for consistency
- **Color Coding**: Visual data type identification

### User Experience
- **Loading States**: Clear feedback during operations
- **Error Messages**: Helpful error descriptions
- **Confirmation Dialogs**: Prevent accidental deletions
- **Keyboard Shortcuts**: Efficient navigation (planned)
- **Tooltips**: Contextual help throughout

## 📊 Monitoring & Analytics

### Metrics Collection
- Real-time performance data
- Historical trend analysis
- Alert threshold tracking
- Connection statistics
- Operation counters

### Visualization
- **Recharts**: Interactive charts
- **Data Grids**: Sortable, filterable tables
- **Progress Indicators**: Visual feedback
- **Status Badges**: Quick status identification

---

For more information, see the [README.md](../README.md) or visit our [GitHub repository](https://github.com/ruanbarroso/redis-explorer).
