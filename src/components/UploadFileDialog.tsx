
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, FilePlus, HardDrive, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Node, FileInsert, ReplicaInsert } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface UploadFileDialogProps {
  nodes: Node[];
  onCreateFile: (file: FileInsert) => Promise<any>;
  onCreateReplica: (replica: ReplicaInsert) => Promise<any>;
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  className?: string;
  maxStorageMB?: number;
}

export function UploadFileDialog({ 
  nodes, 
  onCreateFile, 
  onCreateReplica,
  children,
  variant = "default",
  className,
  maxStorageMB = 100
}: UploadFileDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const { uploadFile, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  
  const onlineNodes = nodes.filter(node => node.status === 'online');
  
  // Simulate progress during upload
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isUploading) {
      setUploadState('uploading');
      setUploadProgress(0);
      
      interval = setInterval(() => {
        setUploadProgress(prev => {
          // Slow down as we approach 90%
          const increment = prev < 30 ? 15 : prev < 60 ? 8 : prev < 85 ? 3 : 1;
          const newValue = Math.min(prev + increment, 90);
          return newValue;
        });
      }, 300);
    } else if (uploadState === 'uploading') {
      // If we were uploading and now isUploading is false, set to 100%
      setUploadProgress(100);
      // We'll handle success/error state elsewhere
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isUploading, uploadState]);
  
  // Handle drag and drop
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.add('bg-primary/5', 'border-primary');
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.remove('bg-primary/5', 'border-primary');
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.remove('bg-primary/5', 'border-primary');
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    };
    
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    
    return () => {
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, []);
  
  const handleFile = (file: globalThis.File) => {
    const fileSizeMB = Math.ceil(file.size / (1024 * 1024));
    
    if (fileSizeMB > maxStorageMB) {
      toast({
        title: "File too large",
        description: `File size exceeds the maximum allowed size of ${maxStorageMB}MB`,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
    // If we have only one node, select it automatically
    if (onlineNodes.length === 1) {
      setSelectedNodes([onlineNodes[0].id]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSelectAllNodes = () => {
    // Only select nodes that have enough space
    if (selectedFile) {
      const fileSizeMB = Math.ceil(selectedFile.size / (1024 * 1024));
      const availableNodes = onlineNodes.filter(node => 
        (node.storage_total - node.storage_used) >= fileSizeMB
      ).map(node => node.id);
      
      setSelectedNodes(availableNodes);
    } else {
      setSelectedNodes(onlineNodes.map(node => node.id));
    }
  };
  
  const handleClearSelection = () => {
    setSelectedNodes([]);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: "File required",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedNodes.length === 0) {
      toast({
        title: "No nodes selected",
        description: "Please select at least one node for storage",
        variant: "destructive"
      });
      return;
    }
    
    setUploadState('uploading');
    
    try {
      const result = await uploadFile(selectedFile, selectedNodes);
      
      if (result !== null) {
        setUploadState('success');
        setTimeout(() => {
          setSelectedFile(null);
          setSelectedNodes([]);
          setUploadProgress(0);
          setUploadState('idle');
          setOpen(false);
        }, 1500);
      } else {
        setUploadState('error');
      }
    } catch (error) {
      setUploadState('error');
      console.error('Upload error:', error);
    }
  };
  
  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="w-12 h-12 text-muted-foreground" />;
    
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="m10 7 5 3-5 3Z"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg>;
    } else if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 17v-8"/><path d="m16 16-4 1-4-1"/></svg>;
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
      return <FileText className="w-12 h-12 text-rose-500" />;
    } else {
      return <FilePlus className="w-12 h-12 text-amber-500" />;
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Calculate the total available storage across selected nodes
  const totalSelectedStorage = selectedNodes.reduce((total, nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return total + (node ? node.storage_total - node.storage_used : 0);
  }, 0);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          {children || (
            <>
              <FilePlus className="h-4 w-4 mr-2" />
              Upload File
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-0 shadow-lg rounded-lg overflow-hidden bg-gradient-to-b from-background to-background/80 backdrop-blur-sm">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-center text-xl font-semibold">
            Upload to Distributed Storage
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6">
          {/* File Upload Area */}
          <div 
            ref={dropAreaRef}
            className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 transition-colors duration-200 cursor-pointer text-center"
            onClick={handleUploadClick}
          >
            <input
              type="file"
              id="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            <AnimatePresence mode="wait">
              {!selectedFile ? (
                <motion.div
                  key="upload-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-6 flex flex-col items-center justify-center"
                >
                  <div className="mb-3 rounded-full bg-primary/10 p-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-lg font-medium">Drag & drop or click to upload</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Max file size: {maxStorageMB} MB
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="file-preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-4 flex items-center"
                >
                  <div className="mr-4 flex-shrink-0">
                    {getFileIcon()}
                  </div>
                  <div className="flex-grow text-left">
                    <h3 className="font-medium truncate max-w-[180px]">{selectedFile.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Node Selection Area */}
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Select Storage Nodes</Label>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={handleSelectAllNodes}
                  >
                    Select All
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={handleClearSelection}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-background/70">
                {onlineNodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 px-2">No online nodes available</p>
                ) : (
                  onlineNodes.map((node) => {
                    const fileSizeMB = selectedFile ? Math.ceil(selectedFile.size / (1024 * 1024)) : 0;
                    const availableStorage = node.storage_total - node.storage_used;
                    const hasEnoughSpace = availableStorage >= fileSizeMB;
                    const isSelected = selectedNodes.includes(node.id);
                    
                    return (
                      <motion.div 
                        key={node.id} 
                        className={`flex items-center p-2 rounded-md border transition-colors ${isSelected ? 'bg-primary/10 border-primary/30' : 'border-transparent'} ${!hasEnoughSpace ? 'opacity-60' : ''}`}
                        whileHover={{ scale: hasEnoughSpace ? 1.02 : 1 }}
                        whileTap={{ scale: hasEnoughSpace ? 0.98 : 1 }}
                      >
                        <div className="flex-1 flex items-center">
                          <div className={`mr-3 p-1 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                            <HardDrive className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{node.name}</p>
                            <div className="flex items-center">
                              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mr-2">
                                <div 
                                  className="h-full bg-blue-500" 
                                  style={{ width: `${(node.storage_used / node.storage_total) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{node.storage_used}/{node.storage_total} MB</span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          id={`node-${node.id}`}
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNodes([...selectedNodes, node.id]);
                            } else {
                              setSelectedNodes(selectedNodes.filter(id => id !== node.id));
                            }
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary mr-1"
                          disabled={!hasEnoughSpace}
                        />
                      </motion.div>
                    );
                  })
                )}
              </div>
              
              {selectedNodes.length > 0 && (
                <div className="text-sm flex items-center justify-between bg-primary/5 p-2 rounded-md">
                  <div>
                    <span className="font-medium">Replication Factor:</span> {selectedNodes.length}x
                  </div>
                  <div>
                    <span className="font-medium">Available Space:</span> {totalSelectedStorage} MB
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Upload Progress */}
          {uploadState !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {uploadState === 'uploading' ? 'Uploading...' : 
                   uploadState === 'success' ? 'Upload Complete!' :
                   'Upload Failed'}
                </span>
                <span className="text-sm">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              
              {uploadState === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center text-green-500 mt-2"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  <span>File uploaded successfully!</span>
                </motion.div>
              )}
              
              {uploadState === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center text-destructive mt-2"
                >
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <span>Something went wrong. Please try again.</span>
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isUploading || onlineNodes.length === 0 || selectedNodes.length === 0 || !selectedFile || uploadState === 'success'}
            className="w-full gradient-btn"
          >
            {uploadState === 'uploading' ? "Uploading..." : 
             uploadState === 'success' ? "Uploaded!" :
             uploadState === 'error' ? "Retry Upload" :
             "Upload to Network"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
