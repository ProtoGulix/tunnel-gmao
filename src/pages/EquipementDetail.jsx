/**
 * @fileoverview Page détail d'un équipement
 * @module EquipementDetail
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Flex,
  Card,
  Text,
  Button,
  Tabs,
  Badge,
  Heading,
} from '@radix-ui/themes';
import { ArrowLeft, Plus, RefreshCw, Eye } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ErrorDisplay from '@/components/ErrorDisplay';
import EquipementHealthBadge from '@/components/common/EquipementHealthBadge';
import EquipementHierarchy from '@/components/common/EquipementHierarchy';
import { useApiCall } from '@/hooks/useApiCall';
import { useEquipements } from '@/hooks/useEquipements';
import { useEquipementHealth } from '@/hooks/useEquipementHealth';
import { adapter } from '@/lib/api/adapters/tunnelBackend';

/**
 * Page détail d'un équipement
 * Affiche santé, interventions actives, hiérarchie et stats optionnelles
 *
 * @component
 * @returns {JSX.Element} Page équipement
 *
 * @example
 * <EquipementDetail />
 */
export default function EquipementDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('interventions');

  // Charger équipement et interventions en parallèle
  const {
    data: equipement,
    loading: eqLoading,
    error: eqError,
    execute: reloadEquipement,
  } = useApiCall(() => adapter.equipements.fetchEquipement(id), {
    autoExecute: false,
  });

  const {
    data: rawInterventions,
    loading: intLoading,
    error: intError,
    execute: loadInterventions,
  } = useApiCall(
    () =>
      adapter.interventions.fetchInterventions({
        equipement_id: id,
        status: 'ouvert,en_cours',
        sort: '-priority,-reported_date',
        limit: 50,
      }),
    { autoExecute: false }
  );

  // S'assurer que interventions est toujours un array
  const interventions = Array.isArray(rawInterventions) ? rawInterventions : [];

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    execute: loadStats,
  } = useApiCall(() => adapter.equipements.fetchEquipementStats(id), {
    autoExecute: false,
  });

  // Cache équipements pour résolution hiérarchie
  const { getParentInfo, getChildrenInfo } = useEquipements();

  // Polling santé optionnel
  const { health: polledHealth, manualRefresh } = useEquipementHealth(id, true);

  // Chargement initial
  useEffect(() => {
    if (id) {
      reloadEquipement();
      loadInterventions();
    }
  }, [id, reloadEquipement, loadInterventions]);

  // Charger stats au clic sur l'onglet
  useEffect(() => {
    if (activeTab === 'stats' && !stats) {
      loadStats();
    }
  }, [activeTab, stats, loadStats]);

  if (eqError) {
    return (
      <Container>
        <Button mb="4" variant="ghost" onClick={() => navigate('/equipements')}>
          <ArrowLeft size={16} />
          Retour
        </Button>
        <ErrorDisplay error={eqError} />
      </Container>
    );
  }

  const health = polledHealth || equipement?.health || { level: 'ok', reason: '' };
  const parentInfo = equipement ? getParentInfo(equipement.parentId) : null;
  const childrenInfo = equipement ? getChildrenInfo(equipement.childrenIds) : [];

  return (
    <Container>
      {/* Bouton retour */}
      <Button mb="4" variant="ghost" onClick={() => navigate('/equipements')}>
        <ArrowLeft size={16} />
        Retour aux équipements
      </Button>

      {/* Bandeau santé */}
      <Card mb="6">
        <Flex justify="between" align="start" mb="4">
          <Flex direction="column" gap="2">
            <Heading size="6">
              {equipement?.code || '—'} – {equipement?.name}
            </Heading>
            <Flex align="center" gap="3">
              <EquipementHealthBadge level={health.level} showLabel />
              <Text size="3" color="gray">
                {health.reason}
              </Text>
            </Flex>

            {health.rulesTriggered && health.rulesTriggered.length > 0 && (
              <Box mt="2" p="2" style={{ background: 'var(--gray-2)' }}>
                <Text size="1" weight="medium">
                  Règles déclenchées :
                </Text>
                {health.rulesTriggered.map((rule) => (
                  <Text key={rule} size="1" color="gray">
                    • {rule}
                  </Text>
                ))}
              </Box>
            )}
          </Flex>

          <Button onClick={manualRefresh} variant="outline" size="2">
            <RefreshCw size={16} />
            Refresh
          </Button>
        </Flex>

        {/* Actions rapides */}
        <Flex gap="2">
          <Button size="2">
            <Plus size={16} />
            Créer une intervention
          </Button>
          <Button size="2" variant="outline">
            <Eye size={16} />
            Voir toutes les interventions
          </Button>
        </Flex>
      </Card>

      {/* Onglets */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="interventions">
            Interventions actives ({interventions.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="hierarchy">Hiérarchie</Tabs.Trigger>
          <Tabs.Trigger value="stats">Stats</Tabs.Trigger>
        </Tabs.List>

        {/* Interventions */}
        <Tabs.Content value="interventions">
          <Box py="4">
            {intError && <ErrorDisplay error={intError} />}

            {interventions.length === 0 && !intLoading && (
              <Flex align="center" justify="center" py="6">
                <Text color="gray">Aucune intervention ouverte</Text>
              </Flex>
            )}

            {interventions.length > 0 && (
              <Box overflowX="auto">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--gray-6)',
                      }}
                    >
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 500 }}>
                        Priorité
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 500 }}>
                        Statut
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 500 }}>Code</th>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 500 }}>
                        Titre
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 500 }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 500 }}>Type</th>
                      <th style={{ textAlign: 'right', padding: '8px', fontWeight: 500 }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {interventions.map((inter) => (
                      <tr
                        key={inter.id}
                        style={{
                          borderBottom: '1px solid var(--gray-4)',
                        }}
                      >
                        <td style={{ padding: '8px' }}>
                          <Badge>{inter.priority || '—'}</Badge>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <Badge color="blue">{inter.status}</Badge>
                        </td>
                        <td style={{ padding: '8px' }}>{inter.code}</td>
                        <td style={{ padding: '8px' }}>
                          <Text size="2">{inter.title}</Text>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <Text size="2" color="gray">
                            {inter.reportedDate
                              ? new Date(inter.reportedDate).toLocaleDateString('fr-FR')
                              : '—'}
                          </Text>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <Badge variant="outline">{inter.type}</Badge>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <Button
                            size="1"
                            variant="ghost"
                            onClick={() => navigate(`/interventions/${inter.id}`)}
                          >
                            Voir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
        </Tabs.Content>

        {/* Hiérarchie */}
        <Tabs.Content value="hierarchy">
          <Box py="4">
            <EquipementHierarchy parentInfo={parentInfo} childrenInfo={childrenInfo} />
            {!parentInfo && childrenInfo.length === 0 && (
              <Text color="gray">Aucun équipement parent ou enfant</Text>
            )}
          </Box>
        </Tabs.Content>

        {/* Stats */}
        <Tabs.Content value="stats">
          <Box py="4">
            {statsError && <ErrorDisplay error={statsError} />}

            {stats && (
              <Flex direction="column" gap="4">
                <Card>
                  <Heading size="4" mb="3">
                    Interventions
                  </Heading>
                  <Flex gap="4" mb="4">
                    <Box>
                      <Text size="1" color="gray">
                        Ouvertes
                      </Text>
                      <Text size="4" weight="bold">
                        {stats.interventions.open}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="1" color="gray">
                        Fermées
                      </Text>
                      <Text size="4" weight="bold">
                        {stats.interventions.closed}
                      </Text>
                    </Box>
                  </Flex>
                </Card>

                {Object.keys(stats.interventions.byPriority).length > 0 && (
                  <Card>
                    <Heading size="4" mb="3">
                      Par priorité
                    </Heading>
                    <Flex direction="column" gap="2">
                      {Object.entries(stats.interventions.byPriority).map(([priority, count]) => (
                        <Flex key={priority} justify="between">
                          <Text size="2">{priority}</Text>
                          <Badge>{count}</Badge>
                        </Flex>
                      ))}
                    </Flex>
                  </Card>
                )}
              </Flex>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}
