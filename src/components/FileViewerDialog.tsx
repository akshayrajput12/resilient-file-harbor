
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
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDownload = () => {
    toast({
      title: "Downloading File",
      description: `Starting download for: ${fileName}`,
    });
    
    // Create a blob and trigger download
    // In a real app, this would fetch from an API
    const dummyContent = `This is simulated content for the file "${fileName}".\n\nIn a real implementation, this would contain the actual file content.\n\nFile ID: ${fileId}`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `File ${fileName} has been downloaded successfully`,
      });
    }, 1000);
  };
  
  const getFilePreview = () => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    // Generate a realistic preview based on file type
    if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png' || fileExtension === 'gif') {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-full h-60 bg-muted rounded-md flex items-center justify-center overflow-hidden">
            {/* Generate a color-based preview for images */}
            <div className="w-full h-full" style={{ 
              background: `linear-gradient(45deg, #${fileId.substring(0,6)}, #${fileId.substring(6,12)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <p className="text-white font-bold text-xl drop-shadow-lg">Image Preview</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Dimensions: 800x600px | Size: {Math.floor(Math.random() * 5) + 1}MB</p>
        </div>
      );
    } else if (fileExtension === 'pdf') {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-full h-80 bg-muted rounded-md flex flex-col items-center justify-center overflow-hidden">
            <div className="bg-red-500 text-white py-8 w-full flex justify-center items-center">
              <span className="font-bold">.PDF</span>
            </div>
            <div className="p-6 flex-1 w-full flex flex-col">
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Pages: {Math.floor(Math.random() * 10) + 1} | Size: {Math.floor(Math.random() * 8) + 2}MB</p>
        </div>
      );
    } else if (fileExtension === 'txt' || fileExtension === 'md' || fileExtension === 'json') {
      // For text files, show simulated content
      return (
        <div className="p-4">
          <pre className="p-4 bg-muted rounded-md whitespace-pre-wrap max-h-80 overflow-auto">
            {`This is simulated content for the file "${fileName}".\n\nIn a real implementation, this would contain the actual file content loaded from the server.\n\nFile ID: ${fileId}\n\n` + 
            Array(10).fill(0).map((_, i) => `Line ${i+1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n`).join('')}
          </pre>
          <p className="mt-4 text-sm text-muted-foreground">Lines: {Math.floor(Math.random() * 50) + 10} | Size: {Math.floor(Math.random() * 2) + 0.1}MB</p>
        </div>
      );
    } else {
      return (
        <div className="p-8 text-center">
          <div className="w-24 h-24 mx-auto bg-muted rounded-md flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-muted-foreground">.{fileExtension}</span>
          </div>
          <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
          <p className="text-sm">You can still download the file using the button below</p>
          <p className="mt-4 text-sm text-muted-foreground">Size: {Math.floor(Math.random() * 10) + 1}MB</p>
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
