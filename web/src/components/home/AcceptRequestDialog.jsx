/**
 * @fileoverview Fenêtre courte d'acceptation d'une demande : type, technicien, priorité facultative.
 * Types et techniciens viennent des mêmes sources que la création d'intervention.
 * @module components/home/AcceptRequestDialog
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Dialog, Flex, Select, Text } from '@radix-ui/themes';
import StatusCallout from '@/components/ui/StatusCallout';
import { fetchActiveUsers } from '@/api/planning';
import { useInterventionTypeRefs } from '@/hooks/shared/useInterventionTypeRefs';
import { usePermittedInterventionTypes } from '@/hooks/shared/usePermittedInterventionTypes';
import { selectableTypes, TYPE_REQUIRED_MESSAGE } from '@/lib/interventionTypesStore';
import { REQUEST_PRIORITIES } from '@/lib/requestPriority';

const NONE = '__none__';

function Field({ label, children }) {
  return (
    <Box>
      <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>{label}</Text>
      {children}
    </Box>
  );
}
Field.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

export default function AcceptRequestDialog({ request, onClose, onAccept }) {
  const [users, setUsers] = useState([]);
  const [type, setType] = useState('');
  const [tech, setTech] = useState('');
  const [priority, setPriority] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const { types, activeTypes } = useInterventionTypeRefs();
  const permitted = usePermittedInterventionTypes(request?.equipement?.id);
  const locked = !!(request?.is_system && request?.suggested_type_inter);
  const { options } = selectableTypes({ activeTypes, allTypes: types, permitted, value: type, locked });

  useEffect(() => {
    if (!request) return;
    setType(request.suggested_type_inter ?? '');
    setTech('');
    setPriority(request.priorite ?? '');
    setError(null);
  }, [request]);

  useEffect(() => { fetchActiveUsers().then(setUsers).catch(() => {}); }, []);

  // La transition attend les initiales : un utilisateur sans initiales n'est pas proposé
  const techs = users.filter((u) => u.initial);

  const submit = async () => {
    if (!type) { setError(TYPE_REQUIRED_MESSAGE); return; }
    if (!tech) { setError('Choisissez le technicien'); return; }
    setSaving(true);
    setError(null);
    try {
      await onAccept(request, { typeInter: type, techInitials: tech, priority: priority || undefined });
    } catch (err) {
      if (!err?.isAuditCancelled) setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={!!request} onOpenChange={(v) => { if (!v && !saving) onClose(); }}>
      <Dialog.Content style={{ maxWidth: 420 }}>
        <Dialog.Title>Accepter {request?.code}</Dialog.Title>
        <Flex direction="column" gap="3">
          <Field label="Type">
            <Select.Root value={type} onValueChange={setType} disabled={locked}>
              <Select.Trigger placeholder="Choisir…" style={{ width: '100%' }} />
              <Select.Content>
                {options.map((t) => <Select.Item key={t.id} value={t.id}>{t.title}</Select.Item>)}
              </Select.Content>
            </Select.Root>
          </Field>
          <Field label="Technicien">
            <Select.Root value={tech} onValueChange={setTech}>
              <Select.Trigger placeholder="Choisir…" style={{ width: '100%' }} />
              <Select.Content>
                {techs.map((u) => (
                  <Select.Item key={u.id} value={u.initial}>
                    {u.first_name} {u.last_name} ({u.initial})
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Field>
          <Field label="Priorité (facultative)">
            <Select.Root value={priority || NONE} onValueChange={(v) => setPriority(v === NONE ? '' : v)}>
              <Select.Trigger style={{ width: '100%' }} />
              <Select.Content>
                <Select.Item value={NONE}>Par défaut</Select.Item>
                {REQUEST_PRIORITIES.map((p) => <Select.Item key={p.code} value={p.code}>{p.label}</Select.Item>)}
              </Select.Content>
            </Select.Root>
          </Field>
          {error && <StatusCallout type="error">{error}</StatusCallout>}
          <Flex justify="end" gap="2">
            <Button variant="soft" color="gray" onClick={onClose} disabled={saving}>Annuler</Button>
            <Button onClick={submit} loading={saving}>Accepter</Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

AcceptRequestDialog.propTypes = {
  request: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
};
