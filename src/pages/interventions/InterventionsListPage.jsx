/**
 * Page Interventions List
 * 
 * Shell de 50 lignes max : barre de recherche + appel du tab.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import InterventionsListTab from '@/components/interventions/tabs/InterventionsListTab';

export default function InterventionsListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleNewIntervention = () => {
    navigate('/intervention/new');
  };

  return (
    <Box>
      <PageHeader
        title="Interventions"
        subtitle="Gestion des interventions de maintenance"
        onAdd={handleNewIntervention}
        addLabel="Nouvelle intervention"
      />

      <Container size="4" p="4">
        {/* Barre de recherche */}
        <Box mb="4">
          <TextField.Root
            placeholder="Rechercher par code machine, code intervention ou mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="3"
          >
            <TextField.Slot side="left">
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        {/* Tab avec la liste */}
        <InterventionsListTab searchTerm={searchTerm} />
      </Container>
    </Box>
  );
}
