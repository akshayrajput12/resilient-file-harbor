
import { supabase } from '@/integrations/supabase/client';
import { type Node, type File, type Replica, type NodeInsert, type FileInsert, type ReplicaInsert } from '@/types/supabase';

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

// Replica services
export const getReplicasByFile = async (fileId: string) => {
  const { data, error } = await supabase
    .from('replicas')
    .select('*')
    .eq('file_id', fileId);
  
  if (error) throw error;
  return data as Replica[];
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

export const deleteReplica = async (replicaId: string) => {
  const { error } = await supabase
    .from('replicas')
    .delete()
    .eq('id', replicaId);
  
  if (error) throw error;
  return true;
};
