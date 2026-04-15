/**
 * @fileoverview DayContextPanel — panneau contextuel inline deux colonnes
 * @module components/planning/DayContextPanel
 *
 * Affiché sous la grille de planning quand le tech clique sur un jour.
 *
 * En-tête : date + EquipementSearch obligatoire.
 *   Sans équipement → les deux colonnes montrent un état d'attente.
 *   Pré-sélection automatique si toutes les actions du jour partagent le même équipement.
 *
 * Colonne gauche "Sur quoi travailler ?"
 *   Réutilise InterventionSelector et InterventionRequestSelector tels quels.
 *   Deux onglets Radix avec compteur.
 *
 * Colonne droite "Saisir l'action"
 *   Verrouillée tant qu'aucun item n'est sélectionné.
 *   Intervention → ActionForm directement (showContext=false).
 *   DI → InterventionCreatorFlow, puis ActionForm auto à la création.
 *   Après onSuccess : réinitialise la sélection, conserve l'équipement.
 *
 * @param {Object}   props
 * @param {string}   props.date                - Date sélectionnée (YYYY-MM-DD)
 * @param {string}   [props.techId]            - UUID du technicien filtré
 * @param {string}   [props.techInitials]      - Initiales du technicien (pour InterventionCreatorFlow)
 * @param {Array}    [props.weekActionsForDay]  - Actions déjà chargées pour ce jour (pré-sélection équipement)
 * @param {Function} props.onClose             - Ferme le panneau
 * @param {Function} [props.onActionCreated]   - Appelé après enregistrement d'une action
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Tabs, Text } from '@radix-ui/themes';
import { Calendar, ClipboardList, Lock, MapPin, Wrench, X } from 'lucide-react';
import { createActionDirect } from '@/api/planning';
import { fetchGammeStepValidations } from '@/api/gammeStepValidations';
import { fetchActionCategories } from '@/api/actionCategories';
import { fetchComplexityFactors } from '@/api/complexityFactors';
import ActionForm from '@/components/interventions/ActionForm';
import { InterventionCreatorFlow } from '@/components/planning/InterventionSelector';
import InterventionSelector from '@/components/planning/InterventionSelector';
import InterventionRequestSelector from '@/components/intervention-requests/InterventionRequestSelector';
import EquipementSearch from '@/components/planning/EquipementSearch';
import LockedBadge from '@/components/ui/LockedBadge';

/* ── Utilitaire pré-sélection équipement ─────────────────────────────────── */

/**
 * Si toutes les actions du jour partagent le même équipement, retourne cet objet
 * (shape minimale : { id, code, name }).
 */
function detectUniqueEquipement(actions) {
  if (!actions?.length) return null;
  const machines = actions.map((a) => a.intervention?.machine).filter(Boolean);
  if (!machines.length) return null;
  const firstId = machines[0].id;
  if (!machines.every((m) => m.id === firstId)) return null;
  return { id: machines[0].id, code: machines[0].code ?? '', name: machines[0].name ?? '' };
}

/* ── Placeholder équipement requis ───────────────────────────────────────── */

function EquipementRequired() {
  return (
    <Flex
      direction="column" align="center" justify="center" gap="2"
      style={{
        minHeight: 120,
        border: '1px dashed var(--gray-5)',
        borderRadius: 'var(--radius-2)',
        background: 'var(--gray-1)',
        padding: '1.5rem',
      }}
    >
      <MapPin size={18} color="var(--gray-7)" />
      <Text size="2" color="gray" align="center">
        Sélectionne un équipement pour afficher les interventions et demandes
      </Text>
    </Flex>
  );
}

/* ── Colonne gauche ───────────────────────────────────────────────────────── */

function LeftColumn({
  date,
  formattedDate,
  pickedEquipement,
  onEquipementChange,
  preselectedEquipement,
  equipementId,
  equipementLabel,
  selectedIntervention,
  onSelectIntervention,
  selectedRequest,
  onSelectRequest,
}) {
  const handleToggleIntervention = useCallback((item) => {
    onSelectIntervention(item);
    if (item) onSelectRequest(null);
  }, [onSelectIntervention, onSelectRequest]);

  const handleToggleRequest = useCallback((item) => {
    onSelectRequest(item);
    if (item) onSelectIntervention(null);
  }, [onSelectRequest, onSelectIntervention]);

  return (
    <Flex direction="column" gap="3">
      {/* Date */}
      <Flex align="center" gap="2">
        <Calendar size={16} color="var(--blue-9)" />
        <Text size="3" weight="bold" style={{ textTransform: 'capitalize' }}>
          {formattedDate}
        </Text>
      </Flex>

      {/* Sélecteur équipement */}
      <EquipementSearch
        key={preselectedEquipement?.id ?? 'empty'}
        value={pickedEquipement}
        onChange={onEquipementChange}
        placeholder="Équipement concerné…"
      />

      {/* Onglets interventions / demandes */}
      {equipementId ? (
        <Tabs.Root defaultValue="interventions">
          <Tabs.List>
            <Tabs.Trigger value="interventions">
              <Flex align="center" gap="1">
                <Wrench size={12} />
                Interventions ouvertes
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="requests">
              <Flex align="center" gap="1">
                <ClipboardList size={12} />
                Demandes en attente
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="2">
            <Tabs.Content value="interventions">
              <InterventionSelector
                equipementId={equipementId}
                equipementLabel={equipementLabel}
                value={selectedIntervention}
                onChange={handleToggleIntervention}
                onCreateClick={null}
              />
            </Tabs.Content>

            <Tabs.Content value="requests">
              <InterventionRequestSelector
                selectedId={selectedRequest?.id ?? null}
                onSelect={handleToggleRequest}
                machineId={equipementId}
                machineName={equipementLabel}
              />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      ) : (
        <EquipementRequired />
      )}
    </Flex>
  );
}

