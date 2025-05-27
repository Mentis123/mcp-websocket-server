import { useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import ConnectionPanel from "@/components/connection-panel";
import ToolsPanel from "@/components/tools-panel";
import ExecutionPanel from "@/components/execution-panel";
import MessageLog from "@/components/message-log";
import { Server, Plug, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function McpInterface() {
  const [serverUrl, setServerUrl] = useState("ws://localhost:5000/ws");
  const [useSecure, setUseSecure] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolParameters, setToolParameters] = useState<string>('{"a": 5, "b": 7}');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<string>("");

  const {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    messages,
    clearMessages,
    availableTools,
    connectionStatus
  } = useWebSocket(serverUrl);

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const handleToolExecution = async () => {
    if (!selectedTool || !isConnected) return;

    try {
      const params = JSON.parse(toolParameters);
      const startTime = performance.now();
      
      const response = await sendMessage("tools/call", {
        name: selectedTool,
        arguments: params
      });

      const endTime = performance.now();
      setExecutionTime(`${(endTime - startTime).toFixed(2)}ms`);
      setExecutionResult(response.result || response.error);
    } catch (error) {
      setExecutionResult({
        error: {
          code: -32700,
          message: "Invalid JSON parameters",
          data: error instanceof Error ? error.message : "Unknown error"
        }
      });
    }
  };

  // Calculate uptime
  const [startTime] = useState(Date.now());
  const [uptime, setUptime] = useState("00:00:00");

  useState(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server className="text-primary text-xl w-6 h-6" />
            <h1 className="text-xl font-semibold text-gray-900">MCP Server Interface</h1>
            <span className="text-sm text-gray-500 font-mono">v1.0.0</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Button
              onClick={handleConnect}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                isConnected 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-primary hover:bg-blue-700 text-white'
              }`}
            >
              {isConnected ? (
                <>
                  <PowerOff className="w-4 h-4 mr-2" />
                  Disconnect
                </>
              ) : (
                <>
                  <Plug className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <ConnectionPanel
            serverUrl={serverUrl}
            setServerUrl={setServerUrl}
            useSecure={useSecure}
            setUseSecure={setUseSecure}
          />
          <ToolsPanel
            availableTools={availableTools}
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
          />
        </aside>

        {/* Main Panel */}
        <main className="flex-1 flex flex-col">
          <ExecutionPanel
            selectedTool={selectedTool}
            toolParameters={toolParameters}
            setToolParameters={setToolParameters}
            executionResult={executionResult}
            executionTime={executionTime}
            onExecute={handleToolExecution}
            isConnected={isConnected}
          />
          <MessageLog
            messages={messages}
            onClear={clearMessages}
          />
        </main>
      </div>

      {/* Status Bar */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              WebSocket: <span className={`font-mono ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'OPEN' : 'CLOSED'}
              </span>
            </span>
            <span>Messages: <span className="font-mono">{messages.length}</span></span>
            <span>Uptime: <span className="font-mono">{uptime}</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">⚡</span>
            <span>Model Context Protocol v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
