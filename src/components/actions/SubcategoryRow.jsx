/**
 * @fileoverview Ligne de sous-catégorie dans le tableau
 *
 * Composant pour afficher une sous-catégorie d'action
 *
 * @module components/actions/ActionCategoriesTable/SubcategoryRow
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from 'prop-types';
import { useState } from 'react';
import { Table, Badge, Button, Flex, TextField } from "@radix-ui/themes";
import { Trash2, Edit2, Check, X } from "lucide-react";

/**
 * Ligne de sous-catégorie
 *
 * @component
 * @param {Object} props - Props du composant
 * @param {Object} props.subcategory - Objet sous-catégorie
 * @param {Function} props.onDelete - Callback suppression
 * @param {boolean} [props.loading=false] - État de chargement
 * @returns {JSX.Element} Ligne de sous-catégorie
 *
 * @example
 * <SubcategoryRow
 *   subcategory={{ id: 1, code: 'DEP_ELEC', name: 'Dépannage Électrique' }}
 *   onDelete={handleDelete}
 * />
 */
export default function SubcategoryRow({ subcategory, onDelete, onUpdate, loading = false }) {
  const [editing, setEditing] = useState(false);
  const [editCode, setEditCode] = useState(subcategory.code);
  const [editName, setEditName] = useState(subcategory.name);
  const [editLoading, setEditLoading] = useState(false);

  return (
    <Table.Row>
      <Table.Cell>
        {editing ? (
          <TextField.Root
            value={editCode}
            onChange={(e) => setEditCode(e.target.value.toUpperCase())}
            disabled={editLoading}
            size="2"
          />
        ) : (
          <Badge color="blue" variant="soft" size="2">
            {subcategory.code}
          </Badge>
        )}
      </Table.Cell>
      <Table.Cell>
        {editing ? (
          <TextField.Root
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={editLoading}
            size="2"
          />
        ) : (
          subcategory.name
        )}
      </Table.Cell>
      <Table.Cell>
        <Flex justify="center" gap="2">
          {!editing ? (
            <>
              <Button
                variant="ghost"
                color="violet"
                size="1"
                onClick={() => setEditing(true)}
                disabled={loading}
              >
                <Edit2 size={14} />
              </Button>
              <Button
                variant="ghost"
                color="red"
                size="1"
                onClick={() => onDelete(subcategory.id)}
                disabled={loading}
              >
                <Trash2 size={14} />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="soft"
                color="green"
                size="1"
                disabled={editLoading}
                onClick={async () => {
                  if (!editCode?.trim() || !editName?.trim()) return;
                  try {
                    setEditLoading(true);
                    await onUpdate(subcategory.id, { code: editCode.trim(), name: editName.trim() });
                    setEditing(false);
                  } finally {
                    setEditLoading(false);
                  }
                }}
              >
                <Check size={14} />
              </Button>
              <Button
                variant="soft"
                color="gray"
                size="1"
                onClick={() => { setEditing(false); setEditCode(subcategory.code); setEditName(subcategory.name); }}
                disabled={editLoading}
              >
                <X size={14} />
              </Button>
            </>
          )}
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

SubcategoryRow.propTypes = {
  subcategory: PropTypes.shape({
    id: PropTypes.number.isRequired,
    code: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