LeftColumn.propTypes = {
  date: PropTypes.string,
  formattedDate: PropTypes.string,
  pickedEquipement: PropTypes.object,
  onEquipementChange: PropTypes.func.isRequired,
  preselectedEquipement: PropTypes.object,
  equipementId: PropTypes.string,
  equipementLabel: PropTypes.string,
  selectedIntervention: PropTypes.object,
  onSelectIntervention: PropTypes.func.isRequired,
  selectedRequest: PropTypes.object,
  onSelectRequest: PropTypes.func.isRequired,
};

/* ── Colonne droite ───────────────────────────────────────────────────────── */

function RightColumn({ date, techId, equipementId, equipementLabel, selectedIntervention, selectedRequest, onSuccess, metadata }) {
  const [createdIntervention, setCreatedIntervention] = useState(null);
  const [gammeValidations, setGammeValidations] = useState([]);

  // Reset quand la sélection gauche change
  const prevSelectionKey = `${selectedIntervention?.id ?? ''}-${selectedRequest?.id ?? ''}`;
  const [lastKey, setLastKey] = useState(prevSelectionKey);
  if (prevSelectionKey !== lastKey) {
    setCreatedIntervention(null);
    setGammeValidations([]);
    setLastKey(prevSelectionKey);
  }

  // Charger les étapes de gamme si l'intervention sélectionnée est liée à un plan préventif
  useEffect(() => {
    if (!selectedIntervention?.plan_id) {
      setGammeValidations([]);
      return;
    }
    fetchGammeStepValidations(String(selectedIntervention.id))
      .then((data) => setGammeValidations(Array.isArray(data) ? data : []))
      .catch(() => setGammeValidations([]));
  }, [selectedIntervention?.id, selectedIntervention?.plan_id]);

  const noEquipement = !equipementId;
  const noSelection = !selectedIntervention && !selectedRequest;
  const isLocked = noEquipement || noSelection;

  const resolvedInterventionId =
    selectedIntervention?.id?.toString() ?? createdIntervention?.id?.toString() ?? null;

  const handleInterventionCreated = useCallback((created) => {
    setCreatedIntervention(created);
  }, []);

  const renderHeader = () => {
    if (selectedIntervention) {
      return (
        <LockedBadge
          icon={Wrench}
          label={`${selectedIntervention.code} — ${selectedIntervention.title ?? ''}`}
        />
      );
    }
    if (selectedRequest) {
      if (createdIntervention) {
        return (
          <LockedBadge
            icon={Wrench}
            label={`${createdIntervention.code} — ${createdIntervention.title ?? ''}`}
            sublabel={`Créée depuis DI ${selectedRequest.code}`}
          />
        );
      }
      return (
        <LockedBadge
          icon={ClipboardList}
          label={`DI ${selectedRequest.code}`}
          sublabel="Créez l'intervention ci-dessous pour saisir l'action"
        />
      );
    }
    return null;
  };

  const lockMessage = noEquipement
    ? 'Sélectionne un équipement'
    : 'Sélectionne une intervention ou une demande';

  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <Calendar size={14} color="var(--gray-9)" />
        <Text size="2" weight="bold" color="gray">Saisir l&apos;action</Text>
      </Flex>

      {isLocked ? (
        <Flex
          align="center" justify="center" direction="column" gap="2"
          style={{
            minHeight: 160,
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)',
            background: 'var(--gray-1)',
            padding: '1.5rem',
          }}
        >
          <Lock size={20} color="var(--gray-7)" />
          <Text size="2" color="gray" align="center">{lockMessage}</Text>
        </Flex>
      ) : (
        <Flex direction="column" gap="2">
          {renderHeader()}

          {/* DI sélectionnée sans intervention encore créée → flow création */}
          {selectedRequest && !createdIntervention && (
            <Box mt="1">
              <InterventionCreatorFlow
                equipementId={selectedRequest.machine_id ?? equipementId ?? ''}
                equipementLabel={selectedRequest.machine_name ?? equipementLabel ?? ''}
                initialRequest={selectedRequest}
                onCreated={handleInterventionCreated}
                onCancel={null}
              />
            </Box>
          )}

          {/* ActionForm dès qu'on a un interventionId résolu */}
          {resolvedInterventionId && (
            <Box mt="1">
              <ActionForm
                key={`${resolvedInterventionId}-${date}`}
                initialState={{ date: date ?? '' }}
                metadata={metadata}
                onCancel={() => {}}
                onSubmit={createActionDirect}
                onSuccess={onSuccess}
                interventionId={resolvedInterventionId}
                interventionMeta={selectedIntervention ?? createdIntervention}
                techId={techId}
                showContext={false}
                gammeValidations={gammeValidations}
              />
            </Box>
          )}
        </Flex>
      )}
    </Flex>
  );
}

