
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getReplicasByFile, createReplica, deleteReplica } from "@/services/supabase";
import { ReplicaInsert } from "@/types/supabase";

export function useReplicas(fileId?: string) {
  const queryClient = useQueryClient();

  const replicasQuery = useQuery({
    queryKey: ["replicas", fileId],
    queryFn: () => fileId ? getReplicasByFile(fileId) : Promise.resolve([]),
    enabled: !!fileId,
  });

  const createReplicaMutation = useMutation({
    mutationFn: (replica: ReplicaInsert) => createReplica(replica),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replicas"] });
      queryClient.invalidateQueries({ queryKey: ["nodes"] }); // Also invalidate nodes as storage may change
      toast({
        title: "Replica created",
        description: "Your file replica has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating replica",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReplicaMutation = useMutation({
    mutationFn: deleteReplica,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replicas"] });
      queryClient.invalidateQueries({ queryKey: ["nodes"] }); // Also invalidate nodes as storage may change
      toast({
        title: "Replica deleted",
        description: "Your file replica has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting replica",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    replicas: replicasQuery.data || [],
    isLoadingReplicas: replicasQuery.isLoading,
    error: replicasQuery.error,
    createReplica: createReplicaMutation.mutate,
    deleteReplica: deleteReplicaMutation.mutate,
  };
}
