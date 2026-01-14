/**
 * @fileoverview Panneau inline de gestion complète des fournisseurs
 * Permet d'ajouter, modifier et supprimer des fournisseurs avec gestion inline des formulaires
 *
 * @module components/purchase/suppliers/SuppliersInlinePanel
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Flex,
  Text,
  Button,
  TextField,
  Card,
  Badge,
  Table,
  Callout,
} from '@radix-ui/themes';
import { Plus, Edit2, Trash2, Building2, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Panneau de gestion des fournisseurs avec CRUD inline
 * @component
 * 
 * @param {Object} props
 * @param {Array<Object>} props.suppliers - Liste des fournisseurs existants
 * @param {Function} props.onAdd - Callback async pour créer un fournisseur
 * @param {Function} props.onUpdate - Callback async pour mettre à jour un fournisseur
 * @param {Function} props.onDelete - Callback async pour supprimer un fournisseur
 * @param {boolean} [props.loading=false] - État de chargement global
 * @returns {JSX.Element} Panneau de gestion des fournisseurs
 * 
 * @example
 * <SuppliersInlinePanel
 *   suppliers={suppliersList}
 *   onAdd={handleAdd}
 *   onUpdate={handleUpdate}
 *   onDelete={handleDelete}
 *   loading={isLoading}
 * />
 */
