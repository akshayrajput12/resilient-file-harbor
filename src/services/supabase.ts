
import { supabase } from '@/integrations/supabase/client';
import { type Node, type File, type Replica, type NodeInsert, type FileInsert, type ReplicaInsert, type NodeUpdate } from '@/types/supabase';

// Node services
export const getNodes = async () => {
  const { data, error } = await supabase
    .from('nodes')
    .select('*');
  
  if (error) throw error;
  return data as Node[];
};

export const createNode = async (node: NodeInsert) => {
  const { data, error } = await supabase
    .from('nodes')
    .insert(node)
    .select()
    .single();
  
  if (error) throw error;
  return data as Node;
};

export const updateNode = async ({ id, ...updates }: NodeUpdate & { id: string }) => {
  const { data, error } = await supabase
    .from('nodes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Node;
};

export const deleteNode = async (id: string) => {
  const { error } = await supabase
    .from('nodes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// File services
export const getFiles = async () => {
  const { data: files, error: filesError } = await supabase
    .from('files')
    .select('*');
  
  if (filesError) throw filesError;
  
  // Get replicas for each file
  const { data: replicas, error: replicasError } = await supabase
    .from('replicas')
    .select('*, nodes(*)');
  
  if (replicasError) throw replicasError;
  
  // Map replicas to files
  const filesWithReplicas = files.map((file) => ({
    ...file,
    replicas: replicas.filter((replica) => replica.file_id === file.id)
  }));
  
  return filesWithReplicas as File[];
};

export const createFile = async (file: FileInsert) => {
  // Make sure we have the storage_path
  if (!file.storage_path) {
    throw new Error('Storage path is required');
  }
  
  // First, we need to update the files table in Supabase to include the storage_path
  // We'll do this by adding the storage_path to the file record
  const { data, error } = await supabase
    .from('files')
    .insert({
      name: file.name,
      size: file.size,
      user_id: file.user_id,
      storage_path: file.storage_path
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as File;
};

export const deleteFile = async (id: string) => {
  // First, get the file to get its storage path
  const { data: file, error: fileError } = await supabase
    .from('files')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fileError) throw fileError;
  
  // Delete the file from storage if we have a path
  if ((file as any).storage_path) {
    const { error: storageError } = await supabase
      .storage
      .from('file_uploads')
      .remove([(file as any).storage_path]);
    
    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue even if storage deletion fails
    }
  }
  
  // Now delete all replicas of this file
  const { error: replicasError } = await supabase
    .from('replicas')
    .delete()
    .eq('file_id', id);
  
  if (replicasError) throw replicasError;
  
  // Then delete the file itself
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// Replica services
export const getReplicasByFile = async (fileId: string) => {
  const { data, error } = await supabase
    .from('replicas')
    .select('*, nodes(*)')
    .eq('file_id', fileId);
  
  if (error) throw error;
  return data as (Replica & { nodes: Node })[];
};

export const createReplica = async (replica: ReplicaInsert) => {
  // First, get the file size
  const { data: file, error: fileError } = await supabase
    .from('files')
    .select('size')
    .eq('id', replica.file_id)
    .single();
  
  if (fileError) throw fileError;
  
  // Then create the replica
  const { data, error } = await supabase
    .from('replicas')
    .insert(replica)
    .select()
    .single();
  
  if (error) throw error;
  
  // Update the node's storage_used
  const { data: nodeData, error: nodeError } = await supabase
    .from('nodes')
    .select('storage_used')
    .eq('id', replica.node_id)
    .single();
    
  if (nodeError) throw nodeError;
  
  // Calculate new storage value and update
  const newStorageUsed = nodeData.storage_used + file.size;
  
  const { error: updateError } = await supabase
    .from('nodes')
    .update({ storage_used: newStorageUsed })
    .eq('id', replica.node_id);
  
  if (updateError) throw updateError;
  
  return data as Replica;
};

export const deleteReplica = async (id: string) => {
  // First, get the replica to find the node and file
  const { data: replica, error: replicaGetError } = await supabase
    .from('replicas')
    .select('node_id, file_id')
    .eq('id', id)
    .single();
  
  if (replicaGetError) throw replicaGetError;
  
  // Get the file size
  const { data: file, error: fileError } = await supabase
    .from('files')
    .select('size')
    .eq('id', replica.file_id)
    .single();
    
  if (fileError) throw fileError;
  
  // Get current node storage
  const { data: node, error: nodeError } = await supabase
    .from('nodes')
    .select('storage_used')
    .eq('id', replica.node_id)
    .single();
    
  if (nodeError) throw nodeError;
  
  // Delete the replica
  const { error } = await supabase
    .from('replicas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Calculate new storage value and update
  const newStorageUsed = Math.max(0, node.storage_used - file.size);
  
  const { error: updateError } = await supabase
    .from('nodes')
    .update({ storage_used: newStorageUsed })
    .eq('id', replica.node_id);
  
  if (updateError) throw updateError;
  
  return true;
};

// Get combined file and replica data
export const getFilesWithReplicas = async () => {
  const { data: files, error: filesError } = await supabase
    .from('files')
    .select('*');
  
  if (filesError) throw filesError;
  
  const { data: replicas, error: replicasError } = await supabase
    .from('replicas')
    .select('*, nodes(*)');
  
  if (replicasError) throw replicasError;
  
  // Map replicas to files
  const filesWithReplicas = files.map((file) => ({
    ...file,
    replicas: replicas.filter((replica) => replica.file_id === file.id)
  }));
  
  return filesWithReplicas;
};
