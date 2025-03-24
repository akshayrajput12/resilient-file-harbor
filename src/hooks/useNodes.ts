
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getNodes, createNode, updateNode, deleteNode } from "@/services/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { NodeInsert } from "@/types/supabase";

export function useNodes() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const nodesQuery = useQuery({
    queryKey: ["nodes"],
    queryFn: getNodes,
    enabled: !!user,
  });

  const createNodeMutation = useMutation({
    mutationFn: (node: NodeInsert) => createNode(node),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
      toast({
        title: "Node created",
        description: "Your node has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating node",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: updateNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
      toast({
        title: "Node updated",
        description: "Your node has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating node",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
      toast({
        title: "Node deleted",
        description: "Your node has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting node",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    nodes: nodesQuery.data || [],
    isLoadingNodes: nodesQuery.isLoading,
    error: nodesQuery.error,
    createNode: createNodeMutation.mutate,
    updateNode: updateNodeMutation.mutate,
    deleteNode: deleteNodeMutation.mutate,
  };
}
