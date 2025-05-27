import { Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogMessage {
  id: string;
  type: 'request' | 'response' | 'error' | 'system';
  content: string;
  timestamp: string;
  category: 'outgoing' | 'incoming' | 'error' | 'success' | 'system';
}

interface MessageLogProps {
  messages: LogMessage[];
  onClear: () => void;
}

export default function MessageLog({ messages, onClear }: MessageLogProps) {
  const getBorderColor = (category: string) => {
    const colors = {
      'outgoing': 'border-blue-500',
      'incoming': 'border-green-500',
      'error': 'border-red-500',
      'success': 'border-green-500',
      'system': 'border-gray-500'
    };
    return colors[category as keyof typeof colors] || 'border-gray-500';
  };

  const getBadgeColor = (category: string) => {
    const colors = {
      'outgoing': 'bg-blue-100 text-blue-800',
      'incoming': 'bg-green-100 text-green-800',
      'error': 'bg-red-100 text-red-800',
      'success': 'bg-green-100 text-green-800',
      'system': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const exportLog = () => {
    const logData = {
      exported: new Date().toISOString(),
      messages: messages
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-log-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">JSON-RPC Message Log</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportLog}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="h-96 border border-gray-200 rounded-lg bg-gray-50 p-4 overflow-auto font-mono text-sm">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No messages yet</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 p-3 bg-white rounded border-l-4 ${getBorderColor(message.category)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {message.type} • {message.timestamp}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${getBadgeColor(message.category)}`}>
                  {message.category}
                </span>
              </div>
              <pre className="text-gray-800 whitespace-pre-wrap text-sm break-words">
                {message.content}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
