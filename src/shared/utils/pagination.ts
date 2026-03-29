import { APP_CONSTANTS } from '../../config/constants';

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Parse pagination parameters from query string
 */
export function parsePagination(query: Record<string, any>): PaginationParams {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(
    APP_CONSTANTS.MAX_PAGE_SIZE,
    Math.max(1, parseInt(query.limit) || APP_CONSTANTS.DEFAULT_PAGE_SIZE)
  );
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return { page, limit, sortBy, sortOrder };
}

/**
 * Build a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Prisma-compatible skip/take from pagination params
 */
export function toPrismaPageArgs(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
    orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
  };
}
