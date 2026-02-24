/**
 * @fileoverview Dialog de création/édition d'une classe d'équipement
 * @module components/equipements/EquipementClassDialog
 */

import { Flex, Text, Button, Dialog, TextField, TextArea } from '@radix-ui/themes';

/**
 * Dialog pour créer ou éditer une classe d'équipement
 */
export default function EquipementClassDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  onSubmit,
  submitting,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>
          {editing ? 'Modifier la classe' : 'Nouvelle classe'}
        </Dialog.Title>
        <form onSubmit={onSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">
                Code *
              </Text>
              <TextField.Root
                value={form.code}
                onChange={(e) => onFormChange({ ...form, code: e.target.value })}
                placeholder="Ex: SCIE, PONT, CONV..."
                required
              />
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">
                Libellé *
              </Text>
              <TextField.Root
                value={form.label}
                onChange={(e) => onFormChange({ ...form, label: e.target.value })}
                placeholder="Ex: Scie, Pont roulant..."
                required
              />
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">
                Description
              </Text>
              <TextArea
                value={form.description}
                onChange={(e) => onFormChange({ ...form, description: e.target.value })}
                placeholder="Description optionnelle..."
                rows={3}
              />
            </label>
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">
                Annuler
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : editing ? 'Modifier' : 'Créer'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
