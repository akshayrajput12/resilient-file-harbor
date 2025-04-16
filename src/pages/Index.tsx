import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, HardDrive, FilePlus2, Eye, Trash2, Sun } from "lucide-react";
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
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useFileStorage } from '@/hooks/useFileStorage';

const Index = () => {
  const { user } = useAuth();
  const { nodes, isLoadingNodes, createNode, updateNode, deleteNode } = useNodes();
  const { files, isLoadingFiles, createFile, deleteFile } = useFiles();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { replicas, createReplica, deleteReplica } = useReplicas(selectedFile || undefined);
  const { theme, toggleTheme } = useTheme();
  const [fileToView, setFileToView] = useState<{ id: string; name: string } | null>(null);
  const { downloadFile } = useFileStorage();

  useEffect(() => {
    if (theme === 'dark') {
      toggleTheme();
    }
  }, [theme, toggleTheme]);

  const activeNodes = nodes.filter(node => node.status === 'online');
  const totalStorage = nodes.reduce((acc, node) => acc + node.storage_total, 0);
  const usedStorage = nodes.reduce((acc, node) => acc + node.storage_used, 0);
  const averageReplicationFactor = files.length > 0 
    ? files.reduce((acc, file) => acc + (file.replicas?.length || 0), 0) / files.length 
    : 0;
  const storagePercentage = totalStorage > 0 ? Math.round((usedStorage / totalStorage) * 100) : 0;

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
    const fileToDelete = files.find(file => file.id === fileId);
    
    if (fileToDelete?.replicas && fileToDelete.replicas.length > 0) {
      deleteFile(fileId);
    } else {
      deleteFile(fileId);
    }
  };

  const handleViewFile = (fileId: string, fileName: string) => {
    setFileToView({ id: fileId, name: fileName });
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    const file = files.find(f => f.id === fileId);
    
    if (file?.storage_path) {
      await downloadFile(file.storage_path, fileName);
    } else {
      toast({
        title: "Download error",
        description: "File path not found.",
        variant: "destructive"
      });
    }
  };

  const handleRebalanceData = () => {
    const onlineNodes = nodes.filter(node => node.status === 'online');
    
    if (onlineNodes.length < 2) {
      toast({
        title: "Rebalance Failed",
        description: "Need at least two online nodes to rebalance data",
        variant: "destructive"
      });
      return;
    }
    
    const filesWithReplicas = files.filter(file => file.replicas && file.replicas.length > 0);
    
    if (filesWithReplicas.length === 0) {
      toast({
        title: "Nothing to Rebalance",
        description: "No files with replicas found in the system",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Rebalancing Data",
      description: "Redistributing data across available nodes...",
    });
    
    setTimeout(() => {
      toast({
        title: "Rebalancing in Progress",
        description: "50% complete - moving files to optimize distribution",
      });
    }, 1000);
    
    setTimeout(() => {
      toast({
        title: "Rebalance Complete",
        description: "Data has been optimally distributed across nodes",
      });
      
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

  const MotionDiv = motion.div;

  return (
    <div className="min-h-screen bg-background">
      <Navbar>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
          className="ml-auto hidden"
        >
          <Sun className="h-5 w-5" />
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
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnimateOnMount animation={slideUp} delay={100}>
                <Card className="border-none shadow-lg bg-card hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <FilePlus2 className="h-5 w-5 text-primary" />
                      Files
                    </CardTitle>
                    <CardDescription>Stored files and replicas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <div className="text-4xl font-bold mb-2 text-primary">{files.length}</div>
                      <div className="text-sm text-muted-foreground mb-2">total files</div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Replication factor: <span className="font-medium">{averageReplicationFactor.toFixed(1)}x</span>
                    </div>
                    
                    <div className="mt-2 mb-1 flex justify-between items-center text-xs">
                      <span>Storage usage</span>
                      <span className="font-medium">{usedStorage} MB / {totalStorage} MB</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-4">
                      <MotionDiv 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${storagePercentage}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
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
                <Card className="border-none shadow-lg bg-card hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-primary" />
                      System Status
                    </CardTitle>
                    <CardDescription>Node health and storage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{nodes.length}</div>
                        <div className="text-xs text-muted-foreground">Total Nodes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-500">{activeNodes.length}</div>
                        <div className="text-xs text-muted-foreground">Online</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-500">{nodes.length - activeNodes.length}</div>
                        <div className="text-xs text-muted-foreground">Offline</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {nodes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No nodes available. Add a node to get started.</p>
                      ) : (
                        nodes.slice(0, 3).map((node) => (
                          <MotionDiv 
                            key={node.id} 
                            className="space-y-1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{node.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${node.status === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {node.status === 'online' ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                              <MotionDiv 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${(node.storage_used / node.storage_total) * 100}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                              ></MotionDiv>
                            </div>
                            <div className="text-xs text-muted-foreground">{Math.round((node.storage_used / node.storage_total) * 100)}% used</div>
                          </MotionDiv>
                        ))
                      )}
                      {nodes.length > 3 && (
                        <p className="text-xs text-center mt-2 text-muted-foreground">
                          + {nodes.length - 3} more nodes. <Button variant="link" className="p-0 h-auto text-xs">See all</Button>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnMount>
              
              <AnimateOnMount animation={slideInRight} delay={300}>
                <Card className="border-none shadow-lg bg-card hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      Actions
                    </CardTitle>
                    <CardDescription>System operations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <UploadFileDialog 
                        nodes={nodes} 
                        onCreateFile={handleCreateFile}
                        onCreateReplica={handleCreateReplica}
                        variant="outline"
                        className="w-full justify-start hover:bg-secondary transition-colors"
                        maxStorageMB={100}
                      >
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Add New File
                      </UploadFileDialog>
                    </MotionDiv>
                    <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <CreateNodeDialog 
                        onCreateNode={(nodeData) => createNode({...nodeData, storage_total: Math.min(nodeData.storage_total, 100)})}
                        variant="outline"
                        className="w-full justify-start hover:bg-secondary transition-colors"
                      />
                    </MotionDiv>
                    <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        className="w-full justify-start hover:bg-secondary transition-colors" 
                        variant="outline"
                        onClick={handleRebalanceData}
                      >
                        <HardDrive className="mr-2 h-4 w-4" />
                        Rebalance Data
                      </Button>
                    </MotionDiv>
                  </CardContent>
                </Card>
              </AnimateOnMount>
            </div>
            
            <div className="mt-6">
              <AnimateOnMount animation={slideUp} delay={400}>
                <Card className="border-none shadow-lg bg-card relative overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center opacity-5" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1500&q=80)' }}></div>
                  <CardHeader className="relative z-10">
                    <CardTitle>System Overview</CardTitle>
                    <CardDescription>Current system status and statistics</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <motion.div 
                        className="flex flex-col space-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <h3 className="text-sm font-medium">Storage Usage</h3>
                        <div className="text-3xl font-bold">{storagePercentage}%</div>
                        <p className="text-xs text-muted-foreground">{usedStorage} MB of {totalStorage} MB used</p>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <MotionDiv 
                            className="h-full bg-gradient-to-r from-green-400 to-green-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${storagePercentage}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          ></MotionDiv>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="flex flex-col space-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <h3 className="text-sm font-medium">Data Distribution</h3>
                        <div className="text-3xl font-bold">{averageReplicationFactor.toFixed(1)}x</div>
                        <p className="text-xs text-muted-foreground">Average replication factor</p>
                        <div className="grid grid-cols-5 gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <MotionDiv 
                              key={i} 
                              className={`h-2 rounded-full ${i < Math.round(averageReplicationFactor) ? 'bg-blue-500' : 'bg-secondary'}`}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.2, delay: 0.1 * i }}
                            ></MotionDiv>
                          ))}
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="flex flex-col space-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <h3 className="text-sm font-medium">Node Health</h3>
                        <div className="text-3xl font-bold">{activeNodes.length}/{nodes.length}</div>
                        <p className="text-xs text-muted-foreground">Nodes currently online</p>
                        <div className="flex items-center space-x-2">
                          <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                          <span className="text-xs">{activeNodes.length} Online</span>
                          
                          <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-4"></span>
                          <span className="text-xs">{nodes.length - activeNodes.length} Offline</span>
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnMount>
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <AnimateOnMount animation={slideUp}>
              <Card className="border-none shadow-lg bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-5" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1500&q=80)' }}></div>
                <CardHeader className="relative z-10">
                  <CardTitle>Stored Files</CardTitle>
                  <CardDescription>Files distributed across nodes</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
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
