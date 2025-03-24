
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePlus } from "lucide-react";
import { Node, FileInsert, ReplicaInsert } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from '@/hooks/use-toast';

interface UploadFileDialogProps {
  nodes: Node[];
  onCreateFile: (file: FileInsert) => Promise<any>;
  onCreateReplica: (replica: ReplicaInsert) => Promise<any>;
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  className?: string;
}

export function UploadFileDialog({ 
  nodes, 
  onCreateFile, 
  onCreateReplica,
  children,
  variant = "default",
  className
}: UploadFileDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number>(1);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const onlineNodes = nodes.filter(node => node.status === 'online');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive"
      });
      return;
    }
    
    if (!fileName) {
      toast({
        title: "File name required",
        description: "Please enter a file name",
        variant: "destructive"
      });
      return;
    }
    
    if (!fileSize || fileSize <= 0) {
      toast({
        title: "Invalid file size",
        description: "Please enter a valid file size",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedNodes.length === 0) {
      toast({
        title: "No nodes selected",
        description: "Please select at least one node for storage",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if selected nodes have enough storage
      const nodesWithStorage = onlineNodes.filter(node => selectedNodes.includes(node.id));
      const insufficientNodes = nodesWithStorage.filter(node => 
        (node.storage_total - node.storage_used) < fileSize
      );
      
      if (insufficientNodes.length > 0) {
        const nodeNames = insufficientNodes.map(node => node.name).join(", ");
        toast({
          title: "Insufficient storage",
          description: `The following nodes don't have enough space: ${nodeNames}`,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Create the file
      const fileData: FileInsert = {
        name: fileName,
        size: fileSize,
        user_id: user.id
      };
      
      toast({
        title: "Uploading file",
        description: "Your file is being processed..."
      });
      
      const newFile = await onCreateFile(fileData);
      
      // Create the replicas
      const replicaPromises = selectedNodes.map(nodeId => {
        const replicaData: ReplicaInsert = {
          file_id: newFile.id,
          node_id: nodeId
        };
        return onCreateReplica(replicaData);
      });
      
      await Promise.all(replicaPromises);
      
      toast({
        title: "File uploaded successfully",
        description: `File "${fileName}" has been stored across ${selectedNodes.length} nodes`,
      });
      
      // Reset form and close dialog
      setFileName("");
      setFileSize(1);
      setSelectedNodes([]);
      setOpen(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          {children || (
            <>
              <FilePlus className="h-4 w-4 mr-2" />
              Upload File
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fileSize">File Size (MB)</Label>
            <Input
              id="fileSize"
              type="number"
              min={1}
              value={fileSize}
              onChange={(e) => setFileSize(Number(e.target.value))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Select Nodes for Storage</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {onlineNodes.length === 0 ? (
                <p className="text-sm text-gray-500 col-span-2">No online nodes available</p>
              ) : (
                onlineNodes.map((node) => {
                  const availableStorage = node.storage_total - node.storage_used;
                  const hasEnoughSpace = availableStorage >= fileSize;
                  
                  return (
                    <div key={node.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`node-${node.id}`}
                        checked={selectedNodes.includes(node.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNodes([...selectedNodes, node.id]);
                          } else {
                            setSelectedNodes(selectedNodes.filter(id => id !== node.id));
                          }
                        }}
                        className="rounded"
                        disabled={!hasEnoughSpace}
                      />
                      <label 
                        htmlFor={`node-${node.id}`} 
                        className={`text-sm ${!hasEnoughSpace ? 'text-gray-400' : ''}`}
                      >
                        {node.name} ({node.storage_used}/{node.storage_total} GB)
                        {!hasEnoughSpace && <span className="ml-1 text-red-500">(Full)</span>}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
            {selectedNodes.length > 0 && (
              <p className="text-xs text-gray-500">
                Replication Factor: {selectedNodes.length}x
              </p>
            )}
          </div>
          
          <Button type="submit" disabled={isLoading || onlineNodes.length === 0 || selectedNodes.length === 0}>
            {isLoading ? "Uploading..." : "Upload File"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
