
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Eye, FileText, HardDrive } from "lucide-react";
import { FilePreview } from './FilePreview';
import { useFiles } from '@/hooks/useFiles';
import { useFileStorage } from '@/hooks/useFileStorage';
import { useReplicas } from '@/hooks/useReplicas';
import { slideUp, slideInLeft } from '@/lib/animation';
import { cn } from '@/lib/utils';

interface FileViewerDialogProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

export function FileViewerDialog({ fileId, fileName, onClose }: FileViewerDialogProps) {
  const [open, setOpen] = useState(true);
  const { files } = useFiles();
  const { replicas } = useReplicas(fileId);
  const { downloadFile } = useFileStorage();
  const [filePath, setFilePath] = useState<string | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'info'>('preview');
  
  useEffect(() => {
    const file = files.find(f => f.id === fileId);
    setFilePath(file?.storage_path);
  }, [fileId, files]);
  
  const handleClose = () => {
    setOpen(false);
    onClose();
  };
  
  const handleDownload = async () => {
    if (!filePath) return;
    
    setIsDownloading(true);
    try {
      await downloadFile(filePath, fileName);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const file = files.find(f => f.id === fileId);
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg md:max-w-xl border-0 shadow-xl rounded-lg overflow-hidden bg-gradient-to-b from-background to-background/80 backdrop-blur-sm">
        <DialogHeader className="relative border-b border-border/20 pb-3">
          <DialogTitle className="pr-8 truncate flex items-center">
            <FileText className="h-4 w-4 mr-2 text-primary" />
            {fileName}
          </DialogTitle>
          <DialogClose className="absolute right-0 top-0 opacity-70 hover:opacity-100 transition-opacity">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 pt-2">
          <div className="flex border-b border-border/10">
            <button
              onClick={() => setActiveTab('preview')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === 'preview' 
                  ? "border-b-2 border-primary text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="h-3.5 w-3.5 inline-block mr-1.5" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === 'info' 
                  ? "border-b-2 border-primary text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HardDrive className="h-3.5 w-3.5 inline-block mr-1.5" />
              Storage Info
            </button>
          </div>
          
          <div className="transition-all duration-300">
            {activeTab === 'preview' ? (
              <div className={slideUp.visible}>
                <FilePreview 
                  path={filePath} 
                  fileName={fileName} 
                  className="w-full max-h-[400px]"
                />
              </div>
            ) : (
              <div className={cn("space-y-4", slideInLeft.visible)}>
                <div className="bg-muted/30 rounded-md p-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <HardDrive className="h-4 w-4 mr-2 text-primary" />
                    Storage Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-background/50 p-3 rounded-md">
                      <p className="text-muted-foreground mb-1">Size</p>
                      <p className="font-medium">{file?.size || 0} MB</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded-md">
                      <p className="text-muted-foreground mb-1">Replicas</p>
                      <p className="font-medium">{replicas?.length || 0}</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded-md col-span-2">
                      <p className="text-muted-foreground mb-1">Path</p>
                      <p className="font-medium truncate">{filePath || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
                
                {replicas && replicas.length > 0 && (
                  <div className="bg-muted/30 rounded-md p-4">
                    <h3 className="text-sm font-medium mb-3">Stored on nodes:</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {replicas.map((replica) => (
                        <div 
                          key={replica.id} 
                          className="flex items-center text-sm bg-background/50 p-3 rounded-md transition-colors hover:bg-background"
                        >
                          <HardDrive className="h-3.5 w-3.5 mr-2 text-primary" />
                          <span>{replica.nodes?.name || "Unknown node"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-2 pt-2 border-t border-border/10">
            <Button 
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-blue-500 to-primary hover:from-blue-600 hover:to-primary/90 transition-colors"
              disabled={isDownloading || !filePath}
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
