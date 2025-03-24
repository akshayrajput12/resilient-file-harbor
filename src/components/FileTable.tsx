
import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";
import { type File, type Node } from "@/types/supabase";

interface FileTableProps {
  files: File[];
  nodes: Node[];
  onDeleteFile: (fileId: string) => void;
}

export function FileTable({ files, nodes, onDeleteFile }: FileTableProps) {
  // Map node IDs to node objects for easier lookup
  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, Node>);
  
  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3">Name</th>
            <th className="text-left py-3">Size</th>
            <th className="text-left py-3">Replicas</th>
            <th className="text-left py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-500">
                No files uploaded yet
              </td>
            </tr>
          ) : (
            files.map((file) => (
              <tr key={file.id} className="border-b">
                <td className="py-3">{file.name}</td>
                <td className="py-3">{file.size} MB</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {file.replicas?.map(replica => {
                      const node = nodeMap[replica.node_id];
                      return (
                        <span 
                          key={replica.id} 
                          className={`px-2 py-1 text-xs rounded-full ${
                            node?.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {node?.name || `Node ${replica.node_id.substring(0, 4)}`}
                        </span>
                      );
                    })}
                    {(!file.replicas || file.replicas.length === 0) && (
                      <span className="text-xs text-gray-500">No replicas</span>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <Button variant="ghost" size="sm" onClick={() => onDeleteFile(file.id)}>
                    <FileX className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
