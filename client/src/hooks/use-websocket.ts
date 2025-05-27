import { useState, useRef, useCallback, useEffect } from "react";
import { McpClient } from "@/lib/mcp-client";

export interface LogMessage {
  id: string;
  type: 'request' | 'response' | 'error' | 'system';
  content: string;
  timestamp: string;
  category: 'outgoing' | 'incoming' | 'error' | 'success' | 'system';
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export function useWebSocket(serverUrl: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  
  const mcpClientRef = useRef<McpClient | null>(null);
  const messageIdRef = useRef(1);

  const addMessage = useCallback((type: LogMessage['type'], content: string, category: LogMessage['category']) => {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    const message: LogMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp,
      category
    };

    setMessages(prev => [...prev, message]);
  }, []);

  const connect = useCallback(() => {
    if (mcpClientRef.current) {
      mcpClientRef.current.disconnect();
    }

    setConnectionStatus('connecting');
    addMessage('system', 'Attempting to connect...', 'system');

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      mcpClientRef.current = new McpClient(wsUrl);

      mcpClientRef.current.onOpen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        addMessage('system', 'Connected to MCP server', 'success');
        
        // Request available tools
        mcpClientRef.current?.sendMessage('tools/list', {});
      };

      mcpClientRef.current.onClose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        addMessage('system', 'Disconnected from MCP server', 'error');
      };

      mcpClientRef.current.onError = (error) => {
        addMessage('system', `WebSocket error: ${error}`, 'error');
        setConnectionStatus('disconnected');
      };

      mcpClientRef.current.onMessage = (message) => {
        addMessage('response', JSON.stringify(message, null, 2), 'incoming');
        
        // Handle tools list response
        if (message.result?.tools) {
          console.log("Setting available tools:", message.result.tools);
          setAvailableTools(message.result.tools);
        }
      };

    } catch (error) {
      addMessage('system', `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setConnectionStatus('disconnected');
    }
  }, [addMessage, serverUrl]);

  const disconnect = useCallback(() => {
    if (mcpClientRef.current) {
      mcpClientRef.current.disconnect();
      mcpClientRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback(async (method: string, params: any = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!mcpClientRef.current || !isConnected) {
        reject(new Error('Not connected to server'));
        return;
      }

      const messageId = messageIdRef.current++;
      const message = {
        jsonrpc: "2.0" as const,
        id: messageId,
        method,
        params
      };

      addMessage('request', JSON.stringify(message, null, 2), 'outgoing');

      // Set up response handler
      const originalOnMessage = mcpClientRef.current.onMessage;
      mcpClientRef.current.onMessage = (response) => {
        if (response.id === messageId) {
          // Restore original handler
          if (mcpClientRef.current) {
            mcpClientRef.current.onMessage = originalOnMessage;
          }
          
          if (response.error) {
            reject(response);
          } else {
            resolve(response);
          }
        }
        
        // Call original handler for other messages
        if (originalOnMessage) {
          originalOnMessage(response);
        }
      };

      mcpClientRef.current.sendMessage(method, params);
    });
  }, [isConnected, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    addMessage('system', 'Message log cleared', 'system');
  }, [addMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mcpClientRef.current) {
        mcpClientRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    messages,
    clearMessages,
    availableTools
  };
}
