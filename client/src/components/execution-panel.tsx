import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ExecutionPanelProps {
  selectedTool: string | null;
  toolParameters: string;
  setToolParameters: (params: string) => void;
  executionResult: any;
  executionTime: string;
  onExecute: () => void;
  isConnected: boolean;
}

export default function ExecutionPanel({
  selectedTool,
  toolParameters,
  setToolParameters,
  executionResult,
  executionTime,
  onExecute,
  isConnected
}: ExecutionPanelProps) {
  return (
    <div className="p-6 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Tool Execution</h2>
        <Button
          onClick={onExecute}
          disabled={!selectedTool || !isConnected}
          className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 mr-2" />
          Execute Tool
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="selectedTool" className="block text-sm font-medium text-gray-700 mb-1">
              Selected Tool
            </Label>
            <Input
              id="selectedTool"
              type="text"
              value={selectedTool || ""}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              placeholder="No tool selected"
            />
          </div>
          <div>
            <Label htmlFor="toolParameters" className="block text-sm font-medium text-gray-700 mb-1">
              Parameters (JSON)
            </Label>
            <Textarea
              id="toolParameters"
              value={toolParameters}
              onChange={(e) => setToolParameters(e.target.value)}
              rows={6}
              placeholder='{"a": 5, "b": 7}'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Execution Result */}
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Execution Result
            </Label>
            <div className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm overflow-auto">
              {executionResult ? (
                <pre className={`whitespace-pre-wrap ${executionResult.error ? 'text-red-600' : 'text-gray-800'}`}>
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              ) : (
                <div className="text-gray-500">No execution result yet...</div>
              )}
            </div>
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Execution Time
            </Label>
            <div className="text-sm text-gray-600">{executionTime || "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
