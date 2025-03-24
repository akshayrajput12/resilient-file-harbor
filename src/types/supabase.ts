
import type { Database } from '@/integrations/supabase/types';

// Re-export the Database type
export type { Database };

// Define types for our application using the Database type
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Node = Database['public']['Tables']['nodes']['Row'] & {
  replicas?: Replica[];
};
export type File = Database['public']['Tables']['files']['Row'] & {
  replicas?: (Replica & { nodes?: Node })[];
};
export type Replica = Database['public']['Tables']['replicas']['Row'] & {
  nodes?: Node;
};

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type NodeInsert = Database['public']['Tables']['nodes']['Insert'];
export type FileInsert = Database['public']['Tables']['files']['Insert'];
export type ReplicaInsert = Database['public']['Tables']['replicas']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type NodeUpdate = Database['public']['Tables']['nodes']['Update'];
export type FileUpdate = Database['public']['Tables']['files']['Update'];
export type ReplicaUpdate = Database['public']['Tables']['replicas']['Update'];
