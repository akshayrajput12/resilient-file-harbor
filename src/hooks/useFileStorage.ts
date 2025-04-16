
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';

export function useFileStorage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const uploadFile = async (file: File): Promise<{ url: string, path: string } | null> => {
    if (!file) return null;
    
    setIsUploading(true);
    
    try {
      // Create a unique file path with original extension
      const fileExt = file.name.split('.').pop();
      const filePath = `${uuidv4()}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('file_uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('file_uploads')
        .getPublicUrl(data.path);
        
      return {
        url: publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  const downloadFile = async (path: string, fileName: string): Promise<void> => {
    setIsDownloading(true);
    
    try {
      const { data, error } = await supabase.storage
        .from('file_uploads')
        .download(path);
        
      if (error) throw error;
      
      // Create a download link for the file
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: 'Download successful',
        description: `File ${fileName} has been downloaded`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  const getFilePreviewUrl = async (path: string): Promise<string | null> => {
    try {
      const { data } = supabase.storage
        .from('file_uploads')
        .getPublicUrl(path);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting file preview URL:', error);
      return null;
    }
  };
  
  const deleteFile = async (path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('file_uploads')
        .remove([path]);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
      return false;
    }
  };
  
  return {
    uploadFile,
    downloadFile,
    getFilePreviewUrl,
    deleteFile,
    isUploading,
    isDownloading
  };
}
