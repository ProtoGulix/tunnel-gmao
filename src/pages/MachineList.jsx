/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📄 MachineList.jsx - Liste complète des machines avec hiérarchie et filtres
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Page principale affichant toutes les machines du parc avec:
 * - Statistiques globales (total, par statut, interventions ouvertes)
 * - Recherche full-text (code, nom, zone, atelier)
 * - Filtrage par statut (opérationnelle, maintenance, attention, critique)
 * - Vue dual mode: table classique OU hiérarchique avec sous-équipements
 * - Auto-refresh background 5s (sans clignotement)
 * - Navigation: détail machine + liste interventions filtrées
 * 
 * Architecture:
 * - useApiCall: gestion chargement/erreurs/refresh machines
 * - useAutoRefresh: polling 5s en arrière-plan
 * - buildHierarchy: construction arborescence récursive (parent)
 * - MachineRow: composant récursif pour affichage hiérarchique
 * - PageHeader: header centralisé avec stats/actions
 * 
 * ✅ IMPLÉMENTÉ:
 * - Auto-refresh 5s avec backgroundRefetchMachines (pas de loading visible)
 * - Statistiques cliquables pour filtrage rapide par statut
 * - Recherche multi-champs (code, nom, zone, atelier)
 * - Arborescence expand/collapse avec indentation visuelle
 * - Badges colorés interventions par type (INTERVENTION_TYPES config)
 * - Navigation intelligente: bouton "Interventions" si openInterventionsCount > 0
 * - Gestion états: LoadingSpinner, ErrorDisplay avec retry
 * - ViewMode switch: 'table' (flat) vs 'hierarchy' (tree)
 * 
 * 📋 TODO:
 * - [ ] Mode carte (grid cards responsive pour vue synthétique)
 * - [ ] Export CSV/Excel avec filtres appliqués
 * - [ ] Tri colonnes (code, nom, zone, statut, nb interventions)
 * - [ ] Filtres avancés (zone, atelier, date dernière intervention)
 * - [ ] Import CSV/Excel pour ajout/màj machines en masse
 * - [ ] QR codes batch generation (étiquettes machines)
 * - [ ] Graphique santé parc (camembert statuts, évolution temporelle)
 * - [ ] Action bulk: changer statut multiple machines (maintenance préventive)
 * - [ ] Historique changements statuts (audit trail)
 * - [ ] Tags/labels personnalisables (criticité métier, processus)
 * - [ ] Indicateur "dernière intervention" (date + temps écoulé)
 * - [ ] Mode comparaison (sélection multiple, overlay KPIs)
 * - [ ] Notifications: alertes si machine devient critique
 * - [ ] Intégration cartographie (map 2D atelier, positionnement machines)
 * - [ ] Bouton "Nouvelle machine" fonctionnel (modal création)
 * 
 * @module pages/MachineList
 * @requires hooks/useApiCall - Chargement API avec états
 * @requires hooks/useAutoRefresh - Polling automatique
 * @requires config/interventionTypes - Types et couleurs
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { machines } from "@/lib/api/facade";

const fetchMachinesWithInterventions = () => machines.fetchMachinesWithInterventions();
import { useApiCall } from "@/hooks/useApiCall";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import LoadingState from "@/components/common/LoadingState";
import ErrorDisplay from "@/components/ErrorDisplay";
import SearchField from "@/components/common/SearchField";
import InteractiveTable from "@/components/common/InteractiveTable";
import { 
  Flex, 
  Text, 
  Badge, 
  Box,
  Container
} from "@radix-ui/themes";
import { INTERVENTION_TYPES } from "@/config/interventionTypes";
import PageHeader from "@/components/layout/PageHeader";
import { usePageHeaderProps } from "@/hooks/usePageConfig";

// Labels et couleurs des statuts de machine

const STATUS_LABELS = {
  ok: { label: "Opérationnelle", color: "green" },
  maintenance: { label: "Maintenance", color: "blue" },
  warning: { label: "Attention", color: "orange" },
  critical: { label: "Critique", color: "red" }
};

/**
 * Liste complète des machines avec filtrage et hiérarchie
 * 
 * @returns {JSX.Element} Page avec header, stats, recherche, table machines
 */
