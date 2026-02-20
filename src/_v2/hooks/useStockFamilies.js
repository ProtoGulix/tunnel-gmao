import { useState, useEffect } from 'react';
import { stock } from '@/lib/api/facade';

/**
 * Hook pour récupérer les familles de stock
 */
export const useStockFamilies = () => {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        setLoading(true);
        const data = await stock.fetchStockFamilies();
        setFamilies(data);
      } catch (err) {
        console.error('Erreur chargement familles:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadFamilies();
  }, []);

  return { families, loading, error };
};

/**
 * Hook pour récupérer les sous-familles d'une famille
 */
export const useStockSubFamilies = (familyCode) => {
  const [subFamilies, setSubFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!familyCode) {
      setSubFamilies([]);
      setLoading(false);
      return;
    }

    const loadSubFamilies = async () => {
      try {
        setLoading(true);
        const data = await stock.fetchStockSubFamilies(familyCode);
        setSubFamilies(data);
      } catch (err) {
        console.error('Erreur chargement sous-familles:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadSubFamilies();
  }, [familyCode]);

  return { subFamilies, loading, error };
};
