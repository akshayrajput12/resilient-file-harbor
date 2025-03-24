
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { FileInsert, Node, ReplicaInsert } from "@/types/supabase";

interface UploadFileDialogProps {
  nodes: Node[];
  onCreateFile: (file: FileInsert) => Promise<any>;
  onCreateReplica: (replica: ReplicaInsert) => Promise<any>;
}

export function UploadFileDialog({ nodes, onCreateFile, onCreateReplica }: UploadFileDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const activeNodes = nodes.filter(node => node.status === 'online');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const toggleNode = (nodeId: string) => {
    setSelectedNodes(prev => {
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      } else {
        return [...prev, nodeId];
      }
    });
  };
  
  const handleUpload = async () => {
    if (!selectedFile || !user || selectedNodes.length === 0) {
      toast({
        title: "Upload failed",
        description: "Please select a file and at least one node",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create file entry in database
      const fileSize = Math.round(selectedFile.size / (1024 * 1024)); // Convert to MB
      const fileData: FileInsert = {
        name: selectedFile.name,
        size: fileSize,
        user_id: user.id,
      };
      
      const createdFile = await onCreateFile(fileData);
      
      // Create replicas in selected nodes
      for (const nodeId of selectedNodes) {
        const replicaData: ReplicaInsert = {
          file_id: createdFile.id,
          node_id: nodeId,
        };
        await onCreateReplica(replicaData);
        
        // Update node storage
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          // Node storage update is handled by a trigger in the database
        }
      }
      
      setSelectedFile(null);
      setSelectedNodes([]);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Select File</Label>
            <Input id="file" type="file" onChange={handleFileChange} className="mt-1" />
          </div>
          
          {selectedFile && (
            <div>
              <Label>Replicate to Nodes</Label>
              <div className="mt-2 space-y-2">
                {activeNodes.length === 0 ? (
                  <p className="text-sm text-amber-600">No active nodes available. Please create a node first.</p>
                ) : (
                  activeNodes.map(node => (
                    <div key={node.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`node-${node.id}`} 
                        checked={selectedNodes.includes(node.id)}
                        onCheckedChange={() => toggleNode(node.id)}
                      />
                      <Label htmlFor={`node-${node.id}`} className="flex justify-between w-full">
                        <span>{node.name}</span>
                        <span className="text-sm text-gray-500">{node.storage_used}/{node.storage_total} GB used</span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || selectedNodes.length === 0}
            className="w-full"
          >
            Upload File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
