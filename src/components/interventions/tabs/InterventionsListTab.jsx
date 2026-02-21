/**
 * Tab orchestrateur pour la liste des interventions
 * 
 * Chef d'orchestre qui appelle le hook, gère les états loading/error,
 * et assemble les composants d'affichage avec InteractiveTable.
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Badge, Flex } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
import { useInterventionsList } from '@/hooks/interventions/useInterventionsList';
import InteractiveTable from '@/components/ui/InteractiveTable';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import {
  renderActionnableCell,
  renderBloqueCell,
  renderStandardCell,
  getActionnableRowStyle,
  getBloqueRowStyle,
  getStandardRowStyle,
} from '@/components/interventions/interventionCellRenderers';

/**
 * Tab de la liste des interventions segmentée en 4 blocs
 * 
 * @param {Object} props
 * @param {string} props.searchTerm - Terme de recherche
 */
export default function InterventionsListTab({ searchTerm = '' }) {
  const navigate = useNavigate();
  const { blocks, loading, error, totalOpen } = useInterventionsList(searchTerm);

  // Navigation vers le détail
  const handleInterventionClick = useCallback((intervention) => {
    navigate(`/intervention/${intervention.id}`);
  }, [navigate]);

  // Configuration des colonnes pour BLOC 1 : À faire maintenant
  const actionnableColumns = [
    { key: 'code', header: 'Code', width: '180px', align: 'left' },
    { key: 'title', header: 'Intervention', width: undefined, align: 'left' },
    { key: 'info', header: 'Info', width: '140px', align: 'left' },
    { key: 'age', header: 'Âge', width: '80px', align: 'right' },
    { key: '_action', header: '', width: '100px', align: 'center' }
  ];

  // Configuration des colonnes pour BLOC 2 : Bloqué
  const bloqueColumns = [
    { key: 'code', header: 'Code', width: '180px', align: 'left' },
    { key: 'title', header: 'Intervention bloquée', width: undefined, align: 'left' },
    { key: 'info', header: 'Info', width: '140px', align: 'left' },
    { key: 'age', header: 'Âge', width: '80px', align: 'right' },
    { key: '_action', header: '', width: '100px', align: 'center' }
  ];

  // Configuration des colonnes pour BLOC 3 & 4 : Projets et Archivé
  const standardColumns = [
    { key: 'code', header: 'Code', width: '180px', align: 'left' },
    { key: 'title', header: 'Titre', width: undefined, align: 'left' },
    { key: 'info', header: 'Info', width: '140px', align: 'left' },
    { key: 'age', header: 'Âge', width: '80px', align: 'right' },
    { key: '_action', header: '', width: '100px', align: 'center' }
  ];

  // Loading state
  if (loading) {
    return <LoadingState message="Chargement des interventions..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        error={error}
        message="Impossible de charger les interventions"
        retry={() => window.location.reload()}
      />
    );
  }

  // Blocs vides
  if (totalOpen === 0 && blocks.archive.length === 0) {
    return (
      <Flex justify="center" align="center" style={{ padding: '3rem' }}>
        <p>Aucune intervention trouvée</p>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="5">
      {/* Bloc 1: À faire maintenant */}
      <InteractiveTable
        title="À faire maintenant"
        badge={<Badge color="red" variant="solid">{blocks.actionnable.length}</Badge>}
        columns={actionnableColumns}
        data={blocks.actionnable}
        onRowClick={handleInterventionClick}
        renderCell={renderActionnableCell}
        getRowStyle={getActionnableRowStyle}
        actionLabel="Ouvrir"
      />

      {/* Bloc 2: Bloqué */}
      <InteractiveTable
        title="Bloqué"
        badge={<Badge color="amber" variant="soft">{blocks.bloque.length}</Badge>}
        columns={bloqueColumns}
        data={blocks.bloque}
        onRowClick={handleInterventionClick}
        renderCell={renderBloqueCell}
        getRowStyle={getBloqueRowStyle}
        actionLabel="Ouvrir"
      />

      {/* Bloc 3: Projets / Support */}
      <InteractiveTable
        title="Projets / Support"
        badge={<Badge color="blue" variant="soft">{blocks.projet.length}</Badge>}
        columns={standardColumns}
        data={blocks.projet}
        onRowClick={handleInterventionClick}
        renderCell={renderStandardCell}
        getRowStyle={getStandardRowStyle}
        actionLabel="Ouvrir"
      />

      {/* Bloc 4: À archiver */}
      <InteractiveTable
        title="À archiver"
        badge={<Badge color="gray" variant="soft">{blocks.archive.length}</Badge>}
        columns={standardColumns}
        data={blocks.archive}
        onRowClick={handleInterventionClick}
        renderCell={renderStandardCell}
        getRowStyle={getStandardRowStyle}
        actionLabel="Ouvrir"
        defaultCollapsed={true}
      />
    </Flex>
  );
}

InterventionsListTab.propTypes = {
  searchTerm: PropTypes.string,
};
