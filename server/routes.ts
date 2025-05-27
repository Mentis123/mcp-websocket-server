import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server on /ws path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  let mcpServerProcess: ChildProcess | null = null;
  let mcpServerConnection: WebSocket | null = null;
  let pendingRequests = new Map<string | number, WebSocket>();

  // Start the Python MCP server
  function startMcpServer() {
    try {
      const mcpServerPath = path.join(process.cwd(), "server", "mcp-server.py");
      mcpServerProcess = spawn("python3", [mcpServerPath], {
        stdio: ["pipe", "pipe", "pipe"]
      });

      mcpServerProcess.on("error", (error) => {
        console.error("Failed to start MCP server:", error);
      });

      mcpServerProcess.on("exit", (code) => {
        console.log(`MCP server exited with code ${code}`);
        mcpServerProcess = null;
      });

      if (mcpServerProcess.stderr) {
        mcpServerProcess.stderr.on("data", (data) => {
          console.error("MCP server stderr:", data.toString());
        });
      }

      if (mcpServerProcess.stdout) {
        mcpServerProcess.stdout.on("data", (data) => {
          const lines = data.toString().split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
              try {
                const jsonResponse = JSON.parse(trimmedLine);
                if (jsonResponse.id && pendingRequests.has(jsonResponse.id)) {
                  const ws = pendingRequests.get(jsonResponse.id);
                  pendingRequests.delete(jsonResponse.id);
                  
                  if (ws && ws.readyState === WebSocket.OPEN) {
                    console.log("Forwarding Python response to browser:", jsonResponse);
                    ws.send(JSON.stringify(jsonResponse));
                  }
                }
              } catch (error) {
                // Not a JSON response, treat as log
                console.log("MCP server stdout:", trimmedLine);
              }
            } else if (trimmedLine) {
              console.log("MCP server stdout:", trimmedLine);
            }
          }
        });
      }

      console.log("MCP server started with PID:", mcpServerProcess.pid);
    } catch (error) {
      console.error("Error starting MCP server:", error);
    }
  }

  // Start MCP server on startup
  startMcpServer();

  // Handle WebSocket connections from browser clients
  wss.on("connection", (ws: WebSocket) => {
    console.log("Browser client connected");

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log("Received from browser:", message);

        // Handle MCP protocol messages
        if (message.jsonrpc === "2.0") {
          console.log("About to call handleMcpMessage");
          await handleMcpMessage(ws, message);
          console.log("handleMcpMessage completed");
        } else {
          console.log("Invalid message format - not JSON-RPC 2.0");
        }
      } catch (error) {
        console.error("Error processing message:", error);
        ws.send(JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: "Parse error",
            data: error instanceof Error ? error.message : "Unknown error"
          }
        }));
      }
    });

    ws.on("close", () => {
      console.log("Browser client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  async function handleMcpMessage(ws: WebSocket, message: any) {
    try {
      console.log("handleMcpMessage called with method:", message.method);
      let response;

      switch (message.method) {
        case "ping":
          response = {
            jsonrpc: "2.0",
            id: message.id,
            result: "pong"
          };
          break;

        case "tools/list":
          console.log("Processing tools/list request");
          response = {
            jsonrpc: "2.0",
            id: message.id,
            result: {
              tools: [
                {
                  name: "addNumbers",
                  description: "Add two numbers together",
                  inputSchema: {
                    type: "object",
                    properties: {
                      a: { type: "number", description: "First number" },
                      b: { type: "number", description: "Second number" }
                    },
                    required: ["a", "b"]
                  }
                },
                {
                  name: "fetchContent",
                  description: "Fetch content from a URL",
                  inputSchema: {
                    type: "object",
                    properties: {
                      url: { type: "string", description: "URL to fetch" },
                      method: { type: "string", enum: ["GET", "POST"], default: "GET" }
                    },
                    required: ["url"]
                  }
                },
                {
                  name: "readFile",
                  description: "Read file contents (simulated)",
                  inputSchema: {
                    type: "object",
                    properties: {
                      path: { type: "string", description: "File path to read" }
                    },
                    required: ["path"]
                  }
                }
              ]
            }
          };
          break;

        case "tools/call":
          // Forward request to Python MCP server
          if (mcpServerProcess && mcpServerProcess.stdin) {
            const mcpRequest = {
              jsonrpc: "2.0",
              id: message.id,
              method: "tools/call",
              params: message.params
            };
            
            // Track this request
            pendingRequests.set(message.id, ws);
            mcpServerProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
            return; // Don't send fallback response
          }
          
          // Fallback implementation if Python server is not available
          const toolName = message.params?.name;
          const args = message.params?.arguments || {};

          let result;
          switch (toolName) {
            case "addNumbers":
              if (typeof args.a !== "number" || typeof args.b !== "number") {
                throw new Error("Both 'a' and 'b' must be numbers");
              }
              result = {
                content: [{
                  type: "text",
                  text: (args.a + args.b).toString()
                }]
              };
              break;

            case "fetchContent":
              try {
                const fetchResponse = await fetch(args.url, {
                  method: args.method || "GET"
                });
                const content = await fetchResponse.text();
                result = {
                  content: [{
                    type: "text",
                    text: content.length > 1000 ? content.substring(0, 1000) + "..." : content
                  }]
                };
              } catch (fetchError) {
                throw new Error(`Failed to fetch URL: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`);
              }
              break;

            case "readFile":
              // Simulated file reading
              result = {
                content: [{
                  type: "text",
                  text: `Contents of file: ${args.path}\n\nThis is simulated file content for demonstration purposes.`
                }]
              };
              break;

            default:
              throw new Error(`Unknown tool: ${toolName}`);
          }

          response = {
            jsonrpc: "2.0",
            id: message.id,
            result
          };
          break;

        case "resources/list":
          response = {
            jsonrpc: "2.0",
            id: message.id,
            result: {
              resources: []
            }
          };
          break;

        default:
          throw new Error(`Unknown method: ${message.method}`);
      }

      console.log("About to send response:", response);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(response));
        console.log("Response sent successfully");
      } else {
        console.log("WebSocket not open, cannot send response");
      }
    } catch (error) {
      console.error("Error in handleMcpMessage:", error);
      const errorResponse = {
        jsonrpc: "2.0",
        id: message.id,
        error: {
          code: -32602,
          message: error instanceof Error ? error.message : "Unknown error",
          data: message.method
        }
      };
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(errorResponse));
      }
    }
  }

  // Cleanup on server shutdown
  process.on("SIGINT", () => {
    if (mcpServerProcess) {
      mcpServerProcess.kill();
    }
  });

  process.on("SIGTERM", () => {
    if (mcpServerProcess) {
      mcpServerProcess.kill();
    }
  });

  return httpServer;
}
