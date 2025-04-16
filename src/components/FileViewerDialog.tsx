
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { FilePreview } from './FilePreview';
import { useFiles } from '@/hooks/useFiles';
import { useFileStorage } from '@/hooks/useFileStorage';
import { motion } from 'framer-motion';

interface FileViewerDialogProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

export function FileViewerDialog({ fileId, fileName, onClose }: FileViewerDialogProps) {
  const [open, setOpen] = useState(true);
  const { files } = useFiles();
  const { downloadFile } = useFileStorage();
  const [filePath, setFilePath] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    const file = files.find(f => f.id === fileId);
    setFilePath(file?.storage_path);
  }, [fileId, files]);
  
  const handleClose = () => {
    setOpen(false);
    onClose();
  };
  
  const handleDownload = async () => {
    if (filePath) {
      await downloadFile(filePath, fileName);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
          <FilePreview 
            path={filePath} 
            fileName={fileName} 
            className="w-full"
          />
          
          <motion.div 
            className="w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleDownload}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
