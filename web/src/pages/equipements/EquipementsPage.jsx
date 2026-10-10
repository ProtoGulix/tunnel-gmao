/**
 * @fileoverview Page Équipements — master-detail (arbre ou liste à plat + fiche en lecture seule)
 * @module pages/equipements/EquipementsPage
 *
 * La sélection vit dans l'URL (?id=). Les classes se gèrent dans l'admin des référentiels.
 */

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Dialog, Flex } from '@radix-ui/themes';
import { Factory } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import EquipementList from '@/components/equipements/EquipementList';
import EquipementListFilters from '@/components/equipements/EquipementListFilters';
import EquipementDetailPanel from '@/components/equipements/EquipementDetailPanel';
import EquipementCreateForm from '@/components/equipements/EquipementCreateForm';
import { useEquipementsBrowser, FLAT_PAGE_SIZE } from '@/hooks/equipements/useEquipementsBrowser';
import { createEquipement } from '@/api/equipements';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';

export default function EquipementsPage() {
  const { can } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sort, setSort] = useState('health');
  const [preferredMode, setPreferredMode] = useState('tree');
  const [createOpen, setCreateOpen] = useState(false);

  // Une recherche ou un filtre de classe n'a de sens qu'à plat
  const filtering = search.trim() !== '' || classFilter !== '';
  const mode = filtering ? 'flat' : preferredMode;

  const browser = useEquipementsBrowser({ mode, search, classFilter, sort });
  const { expandPath, refresh } = browser;

  const select = useCallback((id) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('id', id);
      else next.delete('id');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Révèle l'équipement sélectionné dans l'arbre (lien direct, clic sur le fil d'Ariane…)
  const handleLoaded = useCallback((eq) => {
    if (mode === 'tree') expandPath((eq.ancestors ?? []).map((a) => a.id));
  }, [mode, expandPath]);

  const handleCreate = useCallback(async (payload) => {
    const created = await createEquipement(payload);
    await refresh();
    setCreateOpen(false);
    if (created?.id) select(String(created.id));
  }, [refresh, select]);

  const classOptions = useMemo(() => browser.facets.filter((f) => f.code !== null), [browser.facets]);

  const isFlat = mode === 'flat';
  const flatTotalPages = Math.max(1, Math.ceil(browser.flat.total / FLAT_PAGE_SIZE));
  const pagination = isFlat
    ? { currentPage: browser.page, totalPages: flatTotalPages, onPageChange: browser.setPage }
    : undefined;
  const count = isFlat ? browser.flat.total : browser.roots.items.length;
  const loading = isFlat ? browser.flat.loading : browser.roots.loading;
  const emptyLabel = 'Aucun équipement trouvé';

  const headerExtra = (
    <EquipementListFilters
      mode={mode}
      onModeChange={setPreferredMode}
      treeDisabled={filtering}
      sort={sort}
      onSortChange={setSort}
      classFilter={classFilter}
      onClassChange={setClassFilter}
      classOptions={classOptions}
    />
  );

  return (
    <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
      <PageHeader
        title="Équipements"
        subtitle="Parc d'équipements avec état de santé"
        icon={Factory}
        onAdd={can(PERM.equipements.create) ? () => setCreateOpen(true) : undefined}
        addLabel="Nouvel équipement"
      />

      <Box px="4" pt="3" style={{ flex: 1, minHeight: 500, overflow: 'hidden' }}>
        <MasterDetailLayout
          freeDetail
          ratio="35% 1fr"
          masterProps={{
            icon: Factory,
            title: 'Équipements',
            count,
            search,
            onSearchChange: setSearch,
            loading,
            headerExtra,
            pagination,
            children: (
              <EquipementList
                mode={mode}
                items={browser.flat.items}
                tree={browser}
                selectedId={selectedId}
                onSelect={select}
                emptyLabel={emptyLabel}
                error={browser.flat.error}
              />
            ),
          }}
          detailChildren={selectedId ? (
            <EquipementDetailPanel key={selectedId} id={selectedId} onLoaded={handleLoaded} />
          ) : null}
          emptyLabel="Sélectionnez un équipement pour voir sa fiche"
        />
      </Box>

      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Content maxWidth="720px">
          <Dialog.Title>Nouvel équipement</Dialog.Title>
          <EquipementCreateForm onCancel={() => setCreateOpen(false)} onSubmit={handleCreate} />
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}
