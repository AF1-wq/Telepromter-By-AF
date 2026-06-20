import { useState, useEffect } from 'react';

export const useBionicMode = () => {
  const [bionicMode, setBionicModeState] = useState<boolean>(() => {
    return localStorage.getItem('app-bionic-mode') === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('app-bionic-mode');
      if (saved) setBionicModeState(saved === 'true');
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('bionic-mode-changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('bionic-mode-changed', handleStorage);
    };
  }, []);

  const setBionicMode = (active: boolean) => {
    setBionicModeState(active);
    localStorage.setItem('app-bionic-mode', active.toString());
    window.dispatchEvent(new Event('bionic-mode-changed'));
  };

  return { bionicMode, setBionicMode };
};
