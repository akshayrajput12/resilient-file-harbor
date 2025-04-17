
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Eye, FileText } from "lucide-react";
import { FilePreview } from './FilePreview';
import { useFiles } from '@/hooks/useFiles';
import { useFileStorage } from '@/hooks/useFileStorage';
import { motion, AnimatePresence } from 'framer-motion';
import { useReplicas } from '@/hooks/useReplicas';
import { Node } from '@/types/supabase';
import { HardDrive } from 'lucide-react';

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
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-xl rounded-lg overflow-hidden bg-gradient-to-b from-background to-background/80 backdrop-blur-sm">
        <DialogHeader className="relative">
          <DialogTitle className="pr-8 truncate">{fileName}</DialogTitle>
          <DialogClose className="absolute right-0 top-0 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <FilePreview 
                path={filePath} 
                fileName={fileName} 
                className="w-full"
              />
            </motion.div>
          </AnimatePresence>
          
          {replicas && replicas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="bg-muted/30 rounded-md p-3"
            >
              <h3 className="text-sm font-medium mb-2">Stored on nodes:</h3>
              <div className="grid grid-cols-1 gap-2">
                {replicas.map((replica) => (
                  <div key={replica.id} className="flex items-center text-sm bg-background/50 p-2 rounded">
                    <HardDrive className="h-3.5 w-3.5 mr-2 text-primary" />
                    <span>{replica.nodes?.name || "Unknown node"}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          <motion.div 
            className="w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleDownload}
              className="w-full gradient-btn"
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
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
