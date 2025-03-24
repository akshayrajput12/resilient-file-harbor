
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Node, File } from "@/types/supabase";

interface NodeCardProps {
  node: Node;
  files: File[];
  onToggleStatus: (nodeId: string, status: string) => void;
}

export function NodeCard({ node, files, onToggleStatus }: NodeCardProps) {
  const isOnline = node.status === 'online';
  const filesOnNode = files.filter(file => {
    return file.replicas?.some(replica => replica.node_id === node.id);
  });
  
  const usedPercentage = Math.min(100, (node.storage_used / node.storage_total) * 100);
  
  return (
    <Card className={isOnline ? '' : 'opacity-60'}>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>{node.name}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </CardTitle>
        <div className="text-sm text-gray-500">
          Storage: {node.storage_used}/{node.storage_total} GB used
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={usedPercentage} className="h-2 mb-4" />
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Stored Files</h4>
          <div className="space-y-2">
            {filesOnNode.length === 0 ? (
              <p className="text-sm text-gray-500">No files stored on this node</p>
            ) : (
              filesOnNode.map((file) => (
                <div key={file.id} className="text-sm p-2 bg-gray-50 rounded flex justify-between">
                  <span>{file.name}</span>
                  <span className="text-gray-500">{file.size} MB</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <Button 
          variant={isOnline ? "destructive" : "outline"} 
          className="w-full"
          onClick={() => onToggleStatus(node.id, isOnline ? 'offline' : 'online')}
        >
          {isOnline ? "Simulate Failure" : "Bring Node Online"}
        </Button>
      </CardContent>
    </Card>
  );
}