export default function SuppliersInlinePanel({
  suppliers = [],
  onAdd,
  onUpdate,
  onDelete,
  loading = false,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
  });

  // Réinitialise le formulaire
  const resetForm = useCallback(() => {
    setFormData({ name: '', contact: '', email: '', phone: '' });
    setError(null);
  }, []);

  // Démarre l'ajout
  const startAdd = useCallback(() => {
    resetForm();
    setIsAdding(true);
  }, [resetForm]);

  // Démarre l'édition
  const startEdit = useCallback((supplier) => {
    setFormData({
      name: supplier.name || '',
      contact: supplier.contact || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
    });
    setEditingId(supplier.id);
    setError(null);
  }, []);

  // Valide le formulaire
  const validateForm = useCallback(() => {
    if (!formData.name.trim()) {
      setError('Le nom du fournisseur est requis');
      return false;
    }
    setError(null);
    return true;
  }, [formData]);

  // Ajoute un fournisseur
  const handleAdd = useCallback(async () => {
    if (!validateForm()) return;

    try {
      await onAdd({
        name: formData.name.trim(),
        contact: formData.contact.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
      });
      setIsAdding(false);
      resetForm();
    } catch (err) {
      setError('Erreur lors de la création du fournisseur');
      console.error('Add supplier error:', err);
    }
  }, [formData, onAdd, validateForm, resetForm]);

  // Met à jour un fournisseur
  const handleUpdate = useCallback(async (supplierId) => {
    if (!validateForm()) return;

    try {
      await onUpdate(supplierId, {
        name: formData.name.trim(),
        contact: formData.contact.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
      });
      setEditingId(null);
      resetForm();
    } catch (err) {
      setError('Erreur lors de la mise à jour du fournisseur');
      console.error('Update supplier error:', err);
    }
  }, [formData, onUpdate, validateForm, resetForm]);

  // Supprime un fournisseur
  const handleDeleteConfirm = useCallback(async (supplierId) => {
    try {
      await onDelete(supplierId);
      setDeleteConfirmId(null);
    } catch (err) {
      setError('Erreur lors de la suppression du fournisseur');
      console.error('Delete supplier error:', err);
    }
  }, [onDelete]);

  // Annule l'édition
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  }, [resetForm]);

  // Compte des statistiques
  const stats = useMemo(() => ({
    total: suppliers.length,
  }), [suppliers.length]);

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* En-tête avec titre et badge */}
        <Flex justify="between" align="center">
          <Flex gap="2" align="center">
            <Building2 size={20} />
            <Text size="3" weight="bold">
              Fournisseurs
            </Text>
            <Badge color="blue" variant="soft">
              {stats.total}
            </Badge>
          </Flex>
          {!isAdding && editingId === null && (
            <Button
              size="2"
              color="blue"
              onClick={startAdd}
              disabled={loading}
            >
              <Plus size={16} />
              Ajouter
            </Button>
          )}
        </Flex>

        {/* Affichage des erreurs */}
        {error && (
          <Callout color="red" role="alert">
            <AlertCircle size={16} />
            <Text size="2">{error}</Text>
          </Callout>
        )}

        {/* Liste des fournisseurs existants */}
        {suppliers.length === 0 && !isAdding ? (
          <Box p="4" style={{ textAlign: 'center', background: 'var(--gray-2)', borderRadius: '8px' }}>
            <Text size="2" color="gray">
              Aucun fournisseur disponible
            </Text>
          </Box>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Téléphone</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ width: '120px' }}>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {suppliers.map((supplier) => (
                  <Table.Row key={supplier.id}>
                    {editingId === supplier.id ? (
                      <>
                        <Table.Cell colSpan={5}>
                          <Box p="3" style={{ background: 'var(--blue-2)', borderRadius: '8px' }}>
                            <Flex direction="column" gap="3">
                              <Text size="2" weight="bold">Éditer le fournisseur</Text>

                              <Box>
                                <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                  Nom *
                                </Text>
                                <TextField.Root
                                  placeholder="Nom du fournisseur"
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  disabled={loading}
                                />
                              </Box>

                              <Box>
                                <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                  Contact
                                </Text>
                                <TextField.Root
                                  placeholder="Nom du contact"
                                  value={formData.contact}
                                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                  disabled={loading}
                                />
                              </Box>

                              <Box>
                                <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                  Email
                                </Text>
                                <TextField.Root
                                  type="email"
                                  placeholder="contact@fournisseur.com"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  disabled={loading}
                                />
                              </Box>

                              <Box>
                                <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                  Téléphone
                                </Text>
                                <TextField.Root
                                  placeholder="+33 1 23 45 67 89"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  disabled={loading}
                                />
                              </Box>

                              <Flex gap="2" justify="end">
                                <Button
                                  variant="soft"
                                  color="gray"
                                  onClick={cancelEdit}
                                  disabled={loading}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  color="blue"
                                  onClick={() => handleUpdate(supplier.id)}
                                  disabled={loading || !formData.name.trim()}
                                >
                                  {loading ? 'Mise à jour...' : 'Mettre à jour'}
                                </Button>
                              </Flex>
                            </Flex>
                          </Box>
                        </Table.Cell>
                      </>
                    ) : (
                      <>
                        <Table.Cell>
                          <Flex gap="2" align="center">
                            <Building2 size={16} />
                            <Text weight="bold">{supplier.name}</Text>
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Text color="gray">{supplier.contact || '-'}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text color="gray" size="2">{supplier.email || '-'}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text color="gray" size="2">{supplier.phone || '-'}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2">
                            <Button
                              size="1"
                              variant="soft"
                              color="blue"
                              onClick={() => startEdit(supplier)}
                              disabled={loading || isAdding || editingId !== null}
                              title="Éditer"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              size="1"
                              variant="soft"
                              color="red"
                              onClick={() => setDeleteConfirmId(supplier.id)}
                              disabled={loading || isAdding || editingId !== null}
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </>
                    )}
                  </Table.Row>
                ))}

                {/* Formulaire d'ajout */}
                {isAdding && (
                  <Table.Row>
                    <Table.Cell colSpan={5}>
                      <Box p="3" style={{ background: 'var(--green-2)', borderRadius: '8px' }}>
                        <Flex direction="column" gap="3">
                          <Text size="2" weight="bold">Ajouter un fournisseur</Text>

                          <Box>
                            <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                              Nom *
                            </Text>
                            <TextField.Root
                              placeholder="Nom du fournisseur"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              disabled={loading}
                              autoFocus
                            />
                          </Box>

                          <Box>
                            <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                              Contact
                            </Text>
                            <TextField.Root
                              placeholder="Nom du contact"
                              value={formData.contact}
                              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                              disabled={loading}
                            />
                          </Box>

                          <Box>
                            <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                              Email
                            </Text>
                            <TextField.Root
                              type="email"
                              placeholder="contact@fournisseur.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              disabled={loading}
                            />
                          </Box>

                          <Box>
                            <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                              Téléphone
                            </Text>
                            <TextField.Root
                              placeholder="+33 1 23 45 67 89"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              disabled={loading}
                            />
                          </Box>

                          <Flex gap="2" justify="end">
                            <Button
                              variant="soft"
                              color="gray"
                              onClick={cancelEdit}
                              disabled={loading}
                            >
                              Annuler
                            </Button>
                            <Button
                              color="blue"
                              onClick={handleAdd}
                              disabled={loading || !formData.name.trim()}
                            >
                              {loading ? 'Création...' : 'Ajouter'}
                            </Button>
                          </Flex>
                        </Flex>
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        )}

        {/* Dialog de confirmation de suppression */}
        {deleteConfirmId !== null && (
          <Card style={{ background: 'var(--red-2)', borderLeft: '4px solid var(--red-9)' }}>
            <Flex gap="3" align="center">
              <AlertCircle size={20} color="var(--red-9)" />
              <Flex direction="column" gap="2" style={{ flex: 1 }}>
                <Text weight="bold" color="red">
                  Êtes-vous sûr de vouloir supprimer ce fournisseur ?
                </Text>
                <Text size="2" color="gray">
                  Cette action ne peut pas être annulée.
                </Text>
              </Flex>
              <Flex gap="2">
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  color="red"
                  onClick={() => handleDeleteConfirm(deleteConfirmId)}
                  disabled={loading}
                >
                  {loading ? 'Suppression...' : 'Supprimer'}
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  );
}

SuppliersInlinePanel.propTypes = {
  suppliers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    contact: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  })).isRequired,
  onAdd: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