export default function MachineList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { 
    data: machines = [], 
    loading, 
    error, 
    execute: refetchMachines,
    executeSilent: backgroundRefetchMachines
  } = useApiCall(fetchMachinesWithInterventions);

  useEffect(() => {
    if (machines && Array.isArray(machines)) {
      setData(machines);
    }
  }, [machines]);

  useEffect(() => {
    refetchMachines();
  }, [refetchMachines]);

  useAutoRefresh(backgroundRefetchMachines, 5, true);
  
  useEffect(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter(machine =>
        machine.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.parent?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.zone?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.workshop?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(machine => machine.status === filterStatus);
    }

    const withInterventions = filtered.filter(m => m.openInterventionsCount > 0);
    const withoutInterventions = filtered.filter(m => m.openInterventionsCount === 0);

    const statusOrder = { critical: 0, warning: 1, ok: 2, maintenance: 3 };
    withInterventions.sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 4;
      const orderB = statusOrder[b.status] ?? 4;
      return orderA - orderB;
    });

    setFilteredData([...withInterventions, ...withoutInterventions]);
  }, [searchTerm, filterStatus, data]);

  const handleCreateMachine = useCallback(() => {
    console.warn("[TODO] Créer machine - modal à implémenter");
  }, []);

  const handleOpenMachine = useCallback((machine) => {
    navigate(`/machines/${machine.id}`);
  }, [navigate]);

  const machineColumns = [
    { key: "machine", header: "Machine", width: undefined, align: "left" },
    { key: "parent", header: "Équipement mère", width: undefined, align: "left" },
    { key: "status", header: "État", width: undefined, align: "left" },
    { key: "interventions", header: "Interventions", width: undefined, align: "left" },
    { key: "_action", header: "", width: "100px", align: "center" }
  ];

  const renderMachineCell = useCallback((machine, column) => {
    switch (column.key) {
      case "machine":
        return (
          <Flex direction="column" gap="1">
            <Badge color="gray" variant="soft" size="2" style={{ fontFamily: "monospace", fontWeight: "500" }}>
              {machine.code || "N/A"}
            </Badge>
            <Text size="1" color="gray">{machine.name || "Sans nom"}</Text>
          </Flex>
        );
      
      case "parent":
        return machine.parent ? (
          <Flex direction="column" gap="1">
            <Badge color="blue" variant="soft" size="2">{machine.parent.code}</Badge>
            {machine.parent.name && (
              <Text size="1" color="gray">{machine.parent.name}</Text>
            )}
          </Flex>
        ) : (
          <Text size="1" color="gray">—</Text>
        );
      
      case "status":
        return (
          <Badge 
            color={STATUS_LABELS[machine.status]?.color || "gray"} 
            size="2" 
            variant={machine.openInterventionsCount > 0 ? "solid" : "soft"}
          >
            {STATUS_LABELS[machine.status]?.label || machine.status}
          </Badge>
        );
      
      case "interventions":
        if (machine.openInterventionsCount === 0) {
          return <Text size="1" color="gray">—</Text>;
        }
        return (
          <Flex gap="1" wrap="wrap">
            {Object.entries(machine.interventionsByType || {}).map(([type, count]) => {
              const typeConfig = INTERVENTION_TYPES.find(t => t.id === type);
              return (
                <Badge 
                  key={type} 
                  color={typeConfig?.color || "gray"} 
                  size="2"
                  variant="solid"
                >
                  {type}: {count}
                </Badge>
              );
            })}
          </Flex>
        );
      
      default:
        return null;
    }
  }, []);

  const getMachineRowStyle = useCallback((machine) => {
    const baseStyle = {
      borderLeft: machine.openInterventionsCount > 0 
        ? `4px solid var(--${STATUS_LABELS[machine.status]?.color || "gray"}-9)`
        : "4px solid var(--gray-6)",
    };

    if (machine.openInterventionsCount > 0) {
      return {
        ...baseStyle,
        backgroundColor: "var(--amber-1)"
      };
    }

    return {
      ...baseStyle,
      opacity: 0.85
    };
  }, []);

  const stats = {
    total: data?.length || 0,
    ok: (data || []).filter(m => m.status === "ok").length,
    maintenance: (data || []).filter(m => m.status === "maintenance").length,
    warning: (data || []).filter(m => m.status === "warning").length,
    critical: (data || []).filter(m => m.status === "critical").length,
    totalOpenInterventions: (data || []).reduce((sum, m) => sum + (m.openInterventionsCount || 0), 0)
  };

  const headerProps = usePageHeaderProps({
    subtitle: loading ? "Chargement en cours..." : error ? "Erreur de chargement" : `${data?.length || 0} machine${(data?.length || 0) > 1 ? "s" : ""} • ${stats.total > 0 ? ((stats.ok / stats.total) * 100).toFixed(2) : "0.00"}% opérationnel`,
    stats: !loading && !error ? [
      { label: "Interventions ouvertes", value: stats.totalOpenInterventions },
      { label: "% Attention", value: `${stats.total > 0 ? ((stats.warning / stats.total) * 100).toFixed(2) : "0.00"}%`, color: "orange" },
      { label: "% Critique", value: `${stats.total > 0 ? ((stats.critical / stats.total) * 100).toFixed(2) : "0.00"}%`, color: "red" }
    ] : [],
    onRefresh: refetchMachines,
    onAdd: handleCreateMachine,
    addLabel: "+ Nouvelle machine"
  });

  if (loading) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <Container size="4" p="3">
          <LoadingState message="Chargement des machines..." />
        </Container>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <Container size="4" p="3">
          <ErrorDisplay 
            error={error}
            onRetry={refetchMachines}
            title="Erreur de chargement des machines"
          />
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader {...headerProps} />

      <Container size="4" p="3">
        <Flex direction="column" gap="3">
          <Box mb="4">
            <SearchField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par code, nom ou équipement mère"
              size="3"
            />
          </Box>

          <Flex direction="column" gap="5">
            <InteractiveTable
              title="Machines avec interventions ouvertes"
              badge={<Badge color="red" variant="solid">{filteredData.filter(m => m.openInterventionsCount > 0).length}</Badge>}
              columns={machineColumns}
              data={filteredData.filter(m => m.openInterventionsCount > 0)}
              onRowClick={handleOpenMachine}
              renderCell={renderMachineCell}
              getRowStyle={getMachineRowStyle}
              loading={loading}
              loadingMessage="Chargement des machines..."
              actionLabel="Voir"
            />

            <InteractiveTable
              title="Reste du parc"
              badge={<Badge color="gray" variant="soft">{filteredData.filter(m => m.openInterventionsCount === 0).length}</Badge>}
              columns={machineColumns}
              data={filteredData.filter(m => m.openInterventionsCount === 0)}
              onRowClick={handleOpenMachine}
              renderCell={renderMachineCell}
              getRowStyle={getMachineRowStyle}
              loading={loading}
              loadingMessage="Chargement des machines..."
              actionLabel="Voir"
            />

            {filteredData.length === 0 && (
              <Box style={{ textAlign: "center", padding: "3rem" }}>
                <Text size="3" color="gray" style={{ fontStyle: "italic" }}>
                  Aucune machine trouvée
                </Text>
              </Box>
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}