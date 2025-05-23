
import { Button } from "@/components/ui/button";
import { FileX, Download, Eye } from "lucide-react";
import { type File, type Node } from "@/types/supabase";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

interface FileTableProps {
  files: File[];
  nodes: Node[];
  onDeleteFile: (fileId: string) => void;
  onViewFile?: (fileId: string, fileName: string) => void;
  onDownloadFile?: (fileId: string, fileName: string) => void;
}

export function FileTable({ 
  files, 
  nodes, 
  onDeleteFile, 
  onViewFile, 
  onDownloadFile 
}: FileTableProps) {
  // Map node IDs to node objects for easier lookup
  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, Node>);
  
  const handleViewFile = (fileId: string, fileName: string) => {
    // Check if at least one replica is on an online node
    const file = files.find(f => f.id === fileId);
    const hasAccessibleReplica = file?.replicas?.some(replica => {
      const node = nodeMap[replica.node_id];
      return node?.status === 'online';
    });
    
    if (!hasAccessibleReplica) {
      toast({
        title: "File unavailable",
        description: "This file cannot be accessed because all nodes containing it are offline.",
        variant: "destructive"
      });
      return;
    }
    
    if (onViewFile) {
      onViewFile(fileId, fileName);
    }
  };
  
  const handleDownloadFile = (fileId: string, fileName: string) => {
    // Check if at least one replica is on an online node
    const file = files.find(f => f.id === fileId);
    const hasAccessibleReplica = file?.replicas?.some(replica => {
      const node = nodeMap[replica.node_id];
      return node?.status === 'online';
    });
    
    if (!hasAccessibleReplica) {
      toast({
        title: "File unavailable",
        description: "This file cannot be downloaded because all nodes containing it are offline.",
        variant: "destructive"
      });
      return;
    }
    
    if (onDownloadFile) {
      onDownloadFile(fileId, fileName);
    }
  };
  
  return (
    <div className="overflow-auto">
      {files.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground mb-4">No files uploaded yet</p>
          <FileX className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Upload a file to get started</p>
        </motion.div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Size</th>
              <th className="text-left py-3">Replicas</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <motion.tr 
                key={file.id} 
                className="border-b border-border hover:bg-accent/5 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
              >
                <td className="py-3 max-w-[200px] truncate">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button className="text-left cursor-pointer hover:text-primary transition-colors">
                        {file.name}
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">{file.name}</h4>
                        <p className="text-xs text-muted-foreground">ID: {file.id.substring(0, 8)}...</p>
                        <p className="text-xs">
                          Size: {file.size} MB • 
                          Replicas: {file.replicas?.length || 0}
                        </p>
                        <div className="pt-2 flex gap-2">
                          <Button 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => handleViewFile(file.id, file.name)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleDownloadFile(file.id, file.name)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </td>
                <td className="py-3">{file.size} MB</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {file.replicas?.map(replica => {
                      const node = nodeMap[replica.node_id];
                      return (
                        <motion.span 
                          key={replica.id} 
                          className={`px-2 py-1 text-xs rounded-full ${
                            node?.status === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {node?.name || `Node ${replica.node_id.substring(0, 4)}`}
                        </motion.span>
                      );
                    })}
                    {(!file.replicas || file.replicas.length === 0) && (
                      <span className="text-xs text-muted-foreground">No replicas</span>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {onViewFile && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewFile(file.id, file.name)}
                          className="hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                    {onDownloadFile && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDownloadFile(file.id, file.name)}
                          className="hover:bg-green-50 hover:text-green-500 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDeleteFile(file.id)}
                        className="text-destructive hover:bg-red-50 hover:text-destructive/80 transition-colors"
                      >
                        <FileX className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
