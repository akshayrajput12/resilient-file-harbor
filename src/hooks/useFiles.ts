
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getFiles, createFile, deleteFile } from "@/services/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { FileInsert, File } from "@/types/supabase";

export function useFiles() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const filesQuery = useQuery({
    queryKey: ["files"],
    queryFn: getFiles,
    enabled: !!user,
  });

  const createFileMutation = useMutation({
    mutationFn: (file: FileInsert) => createFile(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["nodes"] }); // Also invalidate nodes as storage may change
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });
      return data; // Ensure data is returned
    },
    onError: (error: Error) => {
      toast({
        title: "Error uploading file",
        description: error.message,
        variant: "destructive",
      });
      throw error; // Re-throw the error to be caught by callers
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["nodes"] }); // Also invalidate nodes as storage may change
      toast({
        title: "File deleted",
        description: "Your file has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    files: filesQuery.data || [],
    isLoadingFiles: filesQuery.isLoading,
    error: filesQuery.error,
    createFile: createFileMutation.mutate,
    deleteFile: deleteFileMutation.mutate,
  };
}
