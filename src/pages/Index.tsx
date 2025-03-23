
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, HardDrive, Server, FilePlus2, FileX } from "lucide-react";
import AnimateOnMount from '@/components/AnimateOnMount';
import { slideUp, slideInLeft, slideInRight } from '@/lib/animation';

const Index = () => {
  const [activeNodes, setActiveNodes] = useState([true, true, true]);
  const [storage, setStorage] = useState([65, 42, 28]);
  const [files, setFiles] = useState([
    { name: 'project_data.csv', size: '24MB', replicas: [0, 1, 2] },
    { name: 'backup.zip', size: '35MB', replicas: [0, 2] },
    { name: 'images.tar', size: '18MB', replicas: [1, 2] }
  ]);

  const toggleNode = (index: number) => {
    const newActiveNodes = [...activeNodes];
    newActiveNodes[index] = !newActiveNodes[index];
    setActiveNodes(newActiveNodes);
  };

  const handleFileUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.click();
    
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const size = Math.round(file.size / (1024 * 1024));
        const availableNodes = activeNodes
          .map((active, index) => active ? index : -1)
          .filter(index => index !== -1);
          
        // Select random nodes for replication (2-3 nodes)
        const replicaCount = Math.min(Math.floor(Math.random() * 2) + 2, availableNodes.length);
        const replicas = [];
        
        for (let i = 0; i < replicaCount && availableNodes.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableNodes.length);
          replicas.push(availableNodes[randomIndex]);
          availableNodes.splice(randomIndex, 1);
        }
        
        setFiles([...files, { 
          name: file.name, 
          size: `${size}MB`, 
          replicas 
        }]);
        
        // Update storage on nodes
        const newStorage = [...storage];
        replicas.forEach(nodeIndex => {
          newStorage[nodeIndex] += size;
        });
        setStorage(newStorage);
      }
    };
  };

  const deleteFile = (index: number) => {
    const file = files[index];
    const fileSize = parseInt(file.size);
    
    // Update storage on nodes
    const newStorage = [...storage];
    file.replicas.forEach(nodeIndex => {
      newStorage[nodeIndex] = Math.max(0, newStorage[nodeIndex] - fileSize);
    });
    
    setStorage(newStorage);
    
    // Remove file
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-100">
      <AnimateOnMount animation={slideUp} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Distributed File System</h1>
        <p className="text-gray-600">Store files across multiple nodes with fault tolerance</p>
      </AnimateOnMount>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimateOnMount animation={slideUp} delay={100}>
              <Card>
                <CardHeader>
                  <CardTitle>Files</CardTitle>
                  <CardDescription>Stored files and replicas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">{files.length}</div>
                  <div className="text-sm text-gray-500">
                    Total replication factor: {files.reduce((acc, file) => acc + file.replicas.length, 0) / (files.length || 1)}x
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button className="flex gap-2" onClick={handleFileUpload}>
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    <Button variant="secondary" className="flex gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnMount>
            
            <AnimateOnMount animation={slideInLeft} delay={200}>
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Node health and storage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeNodes.map((active, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Node {i + 1}</span>
                          <span className={`text-xs ${active ? 'text-green-500' : 'text-red-500'}`}>
                            {active ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <Progress value={storage[i]} className="h-2" />
                        <div className="text-xs text-gray-500">{storage[i]}% used</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AnimateOnMount>
            
            <AnimateOnMount animation={slideInRight} delay={300}>
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>System operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline" onClick={handleFileUpload}>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Add New File
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Server className="mr-2 h-4 w-4" />
                    Add New Node
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
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
            <Card>
              <CardHeader>
                <CardTitle>Stored Files</CardTitle>
                <CardDescription>Files distributed across nodes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">Name</th>
                        <th className="text-left py-3">Size</th>
                        <th className="text-left py-3">Replicas</th>
                        <th className="text-left py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3">{file.name}</td>
                          <td className="py-3">{file.size}</td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              {file.replicas.map(nodeId => (
                                <span 
                                  key={nodeId} 
                                  className={`px-2 py-1 text-xs rounded-full ${activeNodes[nodeId] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                >
                                  Node {nodeId + 1}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3">
                            <Button variant="ghost" size="sm" onClick={() => deleteFile(index)}>
                              <FileX className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </AnimateOnMount>
        </TabsContent>
        
        <TabsContent value="nodes">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeNodes.map((active, i) => (
              <AnimateOnMount key={i} animation={slideUp} delay={i * 100}>
                <Card className={active ? '' : 'opacity-60'}>
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span>Node {i + 1}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {active ? 'Online' : 'Offline'}
                      </span>
                    </CardTitle>
                    <CardDescription>Storage: {storage[i]}% used</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={storage[i]} className="h-2 mb-4" />
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Stored Files</h4>
                      <div className="space-y-2">
                        {files
                          .filter(file => file.replicas.includes(i))
                          .map((file, idx) => (
                            <div key={idx} className="text-sm p-2 bg-gray-50 rounded flex justify-between">
                              <span>{file.name}</span>
                              <span className="text-gray-500">{file.size}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                    
                    <Button 
                      variant={active ? "destructive" : "outline"} 
                      className="w-full"
                      onClick={() => toggleNode(i)}
                    >
                      {active ? "Simulate Failure" : "Bring Node Online"}
                    </Button>
                  </CardContent>
                </Card>
              </AnimateOnMount>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
