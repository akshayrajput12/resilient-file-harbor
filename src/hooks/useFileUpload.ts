
import { useState } from "react";
import { useFiles } from "./useFiles";
import { useNodes } from "./useNodes";
import { useReplicas } from "./useReplicas";
import { FileInsert, File as SupabaseFile } from "@/types/supabase";
import { toast } from "./use-toast";
import { useFileStorage } from "./useFileStorage";
import { supabase } from "@/integrations/supabase/client";

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { createFile } = useFiles();
  const { nodes } = useNodes();
  const { createReplica } = useReplicas();
  const { uploadFile: storeFile } = useFileStorage();

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
      
      // Upload file to Supabase Storage
      const fileUploadResult = await storeFile(file);
      
      if (!fileUploadResult) {
        throw new Error("Failed to upload file to storage");
      }
      
      // Create file entry in database with storage path
      const fileData: FileInsert = {
        name: file.name,
        size: fileSizeMB,
        user_id: nodes[0]?.user_id || '', // Safe to use as nodes are already filtered by current user
        storage_path: fileUploadResult.path // Add storage path to file record
      };
      
      // Create the file record in the database
      let newFile: SupabaseFile | null = null;
      try {
        newFile = await createFilePromise(fileData);
        
        if (!newFile) {
          throw new Error("Failed to create file record");
        }
        
        // Create replicas for each selected node
        const replicaPromises = selectedNodeIds.map(nodeId => {
          return createReplicaPromise({
            file_id: newFile!.id,
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
        // If file record creation fails but storage upload succeeded, try to clean up
        if (fileUploadResult && !newFile) {
          try {
            await supabase.storage
              .from('file_uploads')
              .remove([fileUploadResult.path]);
          } catch (cleanupError) {
            console.error("Failed to clean up orphaned storage file:", cleanupError);
          }
        }
        throw error;
      }
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

  // Helper function to use promises with the createFile mutation
  const createFilePromise = (fileData: FileInsert): Promise<SupabaseFile | null> => {
    return new Promise((resolve, reject) => {
      createFile(fileData, {
        onSuccess: (data) => resolve(data as SupabaseFile),
        onError: (error) => reject(error)
      });
    });
  };

  // Helper function to use promises with the createReplica mutation
  const createReplicaPromise = (replicaData: { file_id: string; node_id: string }): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      createReplica(replicaData, {
        onSuccess: () => resolve(true),
        onError: (error) => reject(error)
      });
    });
  };

  return {
    uploadFile,
    isUploading
  };
}
