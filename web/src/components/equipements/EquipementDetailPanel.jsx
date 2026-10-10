/**
 * @fileoverview Panneau détail (modifiable sur place, ADR 0012) d'un équipement dans la page master-detail
 * @module components/equipements/EquipementDetailPanel
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Callout } from '@radix-ui/themes';
import { AlertCircle } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import ActivitySection from '@/components/equipements/EquipementActivity';
import { usePagedList } from '@/hooks/shared/usePagedList';
import { fetchEquipements, fetchEquipementStatuts, patchEquipement } from '@/api/equipements';
import { fetchEquipementClasses } from '@/api/equipementClasses';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';
import { Header, ChildrenSection } from '@/components/equipements/EquipementDetailSections';
import FicheSection from '@/components/equipements/EquipementFicheSection';
import { useEquipementDetail } from '@/hooks/equipements/useEquipementDetail';

/**
 * @param {string} id - équipement affiché (le parent remonte le composant à chaque changement d'id)
 * @param {Function} [onLoaded] - appelée avec le détail à chaque chargement (ex. déplier le chemin dans l'arbre)
 * @param {Function} [onChanged] - async, appelée après un changement de nom, statut, classe ou rattachement (rafraîchit la liste)
 */
// Champs dont le changement se voit dans la liste de gauche (arbre, chemin, santé)
const LIST_FIELDS = new Set(['name', 'statut_id', 'equipement_class_id', 'parent_id']);

export default function EquipementDetailPanel({ id, onLoaded, onChanged }) {
  const { can } = usePermissions();
  const editable = can(PERM.equipements.patch);
  const [classes, setClasses] = useState([]);
  const [statuts, setStatuts] = useState([]);
  const [includeDescendants, setIncludeDescendants] = useState(undefined); // undefined = défaut serveur
  const { equipement, loading, error, applyDetail } = useEquipementDetail(id, { includeDescendants });
  // Filles directes, paginées par l'API : indépendantes de l'option d'activité
  const children = usePagedList(
    id,
    (skip, limit) => fetchEquipements({ selectMere: id, sort: 'health', skip, limit }),
    'Erreur lors du chargement des sous-équipements',
  );

  useEffect(() => {
    if (equipement && onLoaded) onLoaded(equipement);
  }, [equipement, onLoaded]);

  useEffect(() => {
    if (!editable) return;
    fetchEquipementClasses().then(setClasses).catch(() => {});
    fetchEquipementStatuts().then(setStatuts).catch(() => {});
  }, [editable]);

  // Un seul champ par PATCH ; l'erreur remonte à la propriété, qui l'affiche sous sa ligne
  // Enregistrements en file : deux champs modifiés coup sur coup ne peuvent pas voir la
  // réponse du premier PATCH écraser à l'affichage celle du second.
  const saveQueue = useRef(Promise.resolve());
  const saveField = useCallback((field, value) => {
    const run = saveQueue.current.then(async () => {
      const updated = await patchEquipement(id, { [field]: value });
      applyDetail(updated);
      if (LIST_FIELDS.has(field) && onChanged) {
        await onChanged();
        // Le rafraîchissement referme les nœuds non dépliés : on rouvre le chemin de la sélection
        if (onLoaded) onLoaded(updated);
      }
    });
    saveQueue.current = run.catch(() => {});
    return run;
  }, [id, applyDetail, onChanged, onLoaded]);

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
      <Header eq={equipement} editable={editable} onSave={saveField} />
      <FicheSection eq={equipement} editable={editable} onSave={saveField} classes={classes} statuts={statuts} />
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
  onChanged: PropTypes.func,
};
