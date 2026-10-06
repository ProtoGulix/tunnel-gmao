/**
 * @fileoverview Onglet enfants d'un équipement
 * @module components/equipements/tabs/EquipementChildrenTab
 *
 * Affiche la liste paginée des enfants avec recherche, filtre classe et pagination
 * en réutilisant le composant commun EquipementTable via le paramètre select_mere.
 */

import PropTypes from 'prop-types';
import { useEquipements } from '@/hooks/equipements/useEquipements';
import EquipementTable from '@/components/equipements/EquipementTable';

/**
 * Onglet liste des enfants d'un équipement
 */
export default function EquipementChildrenTab({ parentId }) {
  const {
    equipements, loading, error, getParentInfo,
    pagination, facets,
    page, setPage, pageSize, setPageSize,
    search, setSearch, classFilter, setClassFilter,
  } = useEquipements({ selectMere: parentId });

  return (
    <EquipementTable
      equipements={equipements}
      loading={loading}
      error={error}
      getParentInfo={getParentInfo}
      search={search}
      onSearchChange={setSearch}
      classFilter={classFilter}
      onClassFilterChange={setClassFilter}
      facets={facets}
      pagination={pagination}
      page={page}
      onPageChange={setPage}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      showParentColumn={false}
    />
  );
}

EquipementChildrenTab.propTypes = {
  parentId: PropTypes.string.isRequired,
};
