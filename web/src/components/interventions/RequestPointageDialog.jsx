/**
 * @fileoverview Dialog de sélection de technicien(s) pour déclencher une demande
 * de pointage sur une intervention.
 * @module components/interventions/RequestPointageDialog
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Flex, Text, Button, Checkbox, Callout, VisuallyHidden } from '@radix-ui/themes';
import { fetchActiveUsers } from '@/api/planning';
import { requestPointage } from '@/api/notifications';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

function techLabel(tech) {
  const name = `${tech.first_name ?? ''} ${tech.last_name ?? ''}`.trim();
  return name || tech.email || tech.id;
}

/**
 * Dialog listant les techniciens actifs en cases à cocher pour choisir à qui
 * envoyer une demande de pointage sur une intervention donnée.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onOpenChange
 * @param {string} props.interventionId - UUID de l'intervention
 * @param {string} [props.defaultTechId] - Technicien pilote pré-coché (tech_id de l'intervention)
 * @param {Function} [props.onSuccess] - Appelé après envoi réussi, avec la liste des tech_ids
 */
export default function RequestPointageDialog({ open, onOpenChange, interventionId, defaultTechId, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoadingUsers(true);
    fetchActiveUsers()
      .then((list) => {
        setUsers(list);
        setSelectedIds(defaultTechId ? [defaultTechId] : []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [open, defaultTechId]);

  const toggleTech = useCallback((id, checked) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((v) => v !== id)));
  }, []);

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setError('Sélectionnez au moins un technicien');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await requestPointage(interventionId, selectedIds);
      onSuccess?.(selectedIds);
      onOpenChange(false);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors de la demande de pointage'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 420 }}>
        <Dialog.Title>Demander le pointage</Dialog.Title>
        <VisuallyHidden>
          <Dialog.Description>Sélectionner les techniciens à qui envoyer la demande de pointage</Dialog.Description>
        </VisuallyHidden>

        {error && (
          <Callout.Root color="red" size="1" mb="3" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex direction="column" gap="2" style={{ maxHeight: 320, overflowY: 'auto' }}>
          {loadingUsers && <Text size="2" color="gray">Chargement des techniciens...</Text>}
          {!loadingUsers && users.length === 0 && (
            <Text size="2" color="gray">Aucun technicien actif</Text>
          )}
          {!loadingUsers && users.map((tech) => (
            <Text as="label" size="2" key={tech.id}>
              <Flex align="center" gap="2">
                <Checkbox
                  checked={selectedIds.includes(tech.id)}
                  onCheckedChange={(checked) => toggleTech(tech.id, !!checked)}
                />
                {techLabel(tech)}
              </Flex>
            </Text>
          ))}
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" disabled={saving}>Annuler</Button>
          </Dialog.Close>
          <Button onClick={handleSubmit} loading={saving} disabled={loadingUsers}>
            Envoyer la demande
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

RequestPointageDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  interventionId: PropTypes.string.isRequired,
  defaultTechId: PropTypes.string,
  onSuccess: PropTypes.func,
};
