
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    await signOut();
  };
  
  return (
    <div className="w-full p-4 bg-white border-b shadow-sm flex justify-between items-center">
      <h1 className="text-xl font-semibold">Distributed File System</h1>
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
