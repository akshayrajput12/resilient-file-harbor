
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { toast } from '@/hooks/use-toast';

interface FileViewerDialogProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

export function FileViewerDialog({ 
  fileId,
  fileName,
  onClose
}: FileViewerDialogProps) {
  const [loading, setLoading] = useState(true);
  
  // Simulate file content loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDownload = () => {
    toast({
      title: "Downloading File",
      description: `Starting download for: ${fileName}`,
    });
    
    // Simulate download completion after a delay
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `File ${fileName} has been downloaded successfully`,
      });
    }, 1500);
  };
  
  const getFilePreview = () => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    // For demonstration - in a real app, we'd display actual content
    if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png' || fileExtension === 'gif') {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-full h-60 bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Image Preview Would Appear Here</p>
          </div>
        </div>
      );
    } else if (fileExtension === 'pdf') {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-full h-80 bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">PDF Preview Would Appear Here</p>
          </div>
        </div>
      );
    } else if (fileExtension === 'txt' || fileExtension === 'md' || fileExtension === 'json') {
      return (
        <div className="p-4">
          <pre className="p-4 bg-muted rounded-md whitespace-pre-wrap">
            {`This is simulated content for the file "${fileName}".\n\nIn a real implementation, this would contain the actual file content.\n\nFile ID: ${fileId}`}
          </pre>
        </div>
      );
    } else {
      return (
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
          <p className="text-sm">You can still download the file using the button below</p>
        </div>
      );
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="truncate max-w-[400px]">{fileName}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3">Loading preview...</span>
          </div>
        ) : (
          getFilePreview()
        )}
        
        <div className="flex justify-end mt-4">
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
