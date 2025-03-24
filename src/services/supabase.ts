
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
  const { data, error } = await supabase
    .from('files')
    .select('*');
  
  if (error) throw error;
  return data as File[];
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
  const { data, error } = await supabase
    .from('replicas')
    .insert(replica)
    .select()
    .single();
  
  if (error) throw error;
  return data as Replica;
};

export const deleteReplica = async (id: string) => {
  const { error } = await supabase
    .from('replicas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
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
