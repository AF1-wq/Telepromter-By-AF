import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

// Apply theme directly to DOM — no React re-render required
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', theme);
  localStorage.setItem('app-theme', theme);
}

// Read saved theme from localStorage (SSR-safe)
function getSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem('app-theme') as Theme | null;
    return saved === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getSavedTheme);

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
};
