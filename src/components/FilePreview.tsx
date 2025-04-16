
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { File, Image, FileText, Music, Video, Package, FileQuestion } from "lucide-react";
import { useFileStorage } from '@/hooks/useFileStorage';
import { motion } from 'framer-motion';

interface FilePreviewProps {
  path?: string;
  fileName: string;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ path, fileName, className }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const { getFilePreviewUrl } = useFileStorage();
  
  useEffect(() => {
    const getPreview = async () => {
      if (path) {
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
      }
    };
    
    getPreview();
  }, [path, fileName]);
  
  const renderPreview = () => {
    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center w-full h-full min-h-[120px]">
          <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      );
    }
    
    if (fileType === 'image') {
      return (
        <img 
          src={previewUrl} 
          alt={fileName} 
          className="w-full h-auto max-h-[200px] object-contain"
          onError={(e) => setFileType('other')} // Fallback if image can't be loaded
        />
      );
    }
    
    if (fileType === 'video') {
      return (
        <video 
          src={previewUrl} 
          controls 
          className="w-full h-auto max-h-[200px]"
          onError={(e) => setFileType('other')} // Fallback if video can't be loaded
        />
      );
    }
    
    if (fileType === 'audio') {
      return (
        <audio 
          src={previewUrl} 
          controls 
          className="w-full"
          onError={(e) => setFileType('other')} // Fallback if audio can't be loaded
        />
      );
    }
    
    return renderFileIcon();
  };
  
  const renderFileIcon = () => {
    const iconClass = "h-12 w-12 text-primary";
    
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-3">
          <div className="flex flex-col items-center justify-center">
            {renderPreview()}
            <div className="mt-2 text-center">
              <p className="text-sm font-medium truncate max-w-[180px]">{fileName}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
