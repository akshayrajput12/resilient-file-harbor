
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    toast({ 
      title: "Error signing up", 
      description: error.message,
      variant: "destructive" 
    });
    throw error;
  }
  
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    toast({ 
      title: "Error signing in", 
      description: error.message,
      variant: "destructive" 
    });
    throw error;
  }
  
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    toast({ 
      title: "Error signing out", 
      description: error.message,
      variant: "destructive" 
    });
    throw error;
  }
  
  return true;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error("Error getting session:", error);
    return null;
  }
  
  return data.session;
}
