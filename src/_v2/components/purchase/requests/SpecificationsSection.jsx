/**
 * Section des spécifications standard pour le panneau de détails DA
 * Composant réutilisable pour l'affichage et la gestion des spécifications
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Flex, Box, Text, Card, Button, Badge } from '@radix-ui/themes';
import { Plus, AlertCircle, FileText } from 'lucide-react';

function SpecsList({ standardSpecs }) {
  if (!standardSpecs?.length) return null;

  return (
    <Flex direction="column" gap="2">
      {standardSpecs.map((spec) => (
        <Card key={spec.id} style={{ background: spec.isDefault ? 'var(--blue-1)' : undefined }}>
          <Flex direction="column" gap="1" p="2">
            <Flex justify="between" align="start">
              <Text weight="bold" size="2">{spec.title}</Text>
              {spec.isDefault && <Badge color="blue" size="1">Par défaut</Badge>}
            </Flex>
            <Text size="1" color="gray">{spec.specText}</Text>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
}

SpecsList.propTypes = {
  standardSpecs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    specText: PropTypes.string,
    isDefault: PropTypes.bool,
  })),
};

function SpecsEmptyState({ show }) {
  if (!show) return null;
  return (
    <Flex direction="column" gap="1" align="center" p="3">
      <AlertCircle size={20} color="var(--gray-8)" />
      <Text size="2" color="gray">Aucune spécification standard</Text>
    </Flex>
  );
}

SpecsEmptyState.propTypes = {
  show: PropTypes.bool,
};

function SpecsAddForm({
  specFormData,
  setSpecFormData,
  onCancel,
  onSubmit,
  loading,
}) {
  return (
    <Flex direction="column" gap="3" p="3" style={{ borderTop: '1px solid var(--gray-4)' }}>
      <Text weight="bold" size="2">Ajouter une spécification</Text>

      <Box>
        <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>Titre</Text>
        <input
          type="text"
          placeholder="Ex: Température de fonctionnement"
          value={specFormData.title}
          onChange={(e) => setSpecFormData({ ...specFormData, title: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid var(--gray-6)',
            borderRadius: '6px',
          }}
        />
      </Box>

      <Box>
        <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>Description (optionnel)</Text>
        <textarea
          placeholder="Détails de la spécification"
          value={specFormData.spec_text}
          onChange={(e) => setSpecFormData({ ...specFormData, spec_text: e.target.value })}
          rows="4"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid var(--gray-6)',
            borderRadius: '6px',
            fontFamily: 'inherit',
          }}
        />
      </Box>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          checked={specFormData.isDefault}
          onChange={(e) => setSpecFormData({ ...specFormData, isDefault: e.target.checked })}
        />
        <Text size="2">Utiliser par défaut pour cet article</Text>
      </label>

      <Flex gap="2" justify="end">
        <Button
          variant="soft"
          color="gray"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          color="blue"
          onClick={onSubmit}
          disabled={loading || !specFormData.title.trim()}
        >
          {loading ? 'Enregistrement...' : 'Ajouter'}
        </Button>
      </Flex>
    </Flex>
  );
}

SpecsAddForm.propTypes = {
  specFormData: PropTypes.shape({
    title: PropTypes.string,
    spec_text: PropTypes.string,
    isDefault: PropTypes.bool,
  }).isRequired,
  setSpecFormData: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default function SpecificationsSection({
  requestId,
  standardSpecs = [],
  onAddStandardSpec,
  loading = false,
}) {
  const [isAddingSpec, setIsAddingSpec] = useState(false);
  const [specFormData, setSpecFormData] = useState({
    title: '',
    spec_text: '',
    isDefault: true,
  });

  const handleAddSpec = useCallback(async () => {
    if (!specFormData.title.trim()) {
      console.warn('Titre de spécification manquant');
      return;
    }

    try {
      await onAddStandardSpec(requestId, {
        title: specFormData.title,
        spec_text: specFormData.spec_text,
        is_default: specFormData.isDefault,
      });

      setSpecFormData({
        title: '',
        spec_text: '',
        isDefault: true,
      });
      setIsAddingSpec(false);
    } catch (error) {
      console.error('Erreur ajout spécification:', error);
    }
  }, [requestId, specFormData, onAddStandardSpec]);

  const handleCancel = useCallback(() => {
    setIsAddingSpec(false);
    setSpecFormData({ title: '', spec_text: '', isDefault: true });
  }, []);

  return (
    <Card>
      <Flex direction="column" gap="2" p="3">
        <Flex align="center" justify="between">
          <Flex align="center" gap="2">
            <FileText size={16} color="var(--gray-9)" />
            <Box>
              <Text weight="bold" size="3" pl="3">Spécifications standard</Text>
              <Badge variant="outline" size="3">{standardSpecs.length}</Badge>
            </Box>
          </Flex>
          {onAddStandardSpec && !isAddingSpec && (
            <Button size="2" variant="soft" color="blue" onClick={() => setIsAddingSpec(true)}>
              <Plus size={14} />
              Ajouter
            </Button>
          )}
        </Flex>

        <SpecsList standardSpecs={standardSpecs} />
        <SpecsEmptyState show={standardSpecs.length === 0 && !isAddingSpec} />

        {isAddingSpec && (
          <SpecsAddForm
            specFormData={specFormData}
            setSpecFormData={setSpecFormData}
            onCancel={handleCancel}
            onSubmit={handleAddSpec}
            loading={loading}
          />
        )}
      </Flex>
    </Card>
  );
}

SpecificationsSection.propTypes = {
  requestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  standardSpecs: PropTypes.arrayOf(PropTypes.object),
  onAddStandardSpec: PropTypes.func,
  loading: PropTypes.bool,
};
