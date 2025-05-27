import { Calculator, Globe, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

interface ToolsPanelProps {
  availableTools: Tool[];
  selectedTool: string | null;
  onToolSelect: (toolName: string) => void;
}

export default function ToolsPanel({
  availableTools,
  selectedTool,
  onToolSelect
}: ToolsPanelProps) {
  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'addNumbers':
        return <Calculator className="text-primary text-sm w-4 h-4" />;
      case 'fetchContent':
        return <Globe className="text-primary text-sm w-4 h-4" />;
      case 'readFile':
        return <FileText className="text-primary text-sm w-4 h-4" />;
      default:
        return <Calculator className="text-primary text-sm w-4 h-4" />;
    }
  };

  const getToolTags = (toolName: string) => {
    switch (toolName) {
      case 'addNumbers':
        return ['number', 'arithmetic'];
      case 'fetchContent':
        return ['web', 'http'];
      case 'readFile':
        return ['filesystem', 'io'];
      default:
        return ['tool'];
    }
  };

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      'number': 'bg-blue-100 text-blue-800',
      'arithmetic': 'bg-blue-100 text-blue-800',
      'web': 'bg-green-100 text-green-800',
      'http': 'bg-green-100 text-green-800',
      'filesystem': 'bg-purple-100 text-purple-800',
      'io': 'bg-purple-100 text-purple-800',
      'tool': 'bg-gray-100 text-gray-800'
    };
    return colors[tag] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex-1 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Tools</h2>
      <div className="space-y-3">
        {availableTools.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No tools available. Connect to server to load tools.
          </div>
        ) : (
          availableTools.map((tool) => (
            <div
              key={tool.name}
              onClick={() => onToolSelect(tool.name)}
              className={`p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-sm transition-all duration-200 cursor-pointer ${
                selectedTool === tool.name ? 'border-primary bg-blue-50 shadow-sm' : 'bg-surface-variant'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{tool.name}</h3>
                {getToolIcon(tool.name)}
              </div>
              <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
              <div className="flex flex-wrap gap-1">
                {getToolTags(tool.name).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={`px-2 py-1 text-xs rounded ${getTagColor(tag)}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
