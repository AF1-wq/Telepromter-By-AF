import { useState } from 'react';
import type { Script } from '../types';

const STORAGE_KEY = 'teleprompter_scripts';

export const useScripts = () => {
  const [scripts, setScripts] = useState<Script[]>(() => {
    const storedScripts = localStorage.getItem(STORAGE_KEY);
    if (storedScripts) {
      try {
        return JSON.parse(storedScripts);
      } catch (error) {
        console.error('Error parsing scripts from localStorage:', error);
      }
    }
    return [];
  });

  const getAllScripts = () => {
    return scripts.sort((a, b) => b.lastEdited - a.lastEdited); // Descending order
  };

  const getScript = (id: string): Script | undefined => {
    return scripts.find(s => s.id === id);
  };

  const saveScript = (scriptToSave: Script) => {
    setScripts(prevScripts => {
      const existingIndex = prevScripts.findIndex(s => s.id === scriptToSave.id);
      let newScripts;
      if (existingIndex >= 0) {
        newScripts = [...prevScripts];
        newScripts[existingIndex] = scriptToSave;
      } else {
        newScripts = [...prevScripts, scriptToSave];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newScripts));
      return newScripts;
    });
  };

  const deleteScript = (id: string) => {
    setScripts(prevScripts => {
      const newScripts = prevScripts.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newScripts));
      return newScripts;
    });
  };

  return {
    scripts: getAllScripts(),
    getScript,
    saveScript,
    deleteScript
  };
};
