/**
 * @fileoverview Modale listant les interventions d'un équipement filtrées depuis le tableau de bord
 * @module components/equipements/EquipementInterventionsDialog
 */

import PropTypes from 'prop-types';
import { Dialog } from '@radix-ui/themes';
import { InterventionsBlock } from '@/components/equipements/EquipementActivity';
import { usePagedList } from '@/hooks/shared/usePagedList';
import { fetchInterventionsPage } from '@/api/interventions';

// Liste montée seulement à l'ouverture : aucune requête tant que la modale est fermée.
// printed n'est pas envoyé : les interventions archivées sont comptées par le tableau de bord.
function FilteredList({ equipementId, includeDescendants, filters }) {
  const key = `${equipementId}|${includeDescendants}|${filters.typeInter ?? ''}|${filters.reportedFrom}|${filters.reportedTo}`;
  const list = usePagedList(
    key,
    (skip, limit) => fetchInterventionsPage({
      equipementId,
      includeDescendants,
      typeInter: filters.typeInter,
      reportedFrom: filters.reportedFrom,
      reportedTo: filters.reportedTo,
      sort: '-reported_date',
      skip,
      limit,
    }),
    'Erreur lors du chargement des interventions',
  );
  return <InterventionsBlock list={list} />;
}
FilteredList.propTypes = {
  equipementId: PropTypes.string.isRequired,
  includeDescendants: PropTypes.bool.isRequired,
  filters: PropTypes.object.isRequired,
};

/**
 * @param {Object|null} filters - { typeInter?, reportedFrom, reportedTo } ; null = modale fermée
 * @param {string} title - rappel du filtre appliqué
 */
export default function EquipementInterventionsDialog({ filters, title, equipementId, includeDescendants, onClose }) {
  return (
    <Dialog.Root open={filters !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Content maxWidth="700px">
        <Dialog.Title>Interventions</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">{title}</Dialog.Description>
        {filters && (
          <FilteredList equipementId={equipementId} includeDescendants={includeDescendants} filters={filters} />
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
EquipementInterventionsDialog.propTypes = {
  filters: PropTypes.object,
  title: PropTypes.string,
  equipementId: PropTypes.string.isRequired,
  includeDescendants: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
