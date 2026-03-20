import { useCallback, useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE = 20;

export function usePaginatedList<T>(data: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const visibleData = useMemo(
    () => data.slice(0, visibleCount),
    [data, visibleCount],
  );

  const hasMore = visibleCount < data.length;

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((prev) => Math.min(prev + pageSize, data.length));
  }, [data.length, hasMore, pageSize]);

  const reset = useCallback(() => {
    setVisibleCount(pageSize);
  }, [pageSize]);

  return { visibleData, hasMore, loadMore, reset };
}
