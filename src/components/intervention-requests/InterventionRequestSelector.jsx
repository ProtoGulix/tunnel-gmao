import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Heading, Spinner, Text, Tooltip } from '@radix-ui/themes';
import { Bot, ClipboardList, Plus } from 'lucide-react';
import { createInterventionRequest, fetchInterventionRequest, fetchInterventionRequests } from '@/api/intervention-requests';
import InterventionRequestForm from '@/components/intervention-requests/InterventionRequestForm';
import { TYPE_INTER_LABELS } from '@/config/interventionTypes';

function RequestRow({ req, isSelected, onToggle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Box
      onClick={() => onToggle(isSelected ? null : req)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        padding: '10px 12px',
        borderBottom: '1px solid var(--gray-4)',
        background: isSelected ? 'var(--accent-3)' : hovered ? 'var(--gray-2)' : undefined,
        boxShadow: isSelected ? 'inset 3px 0 0 var(--accent-9)' : undefined,
        transition: 'background-color 0.15s',
      }}
    >
      <Flex direction="column" gap="1">
        <Flex align="center" justify="between" gap="2">
          <Text size="1" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--accent-11)' }}>
            {req.code}
          </Text>
          <Badge size="1" variant="soft" style={{ backgroundColor: req.statut_color + '22', color: req.statut_color }}>
            {req.statut_label}
          </Badge>
        </Flex>
        <Flex align="center" gap="2">
          {req.equipement?.code && <Badge color="gray" variant="soft" size="1">{req.equipement.code}</Badge>}
          <Text size="2" weight="medium">{req.equipement?.name ?? '—'}</Text>
        </Flex>
        <Flex align="center" gap="2" wrap="wrap">
          <Text size="1" color="gray">
            {req.demandeur_nom}
            {req.demandeur_service ? ` — ${req.demandeur_service}` : ''}
          </Text>
          {req.is_system && (
            <Tooltip content="Demande générée automatiquement par le moteur préventif">
              <Badge color="gray" variant="soft" size="1" style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Bot size={10} />Système
              </Badge>
            </Tooltip>
          )}
        </Flex>
        <Text size="1" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {req.description}
        </Text>
        {req.suggested_type_inter && (
          <Flex align="center" gap="1">
            <Text size="1" color="gray">Type suggéré :</Text>
            <Badge color="blue" variant="soft" size="1">
              {TYPE_INTER_LABELS[req.suggested_type_inter] ?? req.suggested_type_inter}
            </Badge>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

RequestRow.propTypes = {
  req: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default function InterventionRequestSelector({ selectedId, onSelect, machineId = null, machineName = null }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = { limit: 100, excludeStatuses: 'rejetee,cloturee,acceptee' };
    if (machineId) params.machineId = machineId;
    fetchInterventionRequests(params)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items ?? []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey, machineId]);

  const handleCreate = useCallback(async (formData) => {
    setSaving(true);
    try {
      const created = await createInterventionRequest(formData);
      const detail = await fetchInterventionRequest(created.id);
      setShowCreate(false);
      setRefreshKey((k) => k + 1);
      onSelect(detail);
    } finally {
      setSaving(false);
    }
  }, [onSelect]);

  if (showCreate) {
    return (
      <InterventionRequestForm
        onSubmit={handleCreate}
        onCancel={() => setShowCreate(false)}
        saving={saving}
        machineId={machineId}
        machineName={machineName}
      />
    );
  }

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* En-tête */}
      <Flex align="center" gap="2" px="3" py="3" style={{ borderBottom: '1px solid var(--gray-4)' }}>
        <ClipboardList size={18} color="var(--accent-9)" />
        <Heading size="3" weight="bold">Demandes ouvertes</Heading>
        {!loading && <Badge color="gray" variant="soft" size="1">{items.length}</Badge>}
        <Box style={{ flex: 1 }} />
        <Button size="1" variant="soft" color="blue" onClick={() => setShowCreate(true)}>
          <Plus size={12} />
          Nouvelle
        </Button>
      </Flex>

      {/* Corps */}
      {loading && <Flex justify="center" p="4"><Spinner size="2" /></Flex>}

      {!loading && items.length === 0 && (
        <Text size="2" color="gray" style={{ display: 'block', padding: '1.5rem', textAlign: 'center' }}>
          Aucune demande ouverte
        </Text>
      )}

      {!loading && items.length > 0 && (
        <Box style={{ maxHeight: 480, overflowY: 'auto' }}>
          {items.map((req) => (
            <RequestRow
              key={req.id}
              req={req}
              isSelected={req.id === selectedId}
              onToggle={onSelect}
            />
          ))}
        </Box>
      )}
    </Card>
  );
}

InterventionRequestSelector.propTypes = {
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  machineId: PropTypes.string,
  machineName: PropTypes.string,
};
