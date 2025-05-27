#!/usr/bin/env python3
"""
MCP Server implementation following Anthropic's Model Context Protocol
Provides tools for arithmetic, web fetching, and file operations
"""

import asyncio
import json
import logging
import sys
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCPServer:
    def __init__(self):
        self.tools = {
            "addNumbers": {
                "description": "Add two numbers together",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "a": {"type": "number", "description": "First number"},
                        "b": {"type": "number", "description": "Second number"}
                    },
                    "required": ["a", "b"]
                }
            },
            "fetchContent": {
                "description": "Fetch content from a URL",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "URL to fetch"},
                        "method": {"type": "string", "enum": ["GET", "POST"], "default": "GET"}
                    },
                    "required": ["url"]
                }
            },
            "readFile": {
                "description": "Read file contents (safe, limited access)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "File path to read"}
                    },
                    "required": ["path"]
                }
            }
        }
        
        self.resources = []
        self.message_id = 1

    async def handle_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming JSON-RPC message"""
        try:
            if message.get("jsonrpc") != "2.0":
                return self.create_error_response(
                    message.get("id"), -32600, "Invalid Request"
                )

            method = message.get("method")
            params = message.get("params", {})
            msg_id = message.get("id")

            if method == "initialize":
                return await self.handle_initialize(msg_id, params)
            elif method == "tools/list":
                return await self.handle_tools_list(msg_id)
            elif method == "tools/call":
                return await self.handle_tools_call(msg_id, params)
            elif method == "resources/list":
                return await self.handle_resources_list(msg_id)
            elif method == "resources/read":
                return await self.handle_resources_read(msg_id, params)
            elif method == "ping":
                return self.create_success_response(msg_id, "pong")
            else:
                return self.create_error_response(
                    msg_id, -32601, f"Method not found: {method}"
                )

        except Exception as e:
            logger.error(f"Error handling message: {e}")
            return self.create_error_response(
                message.get("id"), -32603, f"Internal error: {str(e)}"
            )

    async def handle_initialize(self, msg_id: Any, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle initialization request"""
        return self.create_success_response(msg_id, {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {},
                "resources": {}
            },
            "serverInfo": {
                "name": "browser-mcp-server",
                "version": "1.0.0"
            }
        })

    async def handle_tools_list(self, msg_id: Any) -> Dict[str, Any]:
        """Handle tools/list request"""
        tools = []
        for name, info in self.tools.items():
            tools.append({
                "name": name,
                "description": info["description"],
                "inputSchema": info["inputSchema"]
            })
        
        return self.create_success_response(msg_id, {"tools": tools})

    async def handle_tools_call(self, msg_id: Any, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle tools/call request"""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        if tool_name not in self.tools:
            return self.create_error_response(
                msg_id, -32602, f"Unknown tool: {tool_name}"
            )

        try:
            result = await self.execute_tool(tool_name, arguments)
            return self.create_success_response(msg_id, result)
        except Exception as e:
            return self.create_error_response(
                msg_id, -32603, f"Tool execution failed: {str(e)}"
            )

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific tool"""
        if tool_name == "addNumbers":
            a = arguments.get("a")
            b = arguments.get("b")
            
            if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
                raise ValueError("Both 'a' and 'b' must be numbers")
            
            result = a + b
            return {
                "content": [{
                    "type": "text",
                    "text": str(result)
                }]
            }

        elif tool_name == "fetchContent":
            url = arguments.get("url")
            method = arguments.get("method", "GET")
            
            if not url:
                raise ValueError("URL is required")
            
            try:
                if method == "GET":
                    with urllib.request.urlopen(url) as response:
                        content = response.read().decode('utf-8')
                        # Limit content size
                        if len(content) > 2000:
                            content = content[:2000] + "... [truncated]"
                        
                        return {
                            "content": [{
                                "type": "text",
                                "text": content
                            }]
                        }
                else:
                    raise ValueError(f"HTTP method '{method}' not supported")
                    
            except urllib.error.URLError as e:
                raise ValueError(f"Failed to fetch URL: {str(e)}")

        elif tool_name == "readFile":
            file_path = arguments.get("path")
            
            if not file_path:
                raise ValueError("File path is required")
            
            # Security: Only allow reading from safe directories
            safe_dirs = ["/tmp", "/var/tmp", os.getcwd()]
            is_safe = any(os.path.abspath(file_path).startswith(os.path.abspath(safe_dir)) 
                         for safe_dir in safe_dirs)
            
            if not is_safe:
                raise ValueError("Access to this file path is not allowed")
            
            try:
                if os.path.exists(file_path) and os.path.isfile(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Limit file size
                        if len(content) > 5000:
                            content = content[:5000] + "... [truncated]"
                        
                        return {
                            "content": [{
                                "type": "text",
                                "text": content
                            }]
                        }
                else:
                    return {
                        "content": [{
                            "type": "text",
                            "text": f"File not found or not accessible: {file_path}"
                        }]
                    }
            except Exception as e:
                raise ValueError(f"Failed to read file: {str(e)}")

        else:
            raise ValueError(f"Unknown tool: {tool_name}")

    async def handle_resources_list(self, msg_id: Any) -> Dict[str, Any]:
        """Handle resources/list request"""
        return self.create_success_response(msg_id, {"resources": self.resources})

    async def handle_resources_read(self, msg_id: Any, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle resources/read request"""
        return self.create_error_response(
            msg_id, -32601, "Resources not implemented in this server"
        )

    def create_success_response(self, msg_id: Any, result: Any) -> Dict[str, Any]:
        """Create a successful JSON-RPC response"""
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": result
        }

    def create_error_response(self, msg_id: Any, code: int, message: str, data: Any = None) -> Dict[str, Any]:
        """Create an error JSON-RPC response"""
        error = {
            "code": code,
            "message": message
        }
        if data is not None:
            error["data"] = data

        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "error": error
        }

async def main():
    """Main server loop using stdio for communication"""
    server = MCPServer()
    logger.info("MCP Server started, waiting for messages...")

    try:
        while True:
            # Read from stdin
            line = sys.stdin.readline()
            if not line:
                break
            
            try:
                message = json.loads(line.strip())
                logger.info(f"Received: {message}")
                
                response = await server.handle_message(message)
                
                # Write response to stdout
                print(json.dumps(response))
                sys.stdout.flush()
                logger.info(f"Sent: {response}")
                
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received: {e}")
                error_response = server.create_error_response(
                    None, -32700, "Parse error"
                )
                print(json.dumps(error_response))
                sys.stdout.flush()
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                error_response = server.create_error_response(
                    None, -32603, f"Internal error: {str(e)}"
                )
                print(json.dumps(error_response))
                sys.stdout.flush()

    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
