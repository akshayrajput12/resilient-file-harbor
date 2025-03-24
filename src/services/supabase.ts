
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
  const { data, error } = await supabase
    .from('files')
    .insert(file)
    .select()
    .single();
  
  if (error) throw error;
  return data as File;
};

export const deleteFile = async (id: string) => {
  // First, we need to delete all replicas of this file
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
  const { error: nodeError } = await supabase
    .from('nodes')
    .update({
      storage_used: supabase.rpc('increment_storage', { 
        node_id: replica.node_id, 
        size_to_add: file.size 
      })
    })
    .eq('id', replica.node_id);
  
  if (nodeError) throw nodeError;
  
  return data as Replica;
};

export const deleteReplica = async (id: string) => {
  // First, get the replica to find the node and file
  const { data: replica, error: replicaGetError } = await supabase
    .from('replicas')
    .select('*, files(size)')
    .eq('id', id)
    .single();
  
  if (replicaGetError) throw replicaGetError;
  
  // Delete the replica
  const { error } = await supabase
    .from('replicas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Update the node's storage_used
  const { error: nodeError } = await supabase
    .from('nodes')
    .update({
      storage_used: supabase.rpc('decrement_storage', { 
        node_id: replica.node_id, 
        size_to_subtract: replica.files.size 
      })
    })
    .eq('id', replica.node_id);
  
  if (nodeError) throw nodeError;
  
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
