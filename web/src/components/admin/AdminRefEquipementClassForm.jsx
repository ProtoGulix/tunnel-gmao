/**
 * @fileoverview Formulaire de création et de modification d'une classe d'équipement
 * @module components/admin/AdminRefEquipementClassForm
 */

import PropTypes from 'prop-types';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';

/**
 * Formulaire de classe, défini hors de la section : un composant recréé à chaque rendu
 * remonte ses champs, qui perdent alors le curseur à chaque lettre tapée.
 */
export default function ClassForm({ form, setForm, submitting, onSubmit, submitLabel }) {
  return (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="3" mt="4">
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Code * (ex: ELEC)</Text>
          <TextField.Root
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            placeholder="CODE"
            required
          />
        </label>
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
          <TextField.Root
            value={form.label}
            onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
            placeholder="Ex : Électrique"
            required
          />
        </label>
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Description</Text>
          <TextField.Root
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description optionnelle"
          />
        </label>
      </Flex>
      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button variant="soft" color="gray" type="button">Annuler</Button>
        </Dialog.Close>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'En cours...' : submitLabel}
        </Button>
      </Flex>
    </form>
  );
}

ClassForm.propTypes = {
  form: PropTypes.shape({ code: PropTypes.string, label: PropTypes.string, description: PropTypes.string }).isRequired,
  setForm: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string.isRequired,
};
