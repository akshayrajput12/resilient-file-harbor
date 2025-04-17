
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Node, File } from "@/types/supabase";
import { HelpCircle, Trash2, HardDrive, Power, PlugZap, Database, Server } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const usedPercentageFormatted = Math.round(usedPercentage);
  
  const handleToggleStatus = () => {
    if (isOnline) {
      // Check if taking this node offline would make any files completely unavailable
      const potentiallyUnavailableFiles = filesOnNode.filter(file => {
        // Check if all replicas of this file are on this node or other offline nodes
        const hasOtherOnlineReplica = file.replicas?.some(replica => {
          const nodeId = replica.node_id;
          const replicaNode = files.find(f => 
            f.replicas?.some(r => r.node_id === nodeId)
          )?.replicas?.find(r => r.node_id === nodeId)?.nodes;
          
          return nodeId !== node.id && replicaNode?.status === 'online';
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
  
  const getStorageColor = () => {
    if (usedPercentage < 50) return "bg-green-500";
    if (usedPercentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card className={cn(
        "border border-border/20 h-full transition-all duration-300 overflow-hidden",
        isOnline 
          ? "bg-gradient-to-b from-card to-card/90 shadow-lg hover:shadow-xl" 
          : "bg-muted/30 hover:bg-muted/40"
      )}>
        <CardHeader className="pb-4 relative">
          <div className={cn(
            "absolute top-0 right-0 w-3 h-3 rounded-full mr-4 mt-4",
            isOnline ? "bg-green-500" : "bg-red-500"
          )}></div>
          
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-full",
              isOnline ? "bg-primary/10" : "bg-muted"
            )}>
              <Server className={cn(
                "h-5 w-5",
                isOnline ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <CardTitle className="text-lg font-semibold">{node.name}</CardTitle>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <div className={cn(
              "px-2 py-1 text-xs rounded-full",
              isOnline ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
            )}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <div className="text-sm text-muted-foreground">
              {node.storage_used}/{node.storage_total} MB
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <span>Storage usage</span>
              <span className="font-medium">{usedPercentageFormatted}%</span>
            </div>
            <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usedPercentage}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={cn("h-full rounded-full", getStorageColor())}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Database className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Stored Files
            </h4>
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
              {filesOnNode.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4 bg-background/20 rounded-md">
                  No files stored on this node
                </div>
              ) : (
                filesOnNode.map((file) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ x: 2 }}
                    key={file.id}
                    className="text-sm p-2.5 bg-background/30 hover:bg-background/50 rounded-md flex justify-between items-center transition-colors"
                  >
                    <span className="truncate max-w-[120px] font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-secondary/50 rounded-full">
                      {file.size} MB
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button 
                      variant={isOnline ? "destructive" : "default"} 
                      className={cn(
                        "w-full",
                        !isOnline && "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      )}
                      onClick={handleToggleStatus}
                    >
                      {isOnline ? (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Simulate Failure
                        </>
                      ) : (
                        <>
                          <PlugZap className="h-4 w-4 mr-2" />
                          Bring Online
                        </>
                      )}
                    </Button>
                  </motion.div>
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
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleDeleteNode}
                        className="shrink-0 border-border/30 hover:bg-background/80"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </motion.div>
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
    </motion.div>
  );
}
