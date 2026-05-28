import { PaginationMeta } from '@ayursutra/shared-types';

export function formatPaginatedResponse<T>(
  data: T[],
  limit: number,
  totalCount: number,
  nextCursorExtractor: (item: T) => string | undefined
): { data: T[]; meta: PaginationMeta } {
  const hasNextPage = data.length > limit;
  const slicedData = hasNextPage ? data.slice(0, limit) : data;
  const nextItem = slicedData[slicedData.length - 1];
  const cursor = nextItem ? nextCursorExtractor(nextItem) : undefined;

  return {
    data: slicedData,
    meta: {
      totalCount,
      limit,
      cursor: hasNextPage ? cursor : undefined,
      hasNextPage,
    },
  };
}
