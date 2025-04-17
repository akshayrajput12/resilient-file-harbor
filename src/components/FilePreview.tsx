
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { File, Image, FileText, Music, Video, Package, FileQuestion } from "lucide-react";
import { useFileStorage } from '@/hooks/useFileStorage';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FilePreviewProps {
  path?: string;
  fileName: string;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ path, fileName, className }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getFilePreviewUrl } = useFileStorage();
  
  useEffect(() => {
    const getPreview = async () => {
      setIsLoading(true);
      
      if (path) {
        try {
          const url = await getFilePreviewUrl(path);
          setPreviewUrl(url);
          
          // Determine file type from extension
          const extension = fileName.split('.').pop()?.toLowerCase() || '';
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            setFileType('image');
          } else if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
            setFileType('video');
          } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
            setFileType('audio');
          } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'].includes(extension)) {
            setFileType('document');
          } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
            setFileType('archive');
          } else {
            setFileType('other');
          }
        } catch (error) {
          console.error('Error getting file preview:', error);
          setFileType('other');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    getPreview();
  }, [path, fileName, getFilePreviewUrl]);
  
  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center w-full h-full min-h-[200px]">
          <motion.div 
            animate={{ 
              rotate: 360,
              transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
            }}
            className="h-10 w-10"
          >
            <div className="h-10 w-10 border-2 border-primary rounded-full border-t-transparent"></div>
          </motion.div>
        </div>
      );
    }
    
    if (!previewUrl) {
      return renderFileIcon();
    }
    
    if (fileType === 'image') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center w-full"
        >
          <img 
            src={previewUrl} 
            alt={fileName} 
            className="w-full h-auto max-h-[350px] object-contain rounded-md"
            onError={() => setFileType('other')} // Fallback if image can't be loaded
          />
        </motion.div>
      );
    }
    
    if (fileType === 'video') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <video 
            src={previewUrl} 
            controls 
            className="w-full h-auto max-h-[350px] rounded-md"
            onError={() => setFileType('other')} // Fallback if video can't be loaded
          />
        </motion.div>
      );
    }
    
    if (fileType === 'audio') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-secondary/30 p-4 rounded-md"
        >
          <audio 
            src={previewUrl} 
            controls 
            className="w-full"
            onError={() => setFileType('other')} // Fallback if audio can't be loaded
          />
          <div className="mt-2 flex items-center justify-center">
            <Music className="h-6 w-6 text-primary mr-2" />
            <span className="text-sm font-medium">{fileName}</span>
          </div>
        </motion.div>
      );
    }
    
    if (fileType === 'document') {
      // For documents that might be viewable directly, we can try to embed them
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-[350px] bg-secondary/10 rounded-md overflow-hidden"
        >
          <iframe 
            src={previewUrl} 
            className="w-full h-full border-0"
            title={fileName}
            onError={() => setFileType('other')}
          />
        </motion.div>
      );
    }
    
    return renderFileIcon();
  };
  
  const renderFileIcon = () => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <div className="bg-gradient-to-br from-background to-secondary/30 p-6 rounded-full mb-4 shadow-inner">
          {renderIcon()}
        </div>
        <h3 className="text-base font-medium text-foreground mb-1">{fileName}</h3>
        <p className="text-sm text-muted-foreground">{fileType || 'Unknown file type'}</p>
      </motion.div>
    );
  };
  
  const renderIcon = () => {
    const iconClass = "h-16 w-16 text-primary";
    
    switch(fileType) {
      case 'document':
        return <FileText className={iconClass} />;
      case 'image':
        return <Image className={iconClass} />;
      case 'audio':
        return <Music className={iconClass} />;
      case 'video':
        return <Video className={iconClass} />;
      case 'archive':
        return <Package className={iconClass} />;
      default:
        return <FileQuestion className={iconClass} />;
    }
  };
  
  return (
    <div className={cn("overflow-hidden", className)}>
      <Card className="overflow-hidden border border-border/20 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-b from-card to-card/90">
        <CardContent className="p-4">
          {renderPreview()}
        </CardContent>
      </Card>
    </div>
  );
};
