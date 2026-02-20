import { Box, Flex, Button, Text, Select } from "@radix-ui/themes";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * Composant de pagination réutilisable
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Page actuelle (1-based)
 * @param {number} props.totalItems - Nombre total d'items
 * @param {number} props.itemsPerPage - Nombre d'items par page
 * @param {Function} props.onPageChange - Callback appelé lors du changement de page
 * @param {Function} props.onItemsPerPageChange - Callback appelé lors du changement du nombre d'items par page
 * @param {number[]} props.pageSizeOptions - Options de taille de page disponibles
 */
export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 50,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [25, 50, 100, 200]
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleFirstPage = () => {
    if (canGoPrevious) onPageChange(1);
  };

  const handlePreviousPage = () => {
    if (canGoPrevious) onPageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    if (canGoNext) onPageChange(currentPage + 1);
  };

  const handleLastPage = () => {
    if (canGoNext) onPageChange(totalPages);
  };

  const handlePageSizeChange = (value) => {
    const newSize = parseInt(value);
    // Calculer la nouvelle page pour garder approximativement les mêmes items visibles
    const firstItemIndex = (currentPage - 1) * itemsPerPage;
    const newPage = Math.floor(firstItemIndex / newSize) + 1;
    
    onItemsPerPageChange(newSize);
    onPageChange(Math.max(1, Math.min(newPage, Math.ceil(totalItems / newSize))));
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Nombre maximum de boutons de page visibles
    
    if (totalPages <= maxVisible) {
      // Si peu de pages, les afficher toutes
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique pour afficher les pages avec des ellipses
      const leftOffset = Math.max(1, currentPage - 1);
      const rightOffset = Math.min(totalPages, currentPage + 1);
      
      if (currentPage <= 3) {
        // Début: 1 2 3 4 ... 10
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Fin: 1 ... 7 8 9 10
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        // Milieu: 1 ... 4 5 6 ... 10
        pages.push(1);
        pages.push('...');
        for (let i = leftOffset; i <= rightOffset; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <Box>
      <Flex justify="between" align="center" gap="4" wrap="wrap">
        {/* Info sur les items affichés */}
        <Flex align="center" gap="2">
          <Text size="2" color="gray">
            {startItem}-{endItem} sur {totalItems}
          </Text>
          
          {/* Sélecteur de taille de page */}
          <Flex align="center" gap="2">
            <Text size="2" color="gray">par page:</Text>
            <Select.Root value={String(itemsPerPage)} onValueChange={handlePageSizeChange}>
              <Select.Trigger variant="soft" />
              <Select.Content>
                {pageSizeOptions.map(size => (
                  <Select.Item key={size} value={String(size)}>
                    {size}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
        </Flex>

        {/* Contrôles de navigation */}
        <Flex align="center" gap="2">
          {/* Première page */}
          <Button
            size="2"
            variant="soft"
            color="gray"
            disabled={!canGoPrevious}
            onClick={handleFirstPage}
            title="Première page"
          >
            <ChevronsLeft size={16} />
          </Button>

          {/* Page précédente */}
          <Button
            size="2"
            variant="soft"
            color="gray"
            disabled={!canGoPrevious}
            onClick={handlePreviousPage}
            title="Page précédente"
          >
            <ChevronLeft size={16} />
          </Button>

          {/* Numéros de page */}
          <Flex align="center" gap="1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <Text key={`ellipsis-${index}`} size="2" color="gray" px="2">
                    ...
                  </Text>
                );
              }
              
              return (
                <Button
                  key={page}
                  size="2"
                  variant={currentPage === page ? "solid" : "soft"}
                  color={currentPage === page ? "blue" : "gray"}
                  onClick={() => onPageChange(page)}
                  style={{ minWidth: '36px' }}
                >
                  {page}
                </Button>
              );
            })}
          </Flex>

          {/* Page suivante */}
          <Button
            size="2"
            variant="soft"
            color="gray"
            disabled={!canGoNext}
            onClick={handleNextPage}
            title="Page suivante"
          >
            <ChevronRight size={16} />
          </Button>

          {/* Dernière page */}
          <Button
            size="2"
            variant="soft"
            color="gray"
            disabled={!canGoNext}
            onClick={handleLastPage}
            title="Dernière page"
          >
            <ChevronsRight size={16} />
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
