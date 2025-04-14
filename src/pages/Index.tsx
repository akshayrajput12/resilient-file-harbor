
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, HardDrive, FilePlus2, Eye, SunIcon, MoonIcon, Database, ServerIcon, FileIcon } from "lucide-react";
import AnimateOnMount from '@/components/AnimateOnMount';
import { fadeIn, slideUp, slideInLeft, slideInRight } from '@/lib/animation';
import { useNodes } from '@/hooks/useNodes';
import { useFiles } from '@/hooks/useFiles';
import { CreateNodeDialog } from '@/components/CreateNodeDialog';
import { UploadFileDialog } from '@/components/UploadFileDialog';
import { NodeCard } from '@/components/NodeCard';
import { FileTable } from '@/components/FileTable';
import { useAuth } from '@/contexts/AuthContext';
import { ReplicaInsert } from '@/types/supabase';
import Navbar from '@/components/Navbar';
import { useReplicas } from '@/hooks/useReplicas';
import { toast } from '@/hooks/use-toast';
import { FileViewer } from '@/components/FileViewer';
import { useTheme } from '@/contexts/ThemeContext';

const MAX_NODE_STORAGE = 100; // 100MB max per node

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { nodes, isLoadingNodes, createNode, updateNode } = useNodes();
  const { files, isLoadingFiles, createFile, deleteFile } = useFiles();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { replicas, createReplica } = useReplicas(selectedFile || undefined);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<any>(null);

  const activeNodes = nodes.filter(node => node.status === 'online');
  const totalStorage = nodes.reduce((acc, node) => acc + node.storage_total, 0);
  const usedStorage = nodes.reduce((acc, node) => acc + node.storage_used, 0);
  const availableStorage = totalStorage - usedStorage;
  const storagePercentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;
  const averageReplicationFactor = files.length > 0 
    ? files.reduce((acc, file) => acc + (file.replicas?.length || 0), 0) / files.length 
    : 0;

  const handleToggleNodeStatus = (nodeId: string, status: string) => {
    updateNode({ id: nodeId, status });
  };

  const handleCreateFile = async (fileData: any) => {
    return await new Promise((resolve, reject) => {
      createFile(fileData, {
        onSuccess: (data) => resolve(data),
        onError: (error) => reject(error)
      });
    });
  };

  const handleCreateReplica = async (replicaData: ReplicaInsert) => {
    await createReplica(replicaData);
    return Promise.resolve();
  };

  const handleViewFile = (fileId: string, fileName: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setViewingFile(file);
      setIsViewerOpen(true);
    }
  };

  const handleDownloadFile = (fileId: string, fileName: string) => {
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
    }, 2000);
  };

  const handleRebalanceData = () => {
    // Get available online nodes
    const onlineNodes = nodes.filter(node => node.status === 'online');
    
    if (onlineNodes.length < 2) {
      toast({
        title: "Rebalance Failed",
        description: "Need at least two online nodes to rebalance data",
        variant: "destructive"
      });
      return;
    }
    
    // Get all files with their replicas
    const filesWithReplicas = files.filter(file => file.replicas && file.replicas.length > 0);
    
    if (filesWithReplicas.length === 0) {
      toast({
        title: "Nothing to Rebalance",
        description: "No files with replicas found in the system",
        variant: "destructive"
      });
      return;
    }
    
    // Start rebalancing simulation
    toast({
      title: "Rebalancing Data",
      description: "Redistributing data across available nodes...",
    });
    
    // Simulate rebalancing progress
    setTimeout(() => {
      toast({
        title: "Rebalancing in Progress",
        description: "50% complete - moving files to optimize distribution",
      });
    }, 1000);
    
    // Simulate rebalance completion
    setTimeout(() => {
      toast({
        title: "Rebalance Complete",
        description: "Data has been optimally distributed across nodes",
      });
      
      // Show detailed results
      setTimeout(() => {
        toast({
          title: "Rebalance Results",
          description: `Balanced ${filesWithReplicas.length} files across ${onlineNodes.length} nodes`,
        });
      }, 500);
    }, 3000);
  };

  const renderStorageUsage = () => {
    // Different colors based on storage usage percentage
    let colorClass = "bg-green-500 dark:bg-green-600";
    if (storagePercentage > 70) colorClass = "bg-yellow-500 dark:bg-yellow-600";
    if (storagePercentage > 90) colorClass = "bg-red-500 dark:bg-red-600";
    
    return (
      <div className="space-y-2">
        <div className="text-xs flex justify-between">
          <span>{usedStorage} MB used</span>
          <span>{totalStorage} MB total</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} transition-all duration-500`}
            style={{ width: `${storagePercentage}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {availableStorage} MB available ({storagePercentage.toFixed(1)}% used)
        </div>
      </div>
    );
  };

  if (isLoadingNodes || isLoadingFiles) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading your distributed system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
          className="ml-auto"
        >
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </Button>
      </Navbar>
      
      <div className="p-4 md:p-8 container max-w-7xl">
        <AnimateOnMount animation={fadeIn} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-500 dark:from-purple-400 dark:to-blue-500 bg-clip-text text-transparent">
            Distributed File System
          </h1>
          <p className="text-muted-foreground">
            Store files across multiple nodes with fault tolerance and high availability
          </p>
        </AnimateOnMount>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <Database className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileIcon className="h-4 w-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="nodes" className="gap-2">
              <ServerIcon className="h-4 w-4" />
              Nodes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimateOnMount animation={slideUp} delay={100}>
                <Card className="border dark:border-gray-800 overflow-hidden relative transition-all duration-300 hover:shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 pointer-events-none" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileIcon className="h-5 w-5 text-primary" />
                      Files
                    </CardTitle>
                    <CardDescription>Stored files and replicas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-2 text-primary">{files.length}</div>
                    <div className="text-sm text-muted-foreground">
                      Total replication factor: {averageReplicationFactor.toFixed(1)}x
                    </div>
                    <div className="mt-4 flex gap-2">
                      <UploadFileDialog 
                        nodes={nodes} 
                        onCreateFile={handleCreateFile}
                        onCreateReplica={handleCreateReplica}
                        maxFileSizeMB={MAX_NODE_STORAGE}
                      />
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnMount>
              
              <AnimateOnMount animation={slideInLeft} delay={200}>
                <Card className="border dark:border-gray-800 overflow-hidden relative transition-all duration-300 hover:shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-500/10 pointer-events-none" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ServerIcon className="h-5 w-5 text-blue-500" />
                      System Status
                    </CardTitle>
                    <CardDescription>Node health and storage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {nodes.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">No nodes available</p>
                        <CreateNodeDialog 
                          onCreateNode={(nodeData) => createNode(nodeData)} 
                          maxStorageMB={MAX_NODE_STORAGE}
                        />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">System Storage</span>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {activeNodes.length}/{nodes.length} nodes online
                          </span>
                        </div>
                        
                        {renderStorageUsage()}
                        
                        <div className="space-y-3 mt-4">
                          {nodes.slice(0, 3).map((node) => (
                            <div key={node.id} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">{node.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  node.status === 'online' ? 
                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {node.status === 'online' ? 'Online' : 'Offline'}
                                </span>
                              </div>
                              <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="absolute top-0 left-0 h-full bg-blue-500 dark:bg-blue-600 transition-all duration-300"
                                  style={{ width: `${(node.storage_used / node.storage_total) * 100}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-muted-foreground">{Math.round((node.storage_used / node.storage_total) * 100)}% used</div>
                            </div>
                          ))}
                          
                          {nodes.length > 3 && (
                            <div className="text-center pt-2">
                              <Button variant="link" size="sm" asChild>
                                <a href="#nodes-tab">View all {nodes.length} nodes</a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AnimateOnMount>
              
              <AnimateOnMount animation={slideInRight} delay={300}>
                <Card className="border dark:border-gray-800 overflow-hidden relative transition-all duration-300 hover:shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent dark:from-purple-500/10 pointer-events-none" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-purple-500" />
                      Actions
                    </CardTitle>
                    <CardDescription>System operations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <UploadFileDialog 
                      nodes={nodes} 
                      onCreateFile={handleCreateFile}
                      onCreateReplica={handleCreateReplica}
                      variant="outline"
                      className="w-full justify-start"
                      maxFileSizeMB={MAX_NODE_STORAGE}
                    >
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      Add New File
                    </UploadFileDialog>
                    <CreateNodeDialog 
                      onCreateNode={(nodeData) => createNode(nodeData)}
                      variant="outline"
                      className="w-full justify-start"
                      maxStorageMB={MAX_NODE_STORAGE}
                    />
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={handleRebalanceData}
                    >
                      <HardDrive className="mr-2 h-4 w-4" />
                      Rebalance Data
                    </Button>
                  </CardContent>
                </Card>
              </AnimateOnMount>
            </div>
          </TabsContent>
          
          <TabsContent value="files" id="files-tab">
            <AnimateOnMount animation={slideUp}>
              <Card className="border dark:border-gray-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 pointer-events-none" />
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Stored Files</CardTitle>
                    <CardDescription>Files distributed across nodes</CardDescription>
                  </div>
                  <UploadFileDialog 
                    nodes={nodes} 
                    onCreateFile={handleCreateFile}
                    onCreateReplica={handleCreateReplica}
                    maxFileSizeMB={MAX_NODE_STORAGE}
                  />
                </CardHeader>
                <CardContent>
                  <FileTable 
                    files={files} 
                    nodes={nodes} 
                    onDeleteFile={(fileId) => deleteFile(fileId)}
                    onViewFile={handleViewFile}
                    onDownloadFile={handleDownloadFile}
                  />
                </CardContent>
              </Card>
            </AnimateOnMount>
          </TabsContent>
          
          <TabsContent value="nodes" id="nodes-tab">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nodes.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <AnimateOnMount animation={slideUp}>
                    <p className="text-muted-foreground mb-4">No nodes available</p>
                    <CreateNodeDialog 
                      onCreateNode={(nodeData) => createNode(nodeData)}
                      maxStorageMB={MAX_NODE_STORAGE}
                    />
                  </AnimateOnMount>
                </div>
              ) : (
                nodes.map((node, i) => (
                  <AnimateOnMount key={node.id} animation={slideUp} delay={i * 100}>
                    <NodeCard 
                      node={node} 
                      files={files}
                      onToggleStatus={handleToggleNodeStatus}
                    />
                  </AnimateOnMount>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {viewingFile && (
        <FileViewer 
          file={viewingFile} 
          isOpen={isViewerOpen} 
          onClose={() => setIsViewerOpen(false)} 
        />
      )}
    </div>
  );
};

export default Index;
