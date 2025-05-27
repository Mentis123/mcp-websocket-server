import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConnectionPanelProps {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  useSecure: boolean;
  setUseSecure: (secure: boolean) => void;
}

export default function ConnectionPanel({
  serverUrl,
  setServerUrl,
  useSecure,
  setUseSecure
}: ConnectionPanelProps) {
  return (
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Settings</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="serverUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Server URL
          </Label>
          <Input
            id="serverUrl"
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="ws://localhost:8000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div>
          <Label htmlFor="protocol" className="block text-sm font-medium text-gray-700 mb-1">
            Protocol
          </Label>
          <Select defaultValue="jsonrpc">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jsonrpc">JSON-RPC 2.0</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="secure"
            checked={useSecure}
            onCheckedChange={(checked) => setUseSecure(checked as boolean)}
          />
          <Label htmlFor="secure" className="text-sm text-gray-700">
            Use Secure WebSocket (WSS)
          </Label>
        </div>
      </div>
    </div>
  );
}
