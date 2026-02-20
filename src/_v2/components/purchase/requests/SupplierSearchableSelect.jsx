import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text, TextField, Button } from '@radix-ui/themes';
import SearchableSelect from '@/components/common/SearchableSelect';
import { Building2 } from 'lucide-react';

/**
 * SearchableSelect spécialisé pour la sélection/création de fournisseurs
 * Permet de rechercher un fournisseur existant ou de créer un nouveau
 */
export default function SupplierSearchableSelect({
  suppliers = [],
  value,
  onChange,
  onCreateSupplier,
  required = false,
  loading = false
}) {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({ name: '', contact: '', email: '', phone: '' });

  const handleSelectSupplier = (supplier) => {
    if (supplier?.isNewSupplier) {
      // L'utilisateur a cliqué sur "Créer un nouveau fournisseur"
      setIsCreatingNew(true);
      setNewSupplierData({ name: supplier.name || '', contact: '', email: '', phone: '' });
    } else {
      // Fournisseur existant sélectionné
      onChange(supplier);
      setIsCreatingNew(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierData.name.trim()) {
      console.warn('Le nom du fournisseur est requis');
      return;
    }

    try {
      const createdSupplier = await onCreateSupplier(newSupplierData);
      onChange(createdSupplier);
      setIsCreatingNew(false);
      setNewSupplierData({ name: '', contact: '', email: '', phone: '' });
    } catch (error) {
      console.error('Erreur lors de la création du fournisseur:', error);
    }
  };

  const handleCancelCreate = () => {
    setIsCreatingNew(false);
    setNewSupplierData({ name: '', contact: '', email: '', phone: '' });
  };

  return (
    <Box>
      {!isCreatingNew ? (
        <SearchableSelect
          items={suppliers}
          label="Fournisseur"
          value={value?.id || value}
          onChange={handleSelectSupplier}
          getDisplayText={(supplier) => supplier.name || supplier.id}
          getSearchableFields={(supplier) => [
            supplier.name,
            supplier.contact,
            supplier.email,
            supplier.phone,
          ]}
          renderItem={(supplier) => (
            <Flex gap="2" align="center">
              <Building2 size={16} />
              <Box>
                <Text size="2" weight="bold">{supplier.name}</Text>
                {supplier.contact && <Text size="1" color="gray">{supplier.contact}</Text>}
              </Box>
            </Flex>
          )}
          renderSelected={(supplier) => (
            <Flex gap="2" align="center">
              <Building2 size={16} />
              <Text size="2" weight="bold">{supplier.name}</Text>
            </Flex>
          )}
          required={required}
          placeholder="Rechercher ou créer un fournisseur..."
          allowSpecialRequest={false}
          allowCreateNew={true}
        />
      ) : (
        <Box p="3" style={{ border: '1px solid var(--blue-7)', borderRadius: '8px', background: 'var(--blue-2)' }}>
          <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
            Créer un nouveau fournisseur
          </Text>
          
          <Box mb="3">
            <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>Nom *</Text>
            <TextField.Root
              placeholder="Nom du fournisseur"
              value={newSupplierData.name}
              onChange={(e) => setNewSupplierData({ ...newSupplierData, name: e.target.value })}
              disabled={loading}
            />
          </Box>

          <Box mb="3">
            <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>Contact</Text>
            <TextField.Root
              placeholder="Nom du contact"
              value={newSupplierData.contact}
              onChange={(e) => setNewSupplierData({ ...newSupplierData, contact: e.target.value })}
              disabled={loading}
            />
          </Box>

          <Box mb="3">
            <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>Email</Text>
            <TextField.Root
              type="email"
              placeholder="contact@fournisseur.com"
              value={newSupplierData.email}
              onChange={(e) => setNewSupplierData({ ...newSupplierData, email: e.target.value })}
              disabled={loading}
            />
          </Box>

          <Box mb="3">
            <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>Téléphone</Text>
            <TextField.Root
              placeholder="+33 1 23 45 67 89"
              value={newSupplierData.phone}
              onChange={(e) => setNewSupplierData({ ...newSupplierData, phone: e.target.value })}
              disabled={loading}
            />
          </Box>

          <Flex gap="2" justify="end">
            <Button
              variant="soft"
              color="gray"
              onClick={handleCancelCreate}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              color="blue"
              onClick={handleCreateSupplier}
              disabled={loading || !newSupplierData.name.trim()}
            >
              {loading ? 'Création...' : 'Créer et sélectionner'}
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  );
}

SupplierSearchableSelect.propTypes = {
  suppliers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    contact: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  })),
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
  ]),
  onChange: PropTypes.func.isRequired,
  onCreateSupplier: PropTypes.func.isRequired,
  required: PropTypes.bool,
  loading: PropTypes.bool,
};
