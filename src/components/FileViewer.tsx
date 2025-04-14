
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { File } from "lucide-react";
import { type File as SupabaseFile } from "@/types/supabase";
import AnimateOnMount from "./AnimateOnMount";
import { slideUp } from "@/lib/animation";

interface FileViewerProps {
  file: SupabaseFile;
  isOpen: boolean;
  onClose: () => void;
}

export function FileViewer({ file, isOpen, onClose }: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // In a real application, this would fetch the actual file content
  const simulateFileLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };
  
  // Get file extension
  const getFileExtension = (filename: string) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
  };
  
  const extension = getFileExtension(file.name).toLowerCase();
  
  // Simulate content based on file type
  const renderFileContent = () => {
    if (isLoading) {
      return <div className="flex justify-center p-12">Loading file content...</div>;
    }
    
    switch (extension) {
      case 'txt':
      case 'md':
      case 'json':
        return (
          <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-auto max-h-96">
            <pre>This is simulated content for {file.name}</pre>
            <pre>{JSON.stringify({ sample: "data", for: file.name }, null, 2)}</pre>
          </div>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <div className="flex justify-center p-4">
            <div className="aspect-square w-full max-w-md bg-muted rounded-md flex items-center justify-center">
              <span className="text-muted-foreground">Image preview would appear here</span>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <div className="bg-muted p-4 rounded-md flex flex-col items-center">
            <File className="w-16 h-16 text-red-500 mb-2" />
            <p className="text-muted-foreground">PDF document would be rendered here</p>
          </div>
        );
      default:
        return (
          <div className="bg-muted p-8 rounded-md flex flex-col items-center">
            <File className="w-16 h-16 text-blue-500 mb-2" />
            <p className="text-muted-foreground">Preview not available for this file type</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
        </DialogHeader>
        <AnimateOnMount animation={slideUp} delay={100}>
          <div className="mt-4">
            {renderFileContent()}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {!isLoading && (
              <Button onClick={simulateFileLoading}>Refresh</Button>
            )}
          </div>
        </AnimateOnMount>
      </DialogContent>
    </Dialog>
  );
}
