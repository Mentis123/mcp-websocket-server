# Browser-Accessible MCP Server

A browser-accessible implementation of Anthropic's Model Context Protocol (MCP) with WebSocket communication and extensible tool integration.

## Features

- 🌐 Browser-based interface for MCP server interaction
- 🔌 WebSocket communication with real-time JSON-RPC messaging
- 🛠️ Three demo tools: addNumbers, fetchContent, readFile
- 📊 Real-time message logging and execution monitoring
- 🎨 Modern UI with React and Tailwind CSS
- 🔄 Bi-directional communication between browser and MCP server

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + WebSockets
- **MCP Server**: Python implementation following MCP protocol
- **Communication**: JSON-RPC 2.0 over WebSockets

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:5000`

4. **Connect to the MCP server**:
   - Ensure "Use Secure WebSocket (WSS)" is **unchecked** for local development
   - Click "Connect" to establish WebSocket connection
   - Available tools should appear in the sidebar

## Available Tools

### addNumbers
Adds two numbers together.
```json
{"a": 5, "b": 7}
```

### fetchContent
Fetches content from a URL.
```json
{"url": "https://httpbin.org/json", "method": "GET"}
```

### readFile
Reads file contents (simulated for security).
```json
{"path": "/tmp/example.txt"}
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── pages/          # Page components
├── server/                 # Node.js backend
│   ├── index.ts           # Main server entry
│   ├── routes.ts          # WebSocket routes
│   ├── mcp-server.py      # Python MCP server
│   └── vite.ts            # Vite dev server setup
├── shared/                 # Shared types and schemas
└── package.json
```

## Development

The application runs on port 5000 with:
- Express server handling HTTP requests
- WebSocket server on `/ws` path for MCP communication
- Python subprocess for MCP protocol implementation
- Vite dev server for hot module replacement

## MCP Protocol

This implementation follows the [Model Context Protocol](https://modelcontextprotocol.io/) specification:
- JSON-RPC 2.0 messaging
- Tools list and execution
- Resource management
- Error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.