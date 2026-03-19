export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export function paginateArray<T>(
  items: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const page = Math.max(params.page ?? DEFAULT_PAGE, 1);
  const limit = Math.max(params.limit ?? DEFAULT_LIMIT, 1);
  const start = (page - 1) * limit;
  const pagedItems = items.slice(start, start + limit);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    items: pagedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
}
