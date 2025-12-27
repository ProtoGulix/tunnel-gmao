import { createContext, useContext, useCallback } from 'react';
import { client } from '@/lib/api/facade';

const CacheContext = createContext(null);

export const CacheProvider = ({ children }) => {
  const clearCache = useCallback(() => {
    client.clearAllCache();
    console.warn('🗑️ Cache entièrement vidé');
  }, []);

  const value = {
    clearCache,
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};
