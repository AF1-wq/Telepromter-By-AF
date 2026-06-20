import { useState, useEffect } from 'react';

export type ReadingMode = 'standard' | 'pro' | 'focus' | 'accessibility';

export const useReadingMode = () => {
  const [mode, setModeState] = useState<ReadingMode>(() => {
    const savedMode = localStorage.getItem('app-reading-mode') as ReadingMode | null;
    return savedMode || 'standard';
  });

  useEffect(() => {
    const handleStorage = () => {
      const savedMode = localStorage.getItem('app-reading-mode') as ReadingMode | null;
      if (savedMode) setModeState(savedMode);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('reading-mode-changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('reading-mode-changed', handleStorage);
    };
  }, []);

  const setMode = (newMode: ReadingMode) => {
    setModeState(newMode);
    localStorage.setItem('app-reading-mode', newMode);
    document.documentElement.setAttribute('data-reading-mode', newMode);
    window.dispatchEvent(new Event('reading-mode-changed'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-reading-mode', mode);
  }, [mode]);

  return { mode, setMode };
};
