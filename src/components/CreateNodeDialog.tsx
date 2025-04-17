
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Server, PlusCircle, HardDrive, Database } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NodeInsert } from "@/types/supabase";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const nodeSchema = z.object({
  name: z.string().min(1, "Node name is required"),
  storage_total: z.number().min(1, "Storage must be at least 1GB"),
});

type NodeFormValues = z.infer<typeof nodeSchema>;

interface CreateNodeDialogProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onCreateNode: (node: NodeInsert) => void;
  variant?: ButtonProps["variant"];
  className?: string;
  children?: React.ReactNode;
}

export function CreateNodeDialog({ 
  onCreateNode, 
  variant = "default", 
  className, 
  children,
  ...props 
}: CreateNodeDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  
  const form = useForm<NodeFormValues>({
    resolver: zodResolver(nodeSchema),
    defaultValues: {
      name: "",
      storage_total: 100,
    },
  });
  
  const onSubmit = (data: NodeFormValues) => {
    if (!user) return;
    
    onCreateNode({
      name: data.name,
      storage_total: data.storage_total,
      storage_used: 0,
      status: 'online',
      user_id: user.id,
    });
    
    form.reset();
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            className={cn(
              "w-full justify-start font-medium", 
              className,
              variant === "default" && "bg-gradient-to-r from-blue-500 to-primary hover:from-blue-600 hover:to-primary/90"
            )} 
            variant={variant} 
            {...props}
          >
            {children || (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Node
              </>
            )}
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border border-border/20 shadow-lg bg-gradient-to-b from-background to-background/90 backdrop-blur-sm">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl flex items-center">
            <HardDrive className="mr-2 h-5 w-5 text-primary" />
            Add New Node
          </DialogTitle>
          <div className="h-0.5 w-16 bg-gradient-to-r from-primary to-blue-500"></div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Node Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Enter node name..." 
                        className="pl-9 border-border/30 focus:border-primary bg-background/50"
                        {...field} 
                      />
                      <Database className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="storage_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Storage Capacity (GB)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder="Storage in GB" 
                        className="pl-9 border-border/30 focus:border-primary bg-background/50"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                      <Server className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="border-border/30 hover:bg-secondary/50"
              >
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-primary hover:from-blue-600 hover:to-primary/90"
                >
                  Create Node
                </Button>
              </motion.div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
