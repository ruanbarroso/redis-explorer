## [1.23.3](https://github.com/ruanbarroso/redis-explorer/compare/v1.23.2...v1.23.3) (2025-11-07)

### 🐛 Bug Fixes

* aumentar timeout do yarn para builds arm64 emulados ([f856ab6](https://github.com/ruanbarroso/redis-explorer/commit/f856ab6c8bf9e7cd5c09cf44703e650e12f18dbb))

## [1.23.2](https://github.com/ruanbarroso/redis-explorer/compare/v1.23.1...v1.23.2) (2025-11-07)

### 🐛 Bug Fixes

* melhorar detecção de separador de chaves Redis ([8513728](https://github.com/ruanbarroso/redis-explorer/commit/8513728cb35a301d796813155bc28c345d0223aa))

## [1.23.1](https://github.com/ruanbarroso/redis-explorer/compare/v1.23.0...v1.23.1) (2025-10-27)

### ♻️ Code Refactoring

* remove endpoint call from ConnectionSwitcher component ([99d63e2](https://github.com/ruanbarroso/redis-explorer/commit/99d63e23cb833dacfb71c875445b3518f541c6af))

## [1.23.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.22.0...v1.23.0) (2025-10-27)

### 🚀 Features

* implement connection selector component ([21c866d](https://github.com/ruanbarroso/redis-explorer/commit/21c866d215264c7bd2110212bf7fe8a04972503d))
* melhora gerenciamento de estado e telas de carregamento ([c5dd930](https://github.com/ruanbarroso/redis-explorer/commit/c5dd9303f25226b708a64f0200d871caaeefd415))

### 🐛 Bug Fixes

* improve connection management and routing ([d9fd2e2](https://github.com/ruanbarroso/redis-explorer/commit/d9fd2e2741bb90991e45e6a61d87903856830440))

### ♻️ Code Refactoring

* atualiza rotas e adiciona autenticação ([6b5b2cd](https://github.com/ruanbarroso/redis-explorer/commit/6b5b2cdfbe3f6fd2784dd0e948e4b2969bb9ac1a))
* simplifica redirecionamento para /connections ([a6ab0de](https://github.com/ruanbarroso/redis-explorer/commit/a6ab0de72bfcc900732ce41c2c3b4b93e42f76e4))

## [1.22.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.21.1...v1.22.0) (2025-10-26)

### 🚀 Features

* alinhar thresholds e alertas do painel ([abf4217](https://github.com/ruanbarroso/redis-explorer/commit/abf4217b7d89e293562dc99f0f52fc42215d745a))

## [1.21.1](https://github.com/ruanbarroso/redis-explorer/compare/v1.21.0...v1.21.1) (2025-10-26)

### 🐛 Bug Fixes

* handle missing maintenance commands gracefully ([24d498d](https://github.com/ruanbarroso/redis-explorer/commit/24d498da82fe0618af110f9654b505bdc6f21fdd))

## [1.21.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.20.0...v1.21.0) (2025-10-26)

### 🚀 Features

* add settings page and improve dashboard ([a3c9460](https://github.com/ruanbarroso/redis-explorer/commit/a3c94608c85d1ce542df2a6601b5a323b692301d))

### ♻️ Code Refactoring

* remove page titles from Dashboard, Alerts and CLI ([e2d659c](https://github.com/ruanbarroso/redis-explorer/commit/e2d659ca03c8415b32f0169f24963894468a4715))

## [1.20.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.19.0...v1.20.0) (2025-10-26)

### 🚀 Features

* implement Monitor and SlowLog features with pagination ([546a50c](https://github.com/ruanbarroso/redis-explorer/commit/546a50ce6d9faf875b6e28e14dd0fdd9533d923d))

## [1.19.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.18.1...v1.19.0) (2025-10-26)

### 🚀 Features

* melhorias no editor de valores ([79f9f58](https://github.com/ruanbarroso/redis-explorer/commit/79f9f582d2826d6b124990b9f379a460c7cb59e2))

### ♻️ Code Refactoring

* renomear AlertsContext para MetricsContext ([db686f2](https://github.com/ruanbarroso/redis-explorer/commit/db686f2fcaac7c3d1d9d0b5f761e8110f0be3494))

## [1.18.1](https://github.com/ruanbarroso/redis-explorer/compare/v1.18.0...v1.18.1) (2025-10-26)

### 🐛 Bug Fixes

* manter conexão atual ao falhar troca de conexão ([c65e2e7](https://github.com/ruanbarroso/redis-explorer/commit/c65e2e77ff45be3856208d6cd30290d8180398d7))

## [1.18.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.17.0...v1.18.0) (2025-10-26)

### 🚀 Features

* persistir estado de navegação e melhorar UX ([7db51e5](https://github.com/ruanbarroso/redis-explorer/commit/7db51e54f0d1483c2f3b716fef9d9a1d8235cef7))

## [1.17.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.16.1...v1.17.0) (2025-10-26)

### 🚀 Features

* melhorias de UX e tratamento de erros ([6bd51ef](https://github.com/ruanbarroso/redis-explorer/commit/6bd51ef7f677a77632d1040dc61d56564cece5d7))

## [1.16.1](https://github.com/ruanbarroso/redis-explorer/compare/v1.16.0...v1.16.1) (2025-10-25)

### 🐛 Bug Fixes

* remove ARM64 support e adiciona cache para acelerar build Docker ([1df0c08](https://github.com/ruanbarroso/redis-explorer/commit/1df0c08fe2ad7ddbe2b0a5852766f7d37f0a1507))

## [1.16.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.15.2...v1.16.0) (2025-10-25)

### 🚀 Features

* adiciona informações do Docker Hub nas releases e corrige publicação automática ([a525151](https://github.com/ruanbarroso/redis-explorer/commit/a52515165bc08a254037bbd3203907c4505a0ee5))

## [1.15.2](https://github.com/ruanbarroso/redis-explorer/compare/v1.15.1...v1.15.2) (2025-10-25)

### 🐛 Bug Fixes

* corrige geração de release notes no GitHub ([057ec97](https://github.com/ruanbarroso/redis-explorer/commit/057ec9784c3153f579d7eb30b1796f0c33eb13a8))

## [1.15.1](https://github.com/ruanbarroso/redis-explorer/compare/v1.15.0...v1.15.1) (2025-10-25)

### 🐛 Bug Fixes

* corrige exclusão de pastas filhas no TreeView ([8a21149](https://github.com/ruanbarroso/redis-explorer/commit/8a21149170edbbc9d01902837d98f07c0b0b8b79))

## [1.15.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.14.0...v1.15.0) (2025-10-24)

### 🚀 Features

* implementa remoção de pasta com endpoint otimizado ([62b7711](https://github.com/ruanbarroso/redis-explorer/commit/62b771106a5f23c3f31479f3d15b5dd2f208f94d))

## [1.14.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.13.0...v1.14.0) (2025-10-24)

### 🚀 Features

* melhora UX do TTL no ValueEditor ([9c6ed59](https://github.com/ruanbarroso/redis-explorer/commit/9c6ed59c993bb5793971af7259c1b88644df9517))

## [1.13.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.12.0...v1.13.0) (2025-10-24)

### 🚀 Features

* implementa countdown automático de TTL e exibição editável ([08c07f6](https://github.com/ruanbarroso/redis-explorer/commit/08c07f617efae5a1410af8a5625dbbe542cd6b93))

## [1.12.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.11.0...v1.12.0) (2025-10-24)

### 🚀 Features

* melhorias na modal de download de chaves e correção de hydration mismatch ([14b383b](https://github.com/ruanbarroso/redis-explorer/commit/14b383be2528ddfc59281199c2de34d6da8a4f38))

## [1.11.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.10.3...v1.11.0) (2025-10-24)

### 🚀 Features

* Implementa tela de Alertas e refatora Dashboard com Context API ([9278a69](https://github.com/ruanbarroso/redis-explorer/commit/9278a6987f412d59230919400a9f0311b3506553))

## [1.10.3](https://github.com/ruanbarroso/redis-explorer/compare/v1.10.2...v1.10.3) (2025-10-24)

### 🐛 Bug Fixes

* Remove reconexão automática e volta comportamento original ([731c08e](https://github.com/ruanbarroso/redis-explorer/commit/731c08e952970919b9651f85f5fbf7aeb270e499))

## [1.10.2](https://github.com/ruanbarroso/redis-explorer/compare/v1.10.1...v1.10.2) (2025-10-24)

### 🐛 Bug Fixes

* Corrige loop infinito na reconexão do Dashboard ([fc407ba](https://github.com/ruanbarroso/redis-explorer/commit/fc407badbb1dca8c9f467a899c10da3333712728))

## [1.10.1](https://github.com/ruanbarroso/redis-explorer/compare/v1.10.0...v1.10.1) (2025-10-24)

### 🐛 Bug Fixes

* Implementa reconexão automática quando sessão Redis expira ([ba2cb9b](https://github.com/ruanbarroso/redis-explorer/commit/ba2cb9b6e1d12d89f6e843b137e0a690d0bc1b14))

## [1.10.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.9.1...v1.10.0) (2025-10-23)

### 🚀 Features

* add 'Go to Key' button and support for creating new keys ([4c6eea4](https://github.com/ruanbarroso/redis-explorer/commit/4c6eea4f00a27f9e0eaba7b6ed16f51e2446cd81))

## [1.9.1](https://github.com/ruanbarroso/redis-explorer/compare/v1.9.0...v1.9.1) (2025-10-23)

### 🐛 Bug Fixes

* corrige funcionalidade load all keys e melhora UX ([20194ef](https://github.com/ruanbarroso/redis-explorer/commit/20194ef3d3bbd76ed4b5e9fb74dd345556d7bbb2))

## [1.9.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.8.0...v1.9.0) (2025-10-23)

### 🚀 Features

* melhorias na UI do ValueEditor - editor sempre editável com botões Save/Cancel dinâmicos, layout reorganizado com Size/TTL/Remove, campo TTL simplificado com tooltip explicativo, quebra de linha no nome da chave, e size calculado dinamicamente ([b0abd0e](https://github.com/ruanbarroso/redis-explorer/commit/b0abd0e49d6bdbacffb862c3e59458eaefb88f30))

## [1.8.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.7.0...v1.8.0) (2025-10-23)

### 🚀 Features

* add redis metrics dashboard with session persistence ([581b105](https://github.com/ruanbarroso/redis-explorer/commit/581b1052bb179755841ca8bd8ee9a3d74bbd85fb))

## [1.7.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.6.0...v1.7.0) (2025-10-23)

### 🚀 Features

* Sistema de virtualização para performance com 32k+ chaves ([82068b8](https://github.com/ruanbarroso/redis-explorer/commit/82068b8e83a9e615ca846ec53515e817432735db))

## [1.6.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.5.0...v1.6.0) (2025-10-23)

### 🚀 Features

* Sistema completo de progresso com modal elegante ([e9cbe08](https://github.com/ruanbarroso/redis-explorer/commit/e9cbe087b51d5f0d8a92e4670c4fe6f5073c5323))

## [1.5.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.4.0...v1.5.0) (2025-10-22)

### 🚀 Features

* Enhance Redis Dashboard with comprehensive metrics and improved error handling ([146a322](https://github.com/ruanbarroso/redis-explorer/commit/146a3229b938ff574edd40a61dbf74baa4fb8c3e))

## [1.4.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.3.0...v1.4.0) (2025-10-22)

### 🚀 Features

* componentização inteligente de modais e funcionalidades de auth ([868c112](https://github.com/ruanbarroso/redis-explorer/commit/868c1129d1dc210a98829d41697cabceadffe605))

## [1.3.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.2.5...v1.3.0) (2025-10-22)

### 🚀 Features

* Implementação completa da interface de gerenciamento de conexões Redis ([7fcffcc](https://github.com/ruanbarroso/redis-explorer/commit/7fcffcc0f11e6e62e79546af2268501c51d36d9d))

## [1.2.5](https://github.com/ruanbarroso/redis-explorer/compare/v1.2.4...v1.2.5) (2025-10-21)

### 🐛 Bug Fixes

* limpar estado das keys ao trocar conexões Redis ([f03d5c8](https://github.com/ruanbarroso/redis-explorer/commit/f03d5c8aca92e2f0e97de038c5dffc7ebdc701c1))

## [1.2.4](https://github.com/ruanbarroso/redis-explorer/compare/v1.2.3...v1.2.4) (2025-10-21)

### 🐛 Bug Fixes

* resolve login issue in production by making cookie secure attribute configurable ([f8a835b](https://github.com/ruanbarroso/redis-explorer/commit/f8a835befa7181898c6ef1921fc670375696134e))

## [1.2.3](https://github.com/ruanbarroso/redis-explorer/compare/v1.2.2...v1.2.3) (2025-10-21)

### 🐛 Bug Fixes

* remove ARM64 platform para evitar timeout de rede ([393f5a0](https://github.com/ruanbarroso/redis-explorer/commit/393f5a04c1f594f68352aa5f9deeb9bc5bdf267e))

## [1.2.2](https://github.com/ruanbarroso/redis-explorer/compare/v1.2.1...v1.2.2) (2025-10-21)

### 🐛 Bug Fixes

* atualiza Dockerfile para Node.js 22 para compatibilidade com semantic-release ([55c2462](https://github.com/ruanbarroso/redis-explorer/commit/55c24624733f3dd5a86a196de052bc2d70546923))

## [1.2.1](https://github.com/ruanbarroso/redis-explorer/compare/v1.2.0...v1.2.1) (2025-10-21)

### 🐛 Bug Fixes

* corrige condicao Docker build e usa tag fixa para teste ([1534cc8](https://github.com/ruanbarroso/redis-explorer/commit/1534cc852d449d7a8a9e83119781f9f075729570))

## [1.2.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.1.0...v1.2.0) (2025-10-21)

### 🚀 Features

* integra Docker Hub com semantic versioning automatico ([8267032](https://github.com/ruanbarroso/redis-explorer/commit/82670323a707d3e333b0e11cd2f033b445004e84))

## [1.1.0](https://github.com/ruanbarroso/redis-explorer/compare/v1.0.1...v1.1.0) (2025-10-21)

### 🚀 Features

* limpa workflows e foca em solução que funciona ([1d66330](https://github.com/ruanbarroso/redis-explorer/commit/1d663301acad0bca2c41c1f7dde50fed81473617))
* testa semantic-release após tag inicial v1.0.1 ([ec8ac6a](https://github.com/ruanbarroso/redis-explorer/commit/ec8ac6affb32a5feaee0e9136bb45514c1ca4f1f))

### 🐛 Bug Fixes

* adiciona dependência conventional-changelog-conventionalcommits ([6ce92a9](https://github.com/ruanbarroso/redis-explorer/commit/6ce92a96f9ab6b7efeb7360407492cc859c2cb6d))
* cria workflow básico para resolver falhas de dependências ([35123af](https://github.com/ruanbarroso/redis-explorer/commit/35123af6028aa2d7724fdaa8745512e418b6e886))

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
