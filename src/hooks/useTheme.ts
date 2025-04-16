
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    // Check for system preference if no saved theme
    if (!savedTheme) {
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      return systemPreference;
    }
    
    return savedTheme || 'light';
  });

  // Apply theme class to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove the previous theme class
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Save theme preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}
