
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileX, Download, Eye } from "lucide-react";
import { type File, type Node } from "@/types/supabase";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileViewer } from "@/components/FileViewer";
import AnimateOnMount from "./AnimateOnMount";
import { slideUp } from "@/lib/animation";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  
  // Map node IDs to node objects for easier lookup
  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, Node>);
  
  const handleViewFile = (file: File) => {
    // Check if at least one replica is on an online node
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
    
    setSelectedFile(file);
    setShowViewer(true);
    
    if (onViewFile) {
      onViewFile(file.id, file.name);
    }
  };
  
  const handleDownloadFile = (file: File) => {
    // Check if at least one replica is on an online node
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
      onDownloadFile(file.id, file.name);
    }
  };
  
  return (
    <>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Replicas</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <AnimateOnMount animation={slideUp}>
                    <div className="flex flex-col items-center justify-center">
                      <FileX className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No files uploaded yet</p>
                    </div>
                  </AnimateOnMount>
                </TableCell>
              </TableRow>
            ) : (
              files.map((file, index) => (
                <AnimateOnMount key={file.id} animation={slideUp} delay={index * 50}>
                  <TableRow>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>{file.size} MB</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {file.replicas?.map(replica => {
                          const node = nodeMap[replica.node_id];
                          return (
                            <span 
                              key={replica.id} 
                              className={`px-2 py-1 text-xs rounded-full ${
                                node?.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
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
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewFile(file)}
                          className="hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDownloadFile(file)}
                          className="hover:bg-primary/10"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onDeleteFile(file.id)}
                          className="hover:text-destructive hover:bg-destructive/10"
                        >
                          <FileX className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </AnimateOnMount>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {selectedFile && (
        <FileViewer 
          file={selectedFile} 
          isOpen={showViewer} 
          onClose={() => setShowViewer(false)} 
        />
      )}
    </>
  );
}
