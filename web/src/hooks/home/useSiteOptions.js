/**
 * @fileoverview Options du filtre de site, lues depuis les équipements racines.
 * @module hooks/home/useSiteOptions
 */

import { useState, useEffect } from 'react';
import { fetchEquipements } from '@/api/equipements';
import { deriveSiteOptions } from '@/hooks/home/siteOptions';

export function useSiteOptions() {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchEquipements({ rootsOnly: true, limit: 500, sort: 'code' })
      .then((res) => { if (!cancelled) setOptions(deriveSiteOptions(res.items)); })
      .catch(() => { if (!cancelled) setOptions([]); }); // filtre optionnel : masqué en cas d'échec
    return () => { cancelled = true; };
  }, []);

  return options;
}