RightColumn.propTypes = {
  date: PropTypes.string,
  techId: PropTypes.string,
  equipementId: PropTypes.string,
  equipementLabel: PropTypes.string,
  selectedIntervention: PropTypes.object,
  selectedRequest: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  metadata: PropTypes.object.isRequired,
};

/* ── DayContextPanel ──────────────────────────────────────────────────────── */

export default function DayContextPanel({
  date,
  techId,
  weekActionsForDay = [],
  onClose,
  onActionCreated,
}) {
  const [metadata, setMetadata] = useState({ subcategories: [], complexityFactors: [] });

  useEffect(() => {
    Promise.all([fetchActionCategories(), fetchComplexityFactors()])
      .then(([cats, factors]) => setMetadata({ subcategories: cats ?? [], complexityFactors: factors ?? [] }))
      .catch(() => {});
  }, []);

  const preselectedEquipement = useMemo(
    () => detectUniqueEquipement(weekActionsForDay),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [pickedEquipement, setPickedEquipement] = useState(preselectedEquipement);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const equipementId = pickedEquipement?.id ?? null;
  const equipementLabel = pickedEquipement
    ? `${pickedEquipement.code ? pickedEquipement.code + ' — ' : ''}${pickedEquipement.name ?? ''}`
    : '';

  const handleEquipementChange = useCallback((eq) => {
    setPickedEquipement(eq);
    setSelectedIntervention(null);
    setSelectedRequest(null);
  }, []);

  // Après enregistrement : reset sélection, conserve l'équipement
  const handleSuccess = useCallback(() => {
    setSelectedIntervention(null);
    setSelectedRequest(null);
    onActionCreated?.();
  }, [onActionCreated]);

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : 'Jour sélectionné';

  return (
    <Card
      style={{
        marginTop: 'var(--space-4)',
        animation: 'dayPanelFadeIn 0.18s ease-out',
        border: '1px solid var(--blue-6)',
        background: 'var(--color-panel-solid)',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes dayPanelFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Bouton fermeture — coin supérieur droit du card */}
      <Button
        size="1" variant="ghost" color="gray"
        onClick={onClose} aria-label="Fermer"
        style={{ position: 'absolute', top: 12, right: 12 }}
      >
        <X size={14} />
      </Button>

      {/* ── Grille deux colonnes alignées en haut ── */}
      {/* overflow visible sur ce conteneur pour ne pas casser le sticky de la colonne droite */}
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>
        <LeftColumn
          date={date}
          formattedDate={formattedDate}
          pickedEquipement={pickedEquipement}
          onEquipementChange={handleEquipementChange}
          preselectedEquipement={preselectedEquipement}
          equipementId={equipementId}
          equipementLabel={equipementLabel}
          selectedIntervention={selectedIntervention}
          onSelectIntervention={setSelectedIntervention}
          selectedRequest={selectedRequest}
          onSelectRequest={setSelectedRequest}
        />

        <Box style={{ position: 'sticky', top: '1rem', alignSelf: 'start' }}>
          <RightColumn
            date={date}
            techId={techId}
            equipementId={equipementId}
            equipementLabel={equipementLabel}
            selectedIntervention={selectedIntervention}
            selectedRequest={selectedRequest}
            onSuccess={handleSuccess}
            metadata={metadata}
          />
        </Box>
      </Box>
    </Card>
  );
}

DayContextPanel.propTypes = {
  date: PropTypes.string,
  techId: PropTypes.string,
  /** Initiales du technicien — conservée pour usage futur */
  techInitials: PropTypes.string,
  weekActionsForDay: PropTypes.arrayOf(PropTypes.object),
  onClose: PropTypes.func.isRequired,
  onActionCreated: PropTypes.func,
};
