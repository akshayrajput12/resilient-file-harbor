
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, HardDrive, FilePlus2, Eye, Trash2, Sun, Moon } from "lucide-react";
import AnimateOnMount from '@/components/AnimateOnMount';
import { slideUp, slideInLeft, slideInRight } from '@/lib/animation';
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
import { FileViewerDialog } from '@/components/FileViewerDialog';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/components/ui/motion';

const Index = () => {
  const { user } = useAuth();
  const { nodes, isLoadingNodes, createNode, updateNode, deleteNode } = useNodes();
  const { files, isLoadingFiles, createFile, deleteFile } = useFiles();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { replicas, createReplica, deleteReplica } = useReplicas(selectedFile || undefined);
  const { theme, toggleTheme } = useTheme();
  const [fileToView, setFileToView] = useState<{ id: string; name: string } | null>(null);

  const activeNodes = nodes.filter(node => node.status === 'online');
  const totalStorage = nodes.reduce((acc, node) => acc + node.storage_total, 0);
  const usedStorage = nodes.reduce((acc, node) => acc + node.storage_used, 0);
  const averageReplicationFactor = files.length > 0 
    ? files.reduce((acc, file) => acc + (file.replicas?.length || 0), 0) / files.length 
    : 0;

  const handleToggleNodeStatus = (nodeId: string, status: string) => {
    updateNode({ id: nodeId, status });
  };

  const handleDeleteNode = async (nodeId: string) => {
    const nodeFiles = files.filter(file => 
      file.replicas?.some(replica => replica.node_id === nodeId)
    );

    if (nodeFiles.length > 0) {
      toast({
        title: "Cannot delete node",
        description: "This node contains files. Please delete the files first or move them to another node.",
        variant: "destructive"
      });
      return;
    }

    deleteNode(nodeId);
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

  const handleDeleteFile = async (fileId: string) => {
    // First we need to get all replicas for this file
    const fileToDelete = files.find(file => file.id === fileId);
    
    if (fileToDelete?.replicas && fileToDelete.replicas.length > 0) {
      // Delete the file - this will cascade delete all replicas
      deleteFile(fileId);
    } else {
      // No replicas, just delete the file
      deleteFile(fileId);
    }
  };

  const handleViewFile = (fileId: string, fileName: string) => {
    setFileToView({ id: fileId, name: fileName });
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

  if (isLoadingNodes || isLoadingFiles) {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading your distributed file system...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
          className="ml-auto"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </Navbar>
      <div className="p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Distributed File System</h1>
          <p className="text-muted-foreground">Store files across multiple nodes with fault tolerance</p>
        </motion.div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="files">
              <span>Files</span>
            </TabsTrigger>
            <TabsTrigger value="nodes">
              <span>Nodes</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimateOnMount animation={slideUp} delay={100}>
                <Card className="border-none shadow-lg bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle>Files</CardTitle>
                    <CardDescription>Stored files and replicas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-2 text-primary">{files.length}</div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Total replication factor: {averageReplicationFactor.toFixed(1)}x
                    </div>
                    <div className="mt-4 flex gap-2">
                      <UploadFileDialog 
                        nodes={nodes} 
                        onCreateFile={handleCreateFile}
                        onCreateReplica={handleCreateReplica}
                        maxStorageMB={100}
                      />
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnMount>
              
              <AnimateOnMount animation={slideInLeft} delay={200}>
                <Card className="border-none shadow-lg bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>Node health and storage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {nodes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No nodes available. Add a node to get started.</p>
                      ) : (
                        nodes.map((node) => (
                          <motion.div 
                            key={node.id} 
                            className="space-y-1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{node.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${node.status === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {node.status === 'online' ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div 
                                className="absolute top-0 left-0 h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${(node.storage_used / node.storage_total) * 100}%` }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                              ></motion.div>
                            </div>
                            <div className="text-xs text-muted-foreground">{Math.round((node.storage_used / node.storage_total) * 100)}% used</div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnMount>
              
              <AnimateOnMount animation={slideInRight} delay={300}>
                <Card className="border-none shadow-lg bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>System operations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <UploadFileDialog 
                      nodes={nodes} 
                      onCreateFile={handleCreateFile}
                      onCreateReplica={handleCreateReplica}
                      variant="outline"
                      className="w-full justify-start"
                      maxStorageMB={100}
                    >
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      Add New File
                    </UploadFileDialog>
                    <CreateNodeDialog 
                      onCreateNode={(nodeData) => createNode({...nodeData, storage_total: Math.min(nodeData.storage_total, 100)})}
                      variant="outline"
                      className="w-full justify-start"
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
          
          <TabsContent value="files">
            <AnimateOnMount animation={slideUp}>
              <Card className="border-none shadow-lg bg-card">
                <CardHeader>
                  <CardTitle>Stored Files</CardTitle>
                  <CardDescription>Files distributed across nodes</CardDescription>
                </CardHeader>
                <CardContent>
                  <FileTable 
                    files={files} 
                    nodes={nodes} 
                    onDeleteFile={handleDeleteFile}
                    onViewFile={handleViewFile}
                    onDownloadFile={handleDownloadFile}
                  />
                </CardContent>
              </Card>
            </AnimateOnMount>
          </TabsContent>
          
          <TabsContent value="nodes">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {nodes.length === 0 ? (
                <div className="col-span-3 text-center py-8">
                  <p className="text-muted-foreground mb-4">No nodes available</p>
                  <CreateNodeDialog 
                    onCreateNode={(nodeData) => createNode({...nodeData, storage_total: Math.min(nodeData.storage_total, 100)})} 
                  />
                </div>
              ) : (
                nodes.map((node, i) => (
                  <AnimateOnMount key={node.id} animation={slideUp} delay={i * 100}>
                    <NodeCard 
                      node={node} 
                      files={files}
                      onToggleStatus={handleToggleNodeStatus}
                      onDeleteNode={handleDeleteNode}
                    />
                  </AnimateOnMount>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {fileToView && (
        <FileViewerDialog
          fileId={fileToView.id}
          fileName={fileToView.name}
          onClose={() => setFileToView(null)}
        />
      )}
    </div>
  );
};

export default Index;
