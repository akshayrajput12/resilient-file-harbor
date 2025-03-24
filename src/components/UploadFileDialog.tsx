
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePlus } from "lucide-react";
import { Node, FileInsert, ReplicaInsert } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from 'uuid';

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
    
    if (!user) return;
    if (!fileName || !fileSize || selectedNodes.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Create the file
      const fileData: FileInsert = {
        name: fileName,
        size: fileSize,
        user_id: user.id
      };
      
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
      
      // Reset form and close dialog
      setFileName("");
      setFileSize(1);
      setSelectedNodes([]);
      setOpen(false);
    } catch (error) {
      console.error("Error uploading file:", error);
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
            <div className="grid grid-cols-2 gap-2">
              {onlineNodes.length === 0 ? (
                <p className="text-sm text-gray-500 col-span-2">No online nodes available</p>
              ) : (
                onlineNodes.map((node) => (
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
                    />
                    <label htmlFor={`node-${node.id}`} className="text-sm">
                      {node.name} ({node.storage_used}/{node.storage_total} GB used)
                    </label>
                  </div>
                ))
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
