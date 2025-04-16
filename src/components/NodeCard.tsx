
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Node, File } from "@/types/supabase";
import { HelpCircle, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

interface NodeCardProps {
  node: Node;
  files: File[];
  onToggleStatus: (nodeId: string, status: string) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export function NodeCard({ node, files, onToggleStatus, onDeleteNode }: NodeCardProps) {
  const isOnline = node.status === 'online';
  const filesOnNode = files.filter(file => {
    return file.replicas?.some(replica => replica.node_id === node.id);
  });
  
  const usedPercentage = Math.min(100, (node.storage_used / node.storage_total) * 100);
  
  const handleToggleStatus = () => {
    if (isOnline) {
      // Check if taking this node offline would make any files completely unavailable
      const potentiallyUnavailableFiles = filesOnNode.filter(file => {
        // Check if all replicas of this file are on this node or other offline nodes
        const hasOtherOnlineReplica = file.replicas?.some(replica => {
          return replica.node_id !== node.id && 
                 files.find(f => f.id === file.id)?.replicas?.some(r => 
                   r.node_id === replica.node_id && 
                   files.find(f => f.replicas?.some(fr => fr.node_id === r.node_id))?.replicas?.some(fr => 
                     fr.node_id === r.node_id && 
                     files.find(f => f.id === file.id)?.replicas?.some(r2 => 
                       r2.node_id === fr.node_id
                     )
                   )
                 );
        });
        
        return !hasOtherOnlineReplica;
      });
      
      if (potentiallyUnavailableFiles.length > 0) {
        toast({
          title: "Warning: Data Availability Impact",
          description: `Taking this node offline will make ${potentiallyUnavailableFiles.length} file(s) temporarily unavailable`,
          variant: "destructive"
        });
      }
    } else {
      // If bringing node back online, show a success message
      toast({
        title: "Node Back Online",
        description: "Node is now online and files stored on it are accessible again."
      });
    }
    
    onToggleStatus(node.id, isOnline ? 'offline' : 'online');
  };
  
  const handleDeleteNode = () => {
    if (filesOnNode.length > 0) {
      toast({
        title: "Cannot delete node",
        description: "This node contains files. Please delete the files first or move them to another node.",
        variant: "destructive"
      });
      return;
    }
    
    if (onDeleteNode) {
      onDeleteNode(node.id);
    }
  };
  
  return (
    <Card className={`border border-border transition-all duration-300 ${isOnline ? 'bg-card' : 'bg-card/60'}`}>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>{node.name}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${isOnline ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Storage: {node.storage_used}/{node.storage_total} MB used
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={usedPercentage} className="h-2 mb-4" />
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Stored Files</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filesOnNode.length === 0 ? (
              <p className="text-sm text-muted-foreground">No files stored on this node</p>
            ) : (
              filesOnNode.map((file) => (
                <div key={file.id} className="text-sm p-2 bg-background rounded flex justify-between">
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <span className="text-muted-foreground">{file.size} MB</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isOnline ? "destructive" : "outline"} 
                  className="flex-1"
                  onClick={handleToggleStatus}
                >
                  {isOnline ? "Simulate Failure" : "Bring Online"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isOnline 
                  ? "Simulates a node failure, making files stored only on this node temporarily unavailable" 
                  : "Brings the node back online, restoring access to its files"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {onDeleteNode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDeleteNode}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Delete this node (only possible when no files are stored on it)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
