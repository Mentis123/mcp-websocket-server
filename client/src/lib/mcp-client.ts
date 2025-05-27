export interface JsonRpcMessage {
  jsonrpc: "2.0";
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class McpClient {
  private ws: WebSocket | null = null;
  private messageId = 1;
  private pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();

  public onOpen?: () => void;
  public onClose?: () => void;
  public onError?: (error: string) => void;
  public onMessage?: (message: JsonRpcMessage) => void;

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (this.onOpen) {
          this.onOpen();
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (this.onClose) {
          this.onClose();
        }
      };

      this.ws.onerror = (event) => {
        if (this.onError) {
          this.onError('WebSocket connection error');
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: JsonRpcMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      if (this.onError) {
        this.onError(error instanceof Error ? error.message : 'Connection failed');
      }
    }
  }

  private handleMessage(message: JsonRpcMessage) {
    // Handle responses to our requests
    if (message.id !== undefined && this.pendingRequests.has(message.id)) {
      const pending = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        pending.reject(message);
      } else {
        pending.resolve(message);
      }
      return;
    }

    // Handle notifications and other messages
    if (this.onMessage) {
      this.onMessage(message);
    }
  }

  public sendMessage(method: string, params: any = {}): Promise<JsonRpcMessage> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const id = this.messageId++;
      const message: JsonRpcMessage = {
        jsonrpc: "2.0",
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });

      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  public sendNotification(method: string, params: any = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message: JsonRpcMessage = {
      jsonrpc: "2.0",
      method,
      params
    };

    this.ws.send(JSON.stringify(message));
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();
  }

  public get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
