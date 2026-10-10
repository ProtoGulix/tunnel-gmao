/**
 * @fileoverview Panneau détail (lecture seule) d'un équipement dans la page master-detail
 * @module components/equipements/EquipementDetailPanel
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Callout } from '@radix-ui/themes';
import { AlertCircle } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import ActivitySection from '@/components/equipements/EquipementActivity';
import { usePagedList } from '@/hooks/shared/usePagedList';
import { fetchEquipements } from '@/api/equipements';
import { Header, FicheSection, ChildrenSection } from '@/components/equipements/EquipementDetailSections';
import { useEquipementDetail } from '@/hooks/equipements/useEquipementDetail';

/**
 * @param {string} id - équipement affiché (le parent remonte le composant à chaque changement d'id)
 * @param {Function} [onLoaded] - appelée avec le détail à chaque chargement (ex. déplier le chemin dans l'arbre)
 */
export default function EquipementDetailPanel({ id, onLoaded }) {
  const [includeDescendants, setIncludeDescendants] = useState(undefined); // undefined = défaut serveur
  const { equipement, loading, error } = useEquipementDetail(id, { includeDescendants });
  // Filles directes, paginées par l'API : indépendantes de l'option d'activité
  const children = usePagedList(
    id,
    (skip, limit) => fetchEquipements({ selectMere: id, sort: 'health', skip, limit }),
    'Erreur lors du chargement des sous-équipements',
  );

  useEffect(() => {
    if (equipement && onLoaded) onLoaded(equipement);
  }, [equipement, onLoaded]);

  if (error && !equipement) return <Box p="4"><ErrorState error={error} /></Box>;
  if (!equipement) return <LoadingState fullscreen={false} message="Chargement…" />;

  return (
    <Box p="4" style={{ opacity: loading ? 0.7 : 1 }}>
      {error && (
        <Callout.Root color="red" size="1" mb="3">
          <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      <Header eq={equipement} />
      <FicheSection eq={equipement} />
      <ChildrenSection list={children} />
      <ActivitySection
        eq={equipement}
        includeDescendants={includeDescendants ?? equipement.include_descendants === true}
        onIncludeChange={setIncludeDescendants}
      />
    </Box>
  );
}

EquipementDetailPanel.propTypes = {
  id: PropTypes.string.isRequired,
  onLoaded: PropTypes.func,
};
