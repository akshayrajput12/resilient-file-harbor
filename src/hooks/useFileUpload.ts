
import { useState } from "react";
import { useFiles } from "./useFiles";
import { useNodes } from "./useNodes";
import { useReplicas } from "./useReplicas";
import { FileInsert, File as SupabaseFile } from "@/types/supabase";
import { toast } from "./use-toast";

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { createFile } = useFiles();
  const { nodes } = useNodes();
  const { createReplica } = useReplicas();

  const uploadFile = async (file: globalThis.File, selectedNodeIds: string[]): Promise<SupabaseFile | null> => {
    if (!file) return null;
    
    setIsUploading(true);
    
    try {
      // Check if selected nodes have enough storage
      const onlineNodes = nodes.filter(node => 
        node.status === 'online' && selectedNodeIds.includes(node.id)
      );
      
      const fileSizeMB = Math.ceil(file.size / (1024 * 1024));
      
      const insufficientNodes = onlineNodes.filter(node => 
        (node.storage_total - node.storage_used) < fileSizeMB
      );
      
      if (insufficientNodes.length > 0) {
        const nodeNames = insufficientNodes.map(node => node.name).join(", ");
        toast({
          title: "Insufficient storage",
          description: `The following nodes don't have enough space: ${nodeNames}`,
          variant: "destructive"
        });
        return null;
      }
      
      toast({
        title: "Uploading file",
        description: "Your file is being processed..."
      });
      
      // Create file entry in database
      const fileData: FileInsert = {
        name: file.name,
        size: fileSizeMB,
        user_id: nodes[0]?.user_id // Safe to use as nodes are already filtered by current user
      };
      
      const newFile = await createFile(fileData);
      
      if (!newFile) {
        throw new Error("Failed to create file record");
      }
      
      // Create replicas for each selected node
      const replicaPromises = selectedNodeIds.map(nodeId => {
        return createReplica({
          file_id: newFile.id,
          node_id: nodeId
        });
      });
      
      await Promise.all(replicaPromises);
      
      toast({
        title: "File uploaded successfully",
        description: `File "${file.name}" has been stored across ${selectedNodeIds.length} nodes`,
      });
      
      return newFile;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading
  };
}
