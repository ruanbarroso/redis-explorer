# Redis Explorer

A modern, web-based Redis GUI explorer built with Next.js 15 and React 19. This tool provides a comprehensive interface for managing Redis databases, similar to RedisInsight but with a focus on performance and user experience.

## Features

### 🔌 Connection Management
- Multiple Redis connection support
- SSL/TLS connections
- Connection testing and validation
- Persistent connection storage

### 🔍 Key Browser
- Advanced key search with pattern matching
- Real-time key filtering
- Key type identification with color coding
- TTL and size information
- Bulk operations support

### ✏️ Value Editor
- Support for all Redis data types:
  - Strings (with Monaco editor)
  - Hashes (table view with inline editing)
  - Lists (indexed table view)
  - Sets (member management)
  - Sorted Sets (score-based ordering)
- TTL management
- Add/edit/delete operations
- JSON syntax highlighting

### 📊 Dashboard & Monitoring
- Real-time performance metrics
- Memory usage tracking
- Operations per second monitoring
- Cache hit rate analysis
- Slow query log
- Interactive charts and graphs
- Auto-refresh capabilities

### 💻 CLI Terminal
- Full Redis CLI integration
- Command history with navigation
- Syntax highlighting
- Command categorization
- Execution time tracking
- Error handling and display

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Material-UI (MUI) v6
- **State Management**: Redux Toolkit
- **Redis Client**: ioredis
- **Code Editor**: Monaco Editor
- **Charts**: Recharts
- **Styling**: Emotion, CSS-in-JS

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by RedisInsight
- Built with modern web technologies
- Community-driven development

## Support

For support, please open an issue on GitHub or contact the development team.
