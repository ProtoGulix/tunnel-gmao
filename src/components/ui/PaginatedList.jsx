import PropTypes from 'prop-types';
import { useMemo, useState, useEffect } from 'react';
import { Box, Flex, Text, Button } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const clampPage = (page, totalPages) => Math.min(Math.max(page, 1), totalPages || 1);

export default function PaginatedList({
  items,
  renderItem,
  pageSize = 8,
  emptyText = 'Aucun',
  itemLabel = 'resultat',
}) {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => Math.ceil(items.length / pageSize), [items.length, pageSize]);

  useEffect(() => {
    setPage((prev) => clampPage(prev, totalPages));
  }, [totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  if (!items.length) {
    return <Text size="2" color="gray">{emptyText}</Text>;
  }

  return (
    <Box>
      <Flex direction="column" gap="1">
        {paginated.map((item, index) => (
          <Box key={item?.id || index}>{renderItem(item, index)}</Box>
        ))}
      </Flex>

      {totalPages > 1 && (
        <Flex align="center" justify="between" mt="2">
          <Text size="1" color="gray">
            Page {page}/{totalPages} ({items.length} {itemLabel}{items.length > 1 ? 's' : ''})
          </Text>
          <Flex gap="2">
            <Button
              size="1"
              variant="soft"
              disabled={page === 1}
              onClick={() => setPage((p) => clampPage(p - 1, totalPages))}
            >
              <ChevronLeft size={14} />
              Precedent
            </Button>
            <Button
              size="1"
              variant="soft"
              disabled={page === totalPages}
              onClick={() => setPage((p) => clampPage(p + 1, totalPages))}
            >
              Suivant
              <ChevronRight size={14} />
            </Button>
          </Flex>
        </Flex>
      )}
    </Box>
  );
}

PaginatedList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  pageSize: PropTypes.number,
  emptyText: PropTypes.string,
  itemLabel: PropTypes.string,
};
