
import { Button } from "@/components/ui/button";
import { FileX, Download, Eye } from "lucide-react";
import { type File, type Node } from "@/types/supabase";
import { toast } from "@/hooks/use-toast";
import { motion } from "@/components/ui/motion";

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
                className="border-b border-border"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <td className="py-3 max-w-[200px] truncate">{file.name}</td>
                <td className="py-3">{file.size} MB</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {file.replicas?.map(replica => {
                      const node = nodeMap[replica.node_id];
                      return (
                        <span 
                          key={replica.id} 
                          className={`px-2 py-1 text-xs rounded-full ${
                            node?.status === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {node?.name || `Node ${replica.node_id.substring(0, 4)}`}
                        </span>
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
                      <Button variant="ghost" size="sm" onClick={() => handleViewFile(file.id, file.name)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onDownloadFile && (
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(file.id, file.name)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDeleteFile(file.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <FileX className="h-4 w-4" />
                    </Button>
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
