import { createContext, useContext, useState, useCallback } from 'react';
import { getUserFriendlyMessage } from '@/lib/api/errors';

/**
 * Context pour gérer les notifications d'erreurs globales
 */
const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const showError = useCallback((error) => {
    const message = getUserFriendlyMessage(error);
    setError({ message, details: error });
    setIsVisible(true);

    // Auto-hide après 5 secondes
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, []);

  const hideError = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setError(null), 300); // Attend la fin de l'animation
  }, []);

  return (
    <ErrorContext.Provider value={{ error, isVisible, showError, hideError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError doit être utilisé dans un ErrorProvider');
  }
  return context;
};
